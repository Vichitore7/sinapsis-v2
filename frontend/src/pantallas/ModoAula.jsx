// Modo Aula (Modo-aula.md): el maestro dirige una prueba corta desde un solo dispositivo.
// Sin ranking, apodos en lugar de nombres, error en durazno (nunca rojo).
import { useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import Ajolote from '../componentes/Ajolote.jsx';
import ModeloVisual from '../componentes/ModeloVisual.jsx';
import { Barra, Marcas } from '../componentes/Comunes.jsx';
import { ERRORES_TIPICOS, buscarMundo, buscarReto, formatoNumero } from '../contenido/mundos.js';
import { VALORES, hoy } from '../logica/juego.js';
import {
  aulaInicial, iniciarSesion, limpiarApodos, marcar, progresoAlumno, resumenSesion, siguienteReto, terminarSesion,
} from '../logica/aula.js';

function ConfigurarGrupo({ aula, onGuardar, onCancelar }) {
  const [grupo, setGrupo] = useState(aula?.grupo || '');
  const [texto, setTexto] = useState(aula?.apodos.join('\n') || '');
  const apodos = limpiarApodos(texto.split('\n'));
  const listo = grupo.trim() && apodos.length > 0;
  return (
    <section className="sm-card">
      <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>{aula ? 'Editar grupo' : 'Prepara tu grupo'}</h2>
      <p className="cuerpo texto-suave" style={{ marginTop: 0 }}>
        Un solo dispositivo dirige la prueba. Los alumnos responden en su cuaderno. Funciona sin internet.
      </p>
      <div className="col-3">
        <label className="cuerpo-fuerte" htmlFor="grupo">Nombre del grupo</label>
        <input id="grupo" className="sm-input sm-input-texto" value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ej. 5.º B" />
        <label className="cuerpo-fuerte" htmlFor="apodos">Apodos o códigos (uno por línea)</label>
        <textarea id="apodos" className="sm-textarea" rows={7} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={'Luna\nTeo\nSol'} />
        <p className="etiqueta texto-suave" style={{ margin: 0 }}>Nunca nombres completos. {apodos.length} alumno(s).</p>
        <div className="acciones">
          <button className="sm-btn" disabled={!listo} onClick={() => onGuardar(grupo.trim(), apodos)}>Guardar grupo</button>
          {onCancelar && <button className="sm-btn sm-btn-suave" onClick={onCancelar}>Cancelar</button>}
        </div>
      </div>
    </section>
  );
}

function MetaSalon({ aula }) {
  const llego = aula.premiosSalon > 0;
  return (
    <section className="sm-card">
      <div className="fila-ajolote">
        <Ajolote estado={llego ? 'celebrando' : 'feliz'} tamano={100} accesorios={llego ? ['bufanda'] : []} etiqueta={`Ajolote del ${aula.grupo}`} />
        <div style={{ flex: 1 }}>
          <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Expedición del {aula.grupo}</h2>
          <Barra valor={aula.meta} max={VALORES.metaSalon} etiqueta="Estrellas del salón" />
          <div className="datos">
            <strong>★ {aula.meta} de {VALORES.metaSalon}</strong>
            <span>Meta: accesorio nuevo</span>
          </div>
          {llego && <p className="etiqueta" style={{ margin: 'var(--espacio-2) 0 0' }}>Premios ganados por el salón: {aula.premiosSalon}</p>}
        </div>
      </div>
    </section>
  );
}

function PanelMaestro({ sesion, aula, mundos }) {
  const r = resumenSesion(sesion, aula.apodos, mundos);
  if (!r.mundo) return null;
  const maxErr = Math.max(1, ...r.errores.map((e) => e.alumnos));
  return (
    <section className="sm-card">
      <div className="fila-entre" style={{ marginBottom: 'var(--espacio-3)' }}>
        <h2 className="subtitulo" style={{ margin: 0 }}>Resultados · {r.mundo.nombre}</h2>
        <span className="sm-chip">{aula.grupo} · {aula.apodos.length} alumnos</span>
      </div>
      <p className="etiqueta texto-magia" style={{ marginTop: 0 }}>Panel del maestro: no lo proyectes.</p>

      <div className="sec">
        <h3 className="cuerpo-fuerte">Resultado del grupo</h3>
        <Barra valor={r.aciertos} max={r.total} color="magia" etiqueta={`${r.aciertos} de ${r.total} respuestas correctas`} />
        <p className="cuerpo" style={{ margin: 'var(--espacio-2) 0 0' }}><strong>{r.aciertos} de {r.total}</strong> respuestas marcadas fueron correctas</p>
      </div>

      <div className="sec">
        <h3 className="cuerpo-fuerte">Errores más comunes</h3>
        {r.errores.length === 0 && <p className="etiqueta texto-suave">No se marcaron errores típicos. Solo se cuentan aciertos y fallos.</p>}
        {r.errores.map((e) => (
          <div key={e.id} className="fila-error">
            <span>{e.texto}</span>
            <Barra valor={e.alumnos} max={maxErr} color="magia" etiqueta={`${e.alumnos} veces`} />
            <b>{e.alumnos}</b>
          </div>
        ))}
        {r.sinError > 0 && <span className="etiqueta texto-suave">Hay {r.sinError} ✗ sin un error marcado.</span>}
      </div>

      {r.refuerzo && (
        <div className="sec">
          <h3 className="cuerpo-fuerte">Qué reforzar mañana</h3>
          <div className="sugerencia">{r.refuerzo}</div>
        </div>
      )}

      <div className="sec">
        <h3 className="cuerpo-fuerte">Alumnos que necesitan apoyo</h3>
        {r.apoyo.length ? (
          <div className="chips">{r.apoyo.map((a) => <span key={a} className="sm-chip">{a}</span>)}</div>
        ) : (
          <p className="etiqueta texto-suave">Nadie por ahora.</p>
        )}
        <span className="etiqueta texto-magia">Privado · solo tú lo ves</span>
      </div>

      {aula.sesiones.length > 1 && (
        <div className="sec">
          <h3 className="cuerpo-fuerte">Progreso de cada alumno ({aula.sesiones.length} sesiones)</h3>
          {[...aula.apodos].sort((x, y) => x.localeCompare(y, 'es')).map((a) => {
            const p = progresoAlumno(aula.sesiones, a);
            if (p === null) return null;
            return (
              <div key={a} className="fila-progreso">
                <b>{a}</b>
                <Marcas valor={p} etiqueta={`${a}: ${p} de 5 en multiplicación`} />
                <span className="etiqueta texto-suave">Multiplicación</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Registro({ aula, mundos, onMarcar, onSiguiente }) {
  const s = aula.sesionActual;
  const reto = buscarReto(mundos, s.retos[s.indice]);
  const marcas = s.marcas[reto.id] || {};
  const marcados = aula.apodos.filter((a) => marcas[a]).length;
  const aciertos = aula.apodos.filter((a) => marcas[a]?.ok).length;
  return (
    <section className="sm-card">
      <h2 className="subtitulo" style={{ margin: 0 }}>Reto {s.indice + 1} de {s.retos.length} · {reto.a} × {formatoNumero(reto.b, reto.moneda)}</h2>
      <p className="etiqueta texto-suave">Marca cómo le fue a cada quien</p>
      {aula.apodos.map((apodo) => {
        const m = marcas[apodo];
        const mal = m && !m.ok;
        return (
          <div key={apodo} className={`item-registro${mal ? ' mal' : ''}`}>
            <div className="fila-registro">
              <span className="apodo">{apodo}</span>
              <button className={`mk${m?.ok ? ' ok' : ''}`} aria-label={`${apodo}: acertó`} aria-pressed={Boolean(m?.ok)}
                onClick={() => onMarcar(apodo, m?.ok ? null : { ok: true })}>✓</button>
              <button className={`mk${mal ? ' no' : ''}`} aria-label={`${apodo}: falló`} aria-pressed={Boolean(mal)}
                onClick={() => onMarcar(apodo, mal ? null : { ok: false })}>✗</button>
            </div>
            {mal && (
              <div className="tipicos">
                <span className="rotulo">¿Qué pasó? (opcional)</span>
                {ERRORES_TIPICOS.map((e) => (
                  <button key={e.id} className={`tip${m.error === e.id ? ' sel' : ''}`}
                    onClick={() => onMarcar(apodo, { ok: false, error: m.error === e.id ? undefined : e.id })}>
                    {e.texto}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="pie-registro">
        <span className="etiqueta texto-suave">{marcados} de {aula.apodos.length} marcados</span>
        <div className="fila-ajolote">
          {marcados > 0 && <Ajolote estado={aciertos * 2 >= marcados ? 'celebrando' : 'curioso'} tamano={56} etiqueta="Reacción del ajolote del salón" />}
          <button className="sm-btn" onClick={onSiguiente}>{s.indice + 1 < s.retos.length ? 'Siguiente reto' : 'Terminar prueba'}</button>
        </div>
      </div>
    </section>
  );
}

function Proyectar({ aula, mundos, onRevelar }) {
  const s = aula.sesionActual;
  const reto = buscarReto(mundos, s.retos[s.indice]);
  return (
    <section className="sm-card proyectable">
      <div className="fila-entre" style={{ marginBottom: 'var(--espacio-3)' }}>
        <span className="sm-chip">Reto {s.indice + 1} de {s.retos.length}</span>
        <span className="sm-chip sm-chip-sol">Expedición del {aula.grupo}</span>
      </div>
      <h2 className="titulo" style={{ margin: '0 0 var(--espacio-2)' }}>{reto.titulo}</h2>
      <p className="cuerpo grande">{reto.enunciado}</p>
      <ModeloVisual etapa={Math.max(reto.etapaMin, reto.b > 12 ? 2 : 1)} a={reto.a} b={reto.b} moneda={reto.moneda} />
      <p className="numero-reto" style={{ margin: 'var(--espacio-3) 0' }}>{reto.a} × {formatoNumero(reto.b, reto.moneda)} = ?</p>
      <p className="etiqueta texto-suave">Resuélvanlo en el cuaderno, solos o en equipo.</p>
      <button className="sm-btn" onClick={onRevelar}>Revelar respuesta</button>
    </section>
  );
}

function Revelado({ aula, mundos }) {
  const s = aula.sesionActual;
  const reto = buscarReto(mundos, s.retos[s.indice]);
  const sumas = Array.from({ length: reto.a }, () => reto.b).join(' + ');
  return (
    <section className="sm-acierto">
      <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>✓ La respuesta</h2>
      <p className="numero-reto" style={{ margin: 0 }}>{reto.a} × {formatoNumero(reto.b, reto.moneda)} = {formatoNumero(reto.a * reto.b, reto.moneda)}</p>
      <p className="cuerpo" style={{ margin: 'var(--espacio-2) 0 0' }}>Es juntar {reto.a} montones de {reto.b}: {sumas}.</p>
    </section>
  );
}

export default function ModoAula() {
  const { estado, mundos, actualizar } = useJuego();
  const aula = estado.aula;
  const [editando, setEditando] = useState(false);
  const [revelado, setRevelado] = useState(false);
  const [verSesion, setVerSesion] = useState(null);
  // El Modo Aula sin internet usa los mundos de multiplicación (monedas y montones).
  const mundosConRetos = mundos.filter((m) => m.retos.length > 0 && m.retos.every((r) => r.op === '×'));
  const [mundoId, setMundoId] = useState(mundosConRetos[0]?.id);

  const guardarAula = (fn) => actualizar((s) => ({ ...s, aula: fn(s.aula) }));

  if (!aula || editando) {
    return (
      <div className="pila">
        <ConfigurarGrupo
          aula={aula}
          onCancelar={aula ? () => setEditando(false) : null}
          onGuardar={(grupo, apodos) => {
            guardarAula((a) => (a ? { ...a, grupo, apodos } : aulaInicial(grupo, apodos)));
            setEditando(false);
          }}
        />
      </div>
    );
  }

  if (aula.sesionActual) {
    return (
      <div className="pila aula-sesion">
        <MetaSalon aula={aula} />
        {!revelado ? (
          <Proyectar aula={aula} mundos={mundos} onRevelar={() => setRevelado(true)} />
        ) : (
          <>
            <Revelado aula={aula} mundos={mundos} />
            <Registro
              aula={aula}
              mundos={mundos}
              onMarcar={(apodo, m) => guardarAula((a) => marcar(a, apodo, m))}
              onSiguiente={() => {
                const r = siguienteReto(aula);
                guardarAula(() => r.aula);
                setRevelado(false);
                if (r.terminada) setVerSesion(r.aula.sesiones.length - 1);
              }}
            />
          </>
        )}
        <button className="sm-btn sm-btn-suave" onClick={() => {
          const fin = terminarSesion(aula);
          guardarAula(() => fin);
          setRevelado(false);
          setVerSesion(fin.sesiones.length - 1);
        }}>
          Terminar la prueba ahora
        </button>
      </div>
    );
  }

  const sesion = verSesion !== null ? aula.sesiones[verSesion] : aula.sesiones[aula.sesiones.length - 1];

  return (
    <div className="pila dos-columnas aula-tablero">
      <MetaSalon aula={aula} />

      <section className="sm-card">
        <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Nueva prueba</h2>
        <p className="cuerpo texto-suave" style={{ marginTop: 0 }}>Un reto a la vez, a tu ritmo. Sin rankings. Funciona sin internet: todo se guarda en este dispositivo.</p>
        <div className="col-3">
          <label className="cuerpo-fuerte" htmlFor="mundo">Mundo</label>
          <select id="mundo" className="sm-select" value={mundoId} onChange={(e) => setMundoId(e.target.value)}>
            {mundosConRetos.map((m) => (
              <option key={m.id} value={m.id}>Mundo {m.numero}: {m.nombre} ({m.retos.length} retos)</option>
            ))}
          </select>
          <div className="acciones">
            <button className="sm-btn" onClick={() => { guardarAula((a) => iniciarSesion(a, buscarMundo(mundos, mundoId), hoy())); setRevelado(false); }}>
              Empezar prueba
            </button>
            <button className="sm-btn sm-btn-suave" onClick={() => setEditando(true)}>Editar grupo</button>
          </div>
        </div>
      </section>

      {sesion && <PanelMaestro sesion={sesion} aula={aula} mundos={mundos} />}

      {aula.sesiones.length > 1 && (
        <section className="sm-card">
          <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-2)' }}>Pruebas anteriores</h2>
          <div className="chips">
            {aula.sesiones.map((s, i) => (
              <button key={i} className={`tip${sesion === s ? ' sel-magia' : ''}`} onClick={() => setVerSesion(i)}>
                {s.fecha} · {buscarMundo(mundos, s.mundoId)?.nombre}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
