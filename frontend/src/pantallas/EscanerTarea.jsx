// Escáner de una tarea completa (#/escaner/:aula.:actividad): como en Classroom, el alumno le toma foto a su
// página del cuaderno (y luego a la otra, si hace falta), no a cada ejercicio.
//   1. Mix lee todas las operaciones de la página y las acomoda en los problemas de la tarea (POST leer-pagina).
//   2. El alumno confirma lo que leyó (o corrige su resultado): nunca se revisa sin que confirme.
//   3. Cada una se registra como escaneo de su problema (el mismo filtro de Mix de siempre).
//   4. Los que tienen algo que revisar se platican con Mix en el escáner de ese problema.
// La foto no se guarda: se lee y se descarta.
import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { ir } from '../ruta.js';
import I from '../componentes/IconosUI.jsx';
import { DiceAjolote } from '../componentes/Comunes.jsx';
import { leerArchivo, recortarYComprimir } from '../logica/imagen.js';
import { esFraccion, validar } from '../logica/operaciones.js';

const ESTADOS = {
  pendiente: { texto: 'Falta', clase: 'chip-gris' },
  revisar: { texto: 'Mix encontró algo', clase: 'chip-casi' },
  resuelto: { texto: 'Va derecho', clase: 'chip-verde' },
};

/** La operación que el escáner de un problema abre ya confirmada (sin volver a tomar foto). Ver Escaner.jsx. */
export const claveTraspaso = (aulaId, actId, pid) => `sinapsis:tarea:${aulaId}.${actId}.${pid}`;

export default function EscanerTarea({ retoId }) {
  const [aulaId, actId] = String(retoId).split('.').map(Number);
  const [act, setAct] = useState(null);
  const [error, setError] = useState(null);
  const [paso, setPaso] = useState('lista'); // lista | leyendo | confirmar | revisando
  const [leidos, setLeidos] = useState([]);
  const [otras, setOtras] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [paginas, setPaginas] = useState(0);
  const [entregando, setEntregando] = useState(false);
  // Lo que se confirmó de cada problema en esta visita: para abrir el chat con esa operación ya escaneada.
  const confirmadas = useRef({});
  const camara = useRef(null);
  const galeria = useRef(null);

  const cargar = () => api.actividad(aulaId, actId).then(setAct).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, [aulaId, actId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="pila-lg"><div className="aviso-casi">{error}</div><a className="enlace" href="#/aula">Volver a mi aula</a></div>;
  if (!act) return <p className="cuerpo-md texto-suave">Abriendo tu tarea…</p>;

  const faltan = act.problemas.filter((p) => p.estado !== 'resuelto');
  // Ya vio todos (solo quedan por corregir): la foto es para revisar lo que corrigió, no otra página.
  const soloCorregir = paginas > 0 && !faltan.some((p) => p.estado === 'pendiente');

  const elegir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!navigator.onLine) {
      setAviso('Sin internet no puedo leer la página. Cuando vuelva la conexión, tómale foto otra vez.');
      return;
    }
    setAviso(null);
    setPaso('leyendo');
    try {
      // Página completa: más resolución que una sola operación, para que se lean todas.
      const foto = await recortarYComprimir(await leerArchivo(archivo), { x: 0, y: 0, w: 1, h: 1 }, { lado: 1600, maxBytes: 480 * 1024 });
      const r = await api.leerPagina(act.id, foto);
      setPaginas((n) => n + 1);
      if (r.origen !== 'claude') {
        setAviso('Ahorita no pude leer la página. Escanea cada problema por separado con su botón. 📸');
        setPaso('lista');
        return;
      }
      // Los que ya van derecho no se vuelven a revisar.
      const nuevos = r.encontrados.filter((x) => act.problemas.find((p) => p.id === x.problema_id)?.estado !== 'resuelto');
      setOtras(r.otras);
      if (!nuevos.length) {
        setAviso(r.encontrados.length
          ? 'Esos problemas ya van derecho. Tómale foto a la página donde están los que faltan.'
          : 'No encontré problemas de esta tarea en la foto. Revisa que se vea toda la página, con buena luz. 🔍');
        setPaso('lista');
        return;
      }
      setLeidos(nuevos.map((x) => ({ ...x, lectura: { residuo: '', ...x.lectura } })));
      setPaso('confirmar');
    } catch (err) {
      setAviso(err.message || 'No pude abrir esa foto. Prueba con otra.');
      setPaso('lista');
    }
  };

  const cambiar = (i, campo, valor) => setLeidos((xs) => xs.map((x, j) => (j === i ? { ...x, lectura: { ...x.lectura, [campo]: valor } } : x)));

  const revisar = async () => {
    setPaso('revisando');
    let bien = 0;
    let mal = 0;
    let sinResultado = 0;
    for (const x of leidos) {
      const op = validar(x.lectura);
      if (!op || op.c === '') { sinResultado += 1; continue; }
      try {
        const r = await api.escaneoActividad(act.id, x.problema_id, op);
        if (!r.coincide) continue;
        confirmadas.current[x.problema_id] = op;
        if (r.correcto) bien += 1; else mal += 1;
      } catch { /* ese problema se queda como estaba */ }
    }
    await cargar();
    setLeidos([]);
    const partes = [];
    if (bien) partes.push(`${bien} ${bien === 1 ? 'va' : 'van'} derecho 🌟`);
    if (mal) partes.push(`${mal} ${mal === 1 ? 'tiene' : 'tienen'} algo que revisar (lo vemos juntos, sin prisa)`);
    if (sinResultado) partes.push(`${sinResultado} sin resultado: termínalo en tu cuaderno y vuelve a tomar la foto`);
    setAviso(partes.length ? `Revisé tu página: ${partes.join(', ')}.` : 'No pude revisar esa página. Intenta otra vez.');
    setPaso('lista');
  };

  const conMix = (p) => {
    const op = confirmadas.current[p.id];
    try {
      if (op) sessionStorage.setItem(claveTraspaso(aulaId, act.id, p.id), JSON.stringify(op));
    } catch { /* sin sessionStorage: el escáner del problema pide la foto otra vez */ }
    ir(`/escaner/${aulaId}.${act.id}.${p.id}`);
  };

  const entregar = async () => {
    setEntregando(true);
    try { setAct(await api.entregarActividad(act.id)); } catch (e) { setAviso(e.message); } finally { setEntregando(false); }
  };

  const botonesFoto = (texto) => (
    <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
      <button className="btn btn-naranja" onClick={() => camara.current.click()}><I n="camara" tamano={18} /> {texto}</button>
      <button className="btn btn-crema" onClick={() => galeria.current.click()}><I n="galeria" tamano={18} /> Subir de la galería</button>
      <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegir} />
      <input ref={galeria} type="file" accept="image/*" hidden onChange={elegir} />
    </div>
  );

  return (
    <div className="pila-lg">
      <a className="enlace" href={`#/aula/${aulaId}.${act.id}`}><I n="atras" tamano={14} /> Ver la tarea completa</a>

      <section className="tarjeta actividad-banner">
        <div style={{ flex: 1 }}>
          <span className="etq texto-suave">Tarea · {act.resueltos} de {act.problemas.length} problemas van derecho</span>
          <b className="t-lg" style={{ display: 'block' }}>{act.titulo}</b>
          {act.instrucciones && <p className="cuerpo-sm" style={{ margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{act.instrucciones}</p>}
        </div>
        {act.entregada && <span className="chip chip-verde"><I n="check" tamano={12} /> Entregada</span>}
      </section>

      {paso === 'leyendo' && (
        <section className="tarjeta centro-col" style={{ textAlign: 'center' }} aria-live="polite">
          <DiceAjolote estado="curioso" tamano={90}>Estoy leyendo tu página con mi lupa… 🔍</DiceAjolote>
        </section>
      )}

      {paso === 'confirmar' || paso === 'revisando' ? (
        <section className="tarjeta pila-md" aria-live="polite">
          <DiceAjolote estado="feliz" tamano={80}>
            Encontré {leidos.length} {leidos.length === 1 ? 'problema' : 'problemas'} de tu tarea. ¿Está igual que en tu cuaderno? Si no, corrige tu resultado.
          </DiceAjolote>
          <ol className="problemas-lista">
            {leidos.map((x, i) => {
              const l = x.lectura;
              const conResiduo = l.op === '÷' && ![l.a, l.b, l.c].some(esFraccion);
              return (
                <li key={x.problema_id} className="problema">
                  <span className="problema-num">{x.numero}</span>
                  <div className="fila" style={{ flex: 1, gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <b className="t-md problema-op">{l.a} {l.op} {l.b} =</b>
                    <input className="campo campo-chico" value={l.c} onChange={(e) => cambiar(i, 'c', e.target.value)}
                      aria-label={`Tu resultado del problema ${x.numero}`} placeholder="?" disabled={paso === 'revisando'} />
                    {conResiduo && (
                      <>
                        <span className="cuerpo-sm">residuo</span>
                        <input className="campo campo-chico" value={l.residuo} onChange={(e) => cambiar(i, 'residuo', e.target.value)}
                          aria-label={`Residuo del problema ${x.numero}`} placeholder="0" disabled={paso === 'revisando'} />
                      </>
                    )}
                  </div>
                  {l.dudoso && <span className="chip chip-casi">¿Se lee bien?</span>}
                  {l.c === '' && <span className="chip chip-gris">Sin resultado</span>}
                </li>
              );
            })}
          </ol>
          {otras.length > 0 && (
            <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>También vi {otras.join(', ')}, pero no {otras.length === 1 ? 'es' : 'son'} de esta tarea.</p>
          )}
          <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-naranja" onClick={revisar} disabled={paso === 'revisando'}>
              <I n="check" tamano={16} /> {paso === 'revisando' ? 'Revisando…' : '¡Así es! Revísalos'}
            </button>
            <button className="btn btn-crema" onClick={() => { setLeidos([]); setPaso('lista'); }} disabled={paso === 'revisando'}>Volver a tomar</button>
          </div>
          <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>Ya leí tu foto y la borré. Solo guardo lo que confirmas.</p>
        </section>
      ) : null}

      {paso === 'lista' && (
        <>
          {aviso && <div className="tarjeta-suave cuerpo-md" role="status">{aviso}</div>}
          {!act.entregada && faltan.length > 0 && (
            <section className="tarjeta pila-md">
              <h2 className="t-md" style={{ margin: 0 }}><I n="camara" tamano={20} className="texto-naranja" /> {soloCorregir ? '¿Ya corregiste en tu cuaderno?' : paginas ? '¿Te faltan problemas en otra página?' : 'Tómale foto a tu página'}</h2>
              <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
                {soloCorregir
                  ? 'Platica con Mix los que tienen algo que revisar. Cuando los corrijas, tómale foto otra vez a tu página.'
                  : paginas
                  ? 'Tómale foto a la siguiente página de tu cuaderno y sigo revisando.'
                  : 'Resuelve la tarea en tu cuaderno y tómale foto a la página completa, con buena luz. Si ocupa varias páginas, después le tomas a la otra.'}
              </p>
              {botonesFoto(soloCorregir ? 'Foto de mi página corregida' : paginas ? 'Foto de otra página' : 'Tomar foto de mi página')}
            </section>
          )}

          <section className="tarjeta pila-md">
            <h2 className="t-md" style={{ margin: 0 }}>Problemas</h2>
            <ol className="problemas-lista">
              {act.problemas.map((p, n) => (
                <li key={p.id} className={`problema problema-${p.estado}`}>
                  <span className="problema-num">{n + 1}</span>
                  <div style={{ flex: 1 }}>
                    {p.enunciado && <p className="cuerpo-sm" style={{ margin: 0 }}>{p.enunciado}</p>}
                    <b className="t-md problema-op">{p.texto}</b>
                  </div>
                  <span className={`chip ${ESTADOS[p.estado].clase}`}>{ESTADOS[p.estado].texto}</span>
                  {p.estado === 'revisar' && (
                    <button className="btn btn-naranja btn-chico" onClick={() => conMix(p)}><I n="cerebro" tamano={14} /> Revisar con Mix</button>
                  )}
                  {p.estado === 'pendiente' && (
                    <button className="btn btn-crema btn-chico" onClick={() => conMix(p)}><I n="camara" tamano={14} /> Solo este</button>
                  )}
                </li>
              ))}
            </ol>
            {!act.entregada && (
              <div className="fila-entre">
                <p className="cuerpo-sm texto-suave" style={{ margin: 0 }}>
                  {act.puede_entregar ? '¡Listo! Ya pasaste todos los problemas por Mix.' : 'Para entregar, Mix tiene que ver todos los problemas.'}
                </p>
                <button className="btn btn-verde" disabled={!act.puede_entregar || entregando} onClick={entregar}>
                  <I n="check" tamano={16} /> Entregar tarea
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
