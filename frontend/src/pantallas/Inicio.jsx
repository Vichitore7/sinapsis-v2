// Inicio del alumno: Mix saluda y pregunta si queda algo pendiente.
// Izquierda: cursos pendientes (llevan a Mi Aula) e "Ir al Mapa". Derecha: misiones del día.
import { useEffect, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { api } from '../api.js';
import { ir } from '../ruta.js';
import Ajolote from '../componentes/Ajolote.jsx';
import I from '../componentes/IconosUI.jsx';
import { estadoAjolote, hoy, loQuePide } from '../logica/juego.js';

const ICONO_MODULO = { multiplicacion: '×', division: '÷', fracciones: '½', 'suma-resta': '±', decimales: '0.1', 'valor-posicional': '#', geometria: '△', medicion: 'cm' };

function usePendientes() {
  const [pendientes, setPendientes] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { aulas } = await api.aulas();
        const activas = aulas.filter((a) => a.estado !== 'pendiente');
        const [cursos, tareas] = await Promise.all([
          Promise.all(activas.map((a) => api.curso(a.id).catch(() => null))),
          // Las tareas que dejó el profe y que todavía no entrega (las que vencen primero, arriba).
          Promise.all(activas.map((a) => api.actividades(a.id)
            .then((r) => r.actividades.filter((t) => !t.entregada).map((t) => ({ ...t, aulaId: a.id, aula: a.nombre })))
            .catch(() => []))),
        ]);
        setPendientes({
          hayAulas: aulas.length > 0,
          tareas: tareas.flat().sort((x, y) => (x.fecha_limite || '9999').localeCompare(y.fecha_limite || '9999')),
          lista: cursos.filter(Boolean).flatMap((c) => c.modulos
            .filter((m) => !m.proximamente && m.mi_porcentaje < 100)
            .map((m) => ({ ...m, aulaId: c.id, aula: c.nombre }))),
        });
      } catch {
        setPendientes({ hayAulas: false, tareas: [], lista: [] });
      }
    })();
  }, []);
  return pendientes;
}

export default function Inicio() {
  const { estado, aplicarServidor, actualizar } = useJuego();
  const pendientes = usePendientes();
  const animo = estadoAjolote(estado);
  const kiko = estado.nombreAjolote;
  const hoyStr = hoy();

  const misiones = [
    { id: 'reto', texto: 'Resuelve un reto hoy', premio: '+5 ★', hecha: estado.ultimoBonoDia === hoyStr, ruta: '/mapa' },
    { id: 'cuidar', texto: `Cuida a ${kiko}`, premio: 'Alegría', hecha: !loQuePide(estado.bienestar) && !estado.dormido, ruta: '/habitacion' },
    { id: 'escanear', texto: 'Escanea un ejercicio de tu cuaderno', premio: 'Pistas', hecha: (estado.escaner?.historial || []).some((h) => h.fecha === hoyStr), ruta: '/escaner' },
  ];
  const hechas = misiones.filter((m) => m.hecha).length;

  const irAlMapa = async () => {
    actualizar((s) => ({ ...s, celebrando: false }));
    if (estado.dormido) {
      try { aplicarServidor(await api.despertar()); } catch { /* sigue igual */ }
    }
    ir('/mapa');
  };

  const nada = pendientes && pendientes.lista.length === 0 && pendientes.tareas.length === 0;
  const nTareas = pendientes?.tareas.length || 0;
  let pregunta = '¿Queda algo pendiente?';
  if (nTareas) pregunta = nTareas === 1 ? 'Tu maestra o maestro te dejó una tarea. ¿La vemos?' : `Tienes ${nTareas} tareas de tu clase. ¿Empezamos?`;
  else if (nada) pregunta = pendientes.hayAulas ? '¡Vas al día! ¿Jugamos en el mapa?' : '¿Ya tienes el código de tu clase?';

  return (
    <div className="pila-lg">
      <section className="saludo-kiko">
        <span className="kiko-cabeza"><Ajolote estado={animo === 'dormido' ? 'dormido' : 'feliz'} tamano={110} cabeza traje={estado.traje} /></span>
        <div className="saludo-globo">
          <p className="t-xl" style={{ margin: 0 }}>Hola, {estado.apodo}. {pregunta}</p>
        </div>
      </section>

      <div className="grid-12">
        <div className="col-8 pila-lg">
          <section className="tarjeta">
            <div className="fila-entre" style={{ marginBottom: 14 }}>
              <h2 className="t-md" style={{ margin: 0 }}><I n="libro" tamano={20} className="texto-naranja" /> {nTareas ? '¿Tienes alguna tarea pendiente?' : 'Tus cursos pendientes'}</h2>
              <a className="enlace" href="#/aula">Ver mi aula</a>
            </div>
            {pendientes === null && <p className="cuerpo-sm texto-suave">Revisando tus clases…</p>}
            {nada && (
              <div className="tarjeta-suave fila-entre">
                <span className="cuerpo-md">{pendientes.hayAulas ? 'No tienes nada pendiente en tus clases.' : 'Únete a tu clase con el código de tu maestra o maestro.'}</span>
                <a className="btn btn-crema btn-chico" href="#/aula">{pendientes.hayAulas ? 'Ir a mi aula' : 'Unirme'}</a>
              </div>
            )}
            <div className="pendientes">
              {pendientes?.tareas.map((t) => {
                const total = t.problemas.length;
                const vence = t.fecha_limite ? new Date(`${t.fecha_limite}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : null;
                return (
                  <a key={`t-${t.aulaId}-${t.id}`} className="pendiente" href={`#/escaner/${t.aulaId}.${t.id}`} title={`Tómale foto a tu cuaderno y ${kiko} la revisa contigo`}>
                    <span className="pendiente-icono"><I n="libro" tamano={20} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b className="t-sm">{t.titulo}</b>
                      <small className="cuerpo-sm texto-suave">
                        Tarea · {t.aula} · {t.resueltos}/{total} problemas{vence ? ` · entrega: ${vence}` : ''}
                      </small>
                      <small className="cuerpo-sm texto-naranja"><I n="camara" tamano={12} /> Escanéala con {kiko}</small>
                      <span className="barra-prog naranja" style={{ marginTop: 6 }}><span style={{ width: `${total ? (100 * t.resueltos) / total : 0}%` }} /></span>
                    </span>
                  </a>
                );
              })}
              {pendientes?.lista.map((m) => (
                <a key={`${m.aulaId}-${m.id}`} className="pendiente" href={`#/aula/${m.aulaId}`}>
                  <span className="pendiente-icono">{ICONO_MODULO[m.id] || m.nombre[0]}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b className="t-sm">{m.nombre}</b>
                    <small className="cuerpo-sm texto-suave">{m.aula} · {m.mis_retos}/{m.total_retos} retos</small>
                    <span className="barra-prog naranja" style={{ marginTop: 6 }}><span style={{ width: `${m.mi_porcentaje}%` }} /></span>
                  </span>
                </a>
              ))}
            </div>
          </section>

          <button className="btn btn-naranja btn-enorme" onClick={irAlMapa}>
            <I n="mapa" tamano={28} /> {estado.dormido ? `Despertar a ${kiko} e ir al Mapa` : 'Ir al Mapa'}
          </button>

          {/* Tarea de la escuela (no solo la del aula): la escanea y el ajolote le ayuda a pensarla, sin darle la respuesta. */}
          <a className="tarjeta tarea-escuela" href="#/escaner">
            <span className="kiko-cabeza tarea-escuela-cabeza"><Ajolote estado="feliz" tamano={70} cabeza traje={estado.traje} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b className="t-md" style={{ display: 'block' }}>¿Te dejaron tarea en tu escuela?</b>
              <span className="cuerpo-md texto-suave">
                Tómale foto y te acompaño a resolverla. Si tienes una duda, la pensamos juntos paso a paso.
              </span>
            </span>
            <span className="btn btn-crema btn-chico"><I n="camara" tamano={16} /> Resolverla con {kiko}</span>
          </a>
        </div>

        <aside className="col-4">
          <section className="tarjeta">
            <div className="fila-entre" style={{ marginBottom: 10 }}>
              <h2 className="t-md" style={{ margin: 0 }}><I n="diana" tamano={20} className="texto-naranja" /> Misiones</h2>
              <span className="chip">{hechas} / {misiones.length}</span>
            </div>
            <ul className="misiones">
              {misiones.map((m) => (
                <li key={m.id}>
                  <a className={`mision${m.hecha ? ' hecha' : ''}`} href={`#${m.ruta}`}>
                    <span className="mision-check">{m.hecha ? <I n="check" tamano={18} grosor={3} /> : null}</span>
                    <span style={{ flex: 1 }} className="t-sm">{m.texto}</span>
                    <span className="chip chip-gris">{m.premio}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="cuerpo-sm texto-suave" style={{ margin: '10px 0 0' }}>Racha: {estado.rachaDias} día{estado.rachaDias === 1 ? '' : 's'} · ★ {estado.estrellas}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
