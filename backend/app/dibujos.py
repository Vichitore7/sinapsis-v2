"""Dibujos del tutor: Claude no genera imágenes; describe qué dibujar y la app lo pinta con los stickers del juego
(los mismos de `frontend/src/componentes/Canal.jsx`, componente VisualCanal).

Aquí está el esquema JSON que Claude debe seguir y la validación: un dibujo que no cumple los límites se descarta
(la respuesta de texto se queda). Los tipos y límites están explicados para Claude en `agente.md`, sección 4B.
"""
from __future__ import annotations

import json
import re
from fractions import Fraction

from . import operaciones

OBJETOS = ["flor", "pez", "persona", "sombrerito", "jarrito"]
COLORES = ["rojo", "azul", "verde", "amarillo", "rosa"]
FIGURAS = ["triangulo", "circulo", "cuadrado", "rectangulo"]
TIPOS = ["objetos", "grupos", "quitar", "recta", "decenas", "monedas", "grafica", "figura",
         "fracciones", "balanza", "porcentaje", "tabla"]
FORMAS = ["circulo", "barra"]
MONEDAS = {1, 2, 5, 10}

# Esquema para output_config.format. Es a propósito MUY simple: con un esquema grande (un campo por cada dato de
# cada tipo de dibujo) Claude tardaba más de 20 s en prepararlo o lo rechazaba ("Schema is too complex").
# Claude dice el `tipo` y manda los datos del dibujo como texto JSON en `datos`; validar() los lee y revisa los límites.
ESQUEMA = {
    "type": "object",
    "properties": {
        "respuesta": {"type": "string"},
        "dibujo": {
            "anyOf": [
                {"type": "null"},
                {
                    "type": "object",
                    "properties": {"tipo": {"type": "string", "enum": TIPOS}, "datos": {"type": "string"}},
                    "required": ["tipo", "datos"],
                    "additionalProperties": False,
                },
            ]
        },
    },
    "required": ["respuesta", "dibujo"],
    "additionalProperties": False,
}


def _aplanar(d) -> dict | None:
    """{"tipo": "grupos", "datos": '{"grupos": [2, 2]}'} -> {"tipo": "grupos", "grupos": [2, 2]}.
    También acepta el formato plano (lo usan la escalera de estrategia.py y las pruebas)."""
    if not isinstance(d, dict):
        return None
    if isinstance(d.get("datos"), str):
        if len(d["datos"]) > 2000:
            return None
        try:
            datos = json.loads(d["datos"])
        except ValueError:
            return None
        if not isinstance(datos, dict):
            return None
        return {**datos, "tipo": d.get("tipo")}
    return d


def _ent(d: dict, clave: str, minimo: int, maximo: int) -> int | None:
    v = d.get(clave)
    return v if isinstance(v, int) and not isinstance(v, bool) and minimo <= v <= maximo else None


def validar(d: dict | None) -> dict | None:
    """Regresa el dibujo en el formato de VisualCanal, o None si no cumple los límites."""
    d = _aplanar(d)
    if not isinstance(d, dict):
        return None
    tipo = d.get("tipo")
    objeto = d.get("objeto") if d.get("objeto") in OBJETOS else "flor"
    if tipo == "objetos":
        n = _ent(d, "cantidad", 1, 30)
        return {"tipo": "objetos", "objeto": objeto, "cantidad": n} if n else None
    if tipo == "grupos":
        g = d.get("grupos")
        if isinstance(g, list) and 1 <= len(g) <= 6 and all(isinstance(x, int) and 1 <= x <= 10 for x in g):
            return {"tipo": "grupos", "objeto": objeto, "grupos": g}
        return None
    if tipo == "quitar":
        total, quitar = _ent(d, "total", 1, 20), _ent(d, "quitar", 0, 20)
        if total and quitar is not None and quitar <= total:
            return {"tipo": "quitar", "objeto": objeto, "total": total, "quitar": quitar}
        return None
    if tipo == "recta":
        hasta = _ent(d, "hasta", 5, 20)
        inicio = _ent(d, "inicio", 0, hasta) if hasta else None
        return {"tipo": "recta", "hasta": hasta, "inicio": inicio} if hasta and inicio is not None else None
    if tipo == "decenas":
        ramos, sueltas = _ent(d, "ramos", 0, 9), _ent(d, "sueltas", 0, 9)
        if ramos is not None and sueltas is not None and ramos + sueltas > 0:
            return {"tipo": "decenas", "ramos": ramos, "sueltas": sueltas}
        return None
    if tipo == "monedas":
        m = d.get("monedas")
        if isinstance(m, list) and 1 <= len(m) <= 8 and all(x in MONEDAS for x in m):
            return {"tipo": "monedas", "monedas": m}
        return None
    if tipo == "grafica":
        barras = d.get("barras")
        if not (isinstance(barras, list) and 2 <= len(barras) <= 5):
            return None
        limpias = []
        for b in barras:
            if not (isinstance(b, dict) and b.get("color") in COLORES and _ent(b, "valor", 0, 10) is not None):
                return None
            limpias.append({"etiqueta": str(b.get("etiqueta", ""))[:14], "color": b["color"], "valor": b["valor"]})
        if max(b["valor"] for b in limpias) == 0:
            return None
        return {"tipo": "grafica", "titulo": str(d.get("titulo", ""))[:60], "barras": limpias}
    if tipo == "figura":
        f = d.get("figura")
        return {"tipo": "figura", "figura": f, "donde": "dibujo"} if f in FIGURAS else None
    if tipo == "fracciones":
        lista = d.get("fracciones")
        if not (isinstance(lista, list) and 1 <= len(lista) <= 3):
            return None
        limpias = []
        for t in lista:
            f = operaciones.numero(t)
            m = re.match(r"^\s*\d+\s*/\s*(\d+)\s*$", str(t))
            den = int(m.group(1)) if m else 1
            if f is None or not (1 <= den <= 12) or f > 2:  # hasta 2 enteros, partes de 1 a 12
                return None
            limpias.append(str(t).replace(" ", ""))
        return {"tipo": "fracciones", "forma": d.get("forma") if d.get("forma") in FORMAS else "circulo",
                "fracciones": limpias}
    if tipo == "balanza":
        izq, der = str(d.get("izquierda") or "").strip(), str(d.get("derecha") or "").strip()
        valido = re.compile(r"^[0-9a-zA-Z+\-−×·*/=() ]{1,20}$")
        return {"tipo": "balanza", "izquierda": izq, "derecha": der} if valido.match(izq) and valido.match(der) else None
    if tipo == "porcentaje":
        n = _ent(d, "coloreadas", 0, 100)
        return {"tipo": "porcentaje", "coloreadas": n} if n is not None else None
    if tipo == "tabla":
        cols, filas = d.get("columnas"), d.get("filas")
        if not (isinstance(cols, list) and 2 <= len(cols) <= 3 and isinstance(filas, list) and 1 <= len(filas) <= 6):
            return None
        if not all(isinstance(f, list) and len(f) == len(cols) for f in filas):
            return None
        corto = lambda x, n: str(x).strip()[:n]
        return {"tipo": "tabla", "columnas": [corto(c, 14) for c in cols],
                "filas": [[corto(c, 10) for c in f] for f in filas]}
    return None


def numeros_que_muestra(d: dict) -> list[int]:
    """Los totales que se obtienen al contar el dibujo (para no revelar un resultado)."""
    t = d["tipo"]
    if t == "objetos":
        return [d["cantidad"]]
    if t == "grupos":
        return [sum(d["grupos"])]
    if t == "quitar":
        return [d["total"] - d["quitar"], d["total"]]
    if t == "recta":
        return [d["inicio"]]
    if t == "decenas":
        return [d["ramos"] * 10 + d["sueltas"]]
    if t == "monedas":
        return [sum(d["monedas"])]
    if t == "grafica":
        valores = [b["valor"] for b in d["barras"]]
        return valores + [sum(valores)]
    if t == "porcentaje":
        return [d["coloreadas"]]
    return []


def valores_que_muestra(d: dict) -> tuple[list[int], list[Fraction], str]:
    """(enteros que salen al contar, fracciones que se ven, texto escrito en el dibujo) para el filtro del tutor."""
    t = d["tipo"]
    fracciones = []
    texto = ""
    if t == "fracciones":
        fracciones = [operaciones.numero(x) for x in d["fracciones"]]  # se revisan por su valor, no como texto
    elif t == "porcentaje":
        fracciones = [Fraction(d["coloreadas"], 100)]
    elif t == "balanza":
        texto = f"{d['izquierda']} = {d['derecha']}"
    elif t == "tabla":
        texto = " ".join(" ".join(f) for f in d["filas"])
    return numeros_que_muestra(d), fracciones, texto
