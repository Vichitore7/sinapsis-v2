"""Evaluación pedagógica del tutor (fase 4): conversaciones reales con Claude y revisión automática + juez opcional.

    cd backend
    uv run python -m evaluacion.evaluar                       # todo, con el modelo y esfuerzo del .env
    uv run python -m evaluacion.evaluar --esfuerzo low        # comparar esfuerzos
    uv run python -m evaluacion.evaluar --juez                # además, un modelo califica cada conversación (1 a 5)
    uv run python -m evaluacion.evaluar --solo p3-mult-atorado

GASTA SALDO (usa la ANTHROPIC_API_KEY de backend/.env): ~90 mensajes del tutor ≈ $0.05 USD con Haiku;
el juez (Claude Opus 5.5 por defecto, --modelo-juez para cambiarlo) ≈ $0.80 más.
Usa una base de datos temporal: no toca selva.db. El reporte queda en evaluacion/resultados/ (no se sube a git).
"""
from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

RESULTADOS = Path(__file__).resolve().parent / "resultados"


def preparar_app(esfuerzo: str | None, modelo: str | None):
    """La app con una base temporal y sin límite de mensajes."""
    base = Path(tempfile.mkdtemp()) / "evaluacion.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{base}"
    os.environ.setdefault("SECRET_KEY", "clave-solo-para-la-evaluacion-con-32-caracteres")
    from app import config  # noqa: E402  (después de fijar el entorno)
    if esfuerzo:
        config.TUTOR_ESFUERZO = esfuerzo
    if modelo:
        config.TUTOR_MODELO = modelo
    config.TUTOR_LIMITE_HORA = config.TUTOR_LIMITE_DIA = 10_000
    if not config.TUTOR_ACTIVO:
        sys.exit("Falta ANTHROPIC_API_KEY en backend/.env: la evaluación necesita a Claude.")
    from fastapi.testclient import TestClient
    from app.main import app
    cliente = TestClient(app, raise_server_exceptions=False)  # un error del servidor se anota, no detiene la corrida
    cliente.__enter__()  # corre el arranque de la app: crea las tablas y carga el contenido en la base temporal
    return cliente, config


# ---------------- Revisión automática (código) ----------------

def revisar_turnos(turnos: list[dict], escenario: dict) -> list[str]:
    """Problemas que el código puede detectar solo. Lista vacía = todo bien."""
    problemas = []
    for i, t in enumerate(turnos):
        r = t["respuesta"]
        if t["origen"] != "claude":
            problemas.append(f"turno {i + 1}: cayó a reglas (filtro, error o sin conexión)")
        if "🦎" in r:
            problemas.append(f"turno {i + 1}: usa 🦎")
        if r.count("?") > 2:
            problemas.append(f"turno {i + 1}: hace {r.count('?')} preguntas (máximo 2)")
        if len(r) > 650:
            problemas.append(f"turno {i + 1}: respuesta larga ({len(r)} caracteres)")
        for patron in escenario.get("prohibido", []):
            if re.search(patron, r, re.I):
                problemas.append(f"turno {i + 1}: dijo algo prohibido ({patron})")
        if i and difflib.SequenceMatcher(None, turnos[i - 1]["respuesta"], r).ratio() > 0.75:
            problemas.append(f"turno {i + 1}: casi igual a la respuesta anterior (recicla)")
    return problemas


# ---------------- Juez (opcional) ----------------

RUBRICA = """Eres una maestra experta en didáctica de las matemáticas para primaria y secundaria en México.
Evalúa la conversación entre un alumno y Mix, un tutor que NUNCA debe dar el resultado del ejercicio del alumno
(sí puede resolver un ejemplo parecido con otros números o los pasos hasta el penúltimo).
Califica de 1 (muy mal) a 5 (excelente):
- guia_sin_dar: guía con preguntas y pistas sin revelar el resultado.
- adapta_nivel: lenguaje y explicación adecuados al grado y a lo que el alumno ya sabe (si viene en el contexto).
- no_complica: no le cambia el problema ni lo hace más difícil; no se repite; avanza cuando el alumno avanza.
- claridad: cada mensaje es claro, breve y con una sola idea.
- calidez: trato cálido y respetuoso, sin regañar ni exagerar elogios.
Escribe en `comentario` (en español, 1 o 2 frases) lo más importante que mejorarías."""

ESQUEMA_JUEZ = {"type": "object", "properties": {k: {"type": "integer"} for k in
                ("guia_sin_dar", "adapta_nivel", "no_complica", "claridad", "calidez")} | {"comentario": {"type": "string"}},
                "required": ["guia_sin_dar", "adapta_nivel", "no_complica", "claridad", "calidez", "comentario"],
                "additionalProperties": False}


def juzgar(cliente_claude, modelo_juez: str, escenario: dict, turnos: list[dict]) -> dict | None:
    import anthropic
    conversacion = "\n".join(f"ALUMNO: {t['mensaje']}\nKIKO: {t['respuesta']}" + (f"\n[dibujo: {t['dibujo']}]" if t["dibujo"] else "")
                             for t in turnos)
    contexto = (f"Grado: {escenario['grado']}. Qué se prueba: {escenario['que_prueba']}. "
                f"Lo que se espera: {escenario.get('espera', '')}\n"
                f"Ejercicio: {escenario.get('operacion') or escenario.get('ejercicio') or 'ninguno (duda de tema)'}\n"
                f"Antes ya había resuelto en el escáner: {escenario.get('antes') or 'nada'}\n\n{conversacion}")
    try:
        r = cliente_claude.messages.create(
            model=modelo_juez, max_tokens=4000, system=RUBRICA,
            output_config={"effort": "medium", "format": {"type": "json_schema", "schema": ESQUEMA_JUEZ}},
            messages=[{"role": "user", "content": contexto}])
        return json.loads(next(b.text for b in r.content if b.type == "text"))
    except (anthropic.APIError, StopIteration, ValueError) as e:
        print(f"   (el juez falló: {e})")
        return None


# ---------------- Corrida ----------------

def correr(args) -> Path:
    from evaluacion.escenarios import ESCENARIOS
    cliente, config = preparar_app(args.esfuerzo, args.modelo)
    escenarios = [e for e in ESCENARIOS if not args.solo or e["id"] in args.solo]
    juez = None
    if args.juez:
        import anthropic
        juez = anthropic.Anthropic(timeout=120, max_retries=2)

    resultados = []
    for n, esc in enumerate(escenarios, start=1):
        # Un alumno nuevo por escenario (memoria limpia).
        usuario = f"eval{n}_{int(time.time()) % 100000}"
        cliente.cookies.clear()
        r = cliente.post("/api/auth/registro", json={"usuario": usuario, "apodo": "Eval", "password": "selva123", "rol": "alumno"})
        assert r.status_code == 201, r.text
        for op in esc.get("antes", []):
            cliente.post("/api/escaner/resultado", json=op)
        if esc.get("operacion"):
            cliente.post("/api/escaner/resultado", json=esc["operacion"])  # como si la acabara de confirmar
        print(f"[{n}/{len(escenarios)}] {esc['id']}: {esc['que_prueba']}")
        historial, turnos = [], []
        for mensaje in esc["mensajes"]:
            cuerpo = {"mensaje": mensaje, "historial": historial, "grado": esc["grado"]}
            if esc.get("operacion"):
                cuerpo["operacion"] = esc["operacion"]
            if esc.get("ejercicio"):
                cuerpo["ejercicio"] = esc["ejercicio"]
            t0 = time.monotonic()
            http = cliente.post("/api/tutor", json=cuerpo)
            resp = http.json() if http.status_code == 200 else {"respuesta": f"[ERROR DEL SERVIDOR {http.status_code}]", "origen": "error"}
            turnos.append({"mensaje": mensaje, "respuesta": resp["respuesta"], "origen": resp["origen"],
                           "dibujo": resp.get("dibujo"), "segundos": round(time.monotonic() - t0, 1)})
            historial += [{"de": "yo", "texto": mensaje}, {"de": "kiko", "texto": resp["respuesta"]}]
        problemas = revisar_turnos(turnos, esc)
        calificacion = juzgar(juez, args.modelo_juez, esc, turnos) if juez else None
        print(f"   {'✅' if not problemas else '⚠️ ' + '; '.join(problemas)}"
              + (f" · juez: {sum(v for k, v in calificacion.items() if k != 'comentario') / 5:.1f}/5" if calificacion else ""))
        resultados.append({"escenario": esc, "turnos": turnos, "problemas": problemas, "juez": calificacion})

    return escribir_reporte(resultados, config, args)


def escribir_reporte(resultados: list[dict], config, args) -> Path:
    RESULTADOS.mkdir(exist_ok=True)
    nombre = f"{datetime.now():%Y-%m-%d_%H%M}_{config.TUTOR_MODELO}_{config.TUTOR_ESFUERZO}"
    (RESULTADOS / f"{nombre}.json").write_text(json.dumps(resultados, ensure_ascii=False, indent=1), encoding="utf-8")

    turnos = [t for r in resultados for t in r["turnos"]]
    sin_problemas = sum(1 for r in resultados if not r["problemas"])
    reglas = sum(1 for t in turnos if t["origen"] != "claude")
    lineas = [f"# Evaluación del tutor: {config.TUTOR_MODELO}, esfuerzo {config.TUTOR_ESFUERZO}",
              f"_{datetime.now():%d/%m/%Y %H:%M}_\n",
              f"- Escenarios sin problemas detectados por código: **{sin_problemas} de {len(resultados)}**",
              f"- Mensajes: {len(turnos)} · cayeron a reglas: {reglas} · tiempo promedio: "
              f"{sum(t['segundos'] for t in turnos) / max(1, len(turnos)):.1f} s"]
    juzgados = [r["juez"] for r in resultados if r["juez"]]
    criterios = ("guia_sin_dar", "adapta_nivel", "no_complica", "claridad", "calidez")
    if juzgados:
        lineas.append(f"- Juez ({args.modelo_juez}), promedio de 1 a 5: " + ", ".join(
            f"{c} **{sum(j[c] for j in juzgados) / len(juzgados):.1f}**" for c in criterios))
    lineas += ["", "| Escenario | Qué prueba | Código | Juez |", "|---|---|---|---|"]
    for r in resultados:
        j = r["juez"]
        lineas.append(f"| {r['escenario']['id']} | {r['escenario']['que_prueba']} | "
                      f"{'✅' if not r['problemas'] else '⚠️ ' + '<br>'.join(r['problemas'])} | "
                      f"{' '.join(str(j[c]) for c in criterios) + ' — ' + j['comentario'] if j else '—'} |")
    lineas.append("\n## Conversaciones\n")
    for r in resultados:
        lineas.append(f"### {r['escenario']['id']} ({r['escenario']['grado']})")
        for t in r["turnos"]:
            lineas.append(f"- **Alumno:** {t['mensaje']}\n- **Mix** ({t['origen']}, {t['segundos']} s): {t['respuesta']}"
                          + (f"\n  - _dibujo:_ `{json.dumps(t['dibujo'], ensure_ascii=False)}`" if t["dibujo"] else ""))
        lineas.append("")
    ruta = RESULTADOS / f"{nombre}.md"
    ruta.write_text("\n".join(lineas), encoding="utf-8")
    return ruta


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--esfuerzo", choices=["low", "medium", "high"])
    p.add_argument("--modelo")
    p.add_argument("--juez", action="store_true", help="un modelo califica cada conversación (gasta más)")
    p.add_argument("--modelo-juez", default="claude-opus-5-5")
    p.add_argument("--solo", nargs="*", help="ids de escenarios")
    ruta = correr(p.parse_args())
    print(f"\nReporte: {ruta}")


if __name__ == "__main__":
    main()
