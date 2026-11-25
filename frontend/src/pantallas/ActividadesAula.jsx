// Actividades (profesor): dejar problemas y material a cada grupo y ver qué contestó cada alumno.
// Los alumnos los resuelven en su cuaderno y los escanean; Kiko los revisa (app/actividades.py).
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import I from '../componentes/IconosUI.jsx';
import ActividadesProfe from '../componentes/ActividadesProfe.jsx';

export default function ActividadesAula() {
  const [aulas, setAulas] = useState(null);
  const [selId, setSelId] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api.aulas().then((r) => { setAulas(r.aulas); setSelId(r.aulas[0]?.id ?? null); }).catch((e) => setError(e.message));
  }, []);
  if (error) return <div className="aviso-casi" role="alert">{error}</div>;
  if (!aulas) return <p className="cuerpo-md texto-suave">Cargando…</p>;
  const sel = aulas.find((a) => a.id === selId);

  return (
    <div className="pila-lg">
      <div className="fila-entre">
        <div>
          <span className="sobre"><I n="libro" tamano={14} /> Para estudiar con Kiko</span>
          <h1 className="t-xl" style={{ margin: '4px 0 0' }}>Actividades</h1>
        </div>
        <div className="chips" style={{ margin: 0 }}>
          {aulas.map((a) => (
            <button key={a.id} className={`chip-tab${a.id === selId ? ' activo' : ''}`} onClick={() => setSelId(a.id)}>{a.nombre}</button>
          ))}
        </div>
      </div>
      {!sel ? (
        <section className="tarjeta centro-col" style={{ textAlign: 'center' }}>
          <p className="cuerpo-md">Crea un grupo en <a className="enlace" href="#/aulas">Modo Aula</a> para dejarle actividades.</p>
        </section>
      ) : <ActividadesProfe key={sel.id} aulaId={sel.id} nivel={sel.nivel} />}
    </div>
  );
}
