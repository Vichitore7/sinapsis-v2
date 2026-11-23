import { useEffect, useMemo, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { ir } from '../ruta.js';
import Ajolote from '../componentes/Ajolote.jsx';
import Icono from '../componentes/Iconos.jsx';
import { Marcas } from '../componentes/Comunes.jsx';
import { diasEntre, estadoAjolote, hoy, loQuePide, siguientePaso } from '../logica/juego.js';
import { formatoNumero } from '../contenido/mundos.js';

function Bienvenida() {
  const { actualizar } = useJuego();
  const [apodo, setApodo] = useState('');
  const listo = apodo.trim().length > 0;

  const empezar = (e) => {
    e.preventDefault();
    if (!listo) return;
    actualizar((s) => ({ ...s, apodo: apodo.trim().slice(0, 20), ultimaVisita: hoy() }));
  };

  return (
    <div className="portada">
      <div className="portada-arte" aria-hidden="true">
        <span className="bloque b-selva" /><span className="bloque b-magia" />
        <span className="bloque b-sol" /><span className="bloque b-rosa" />
      </div>
      <h1 className="titulo-app">Selva Matemática</h1>
      <p className="etiqueta texto-suave">Equivocarse también es avanzar.</p>

      <div className="sm-card" style={{ marginTop: 'var(--espacio-4)' }}>
        <div className="dice-ajolote">
          <Ajolote estado="feliz" tamano={110} />
          <div className="sm-bubble globo">¡Hola! Soy Kiko, tu guía en la selva. ¿Cómo te llamo, explorador?</div>
        </div>
        <form onSubmit={empezar} className="col-3" style={{ marginTop: 'var(--espacio-3)' }}>
          <label className="cuerpo-fuerte" htmlFor="apodo">Tu apodo</label>
          <input
            id="apodo"
            className="sm-input sm-input-texto"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            maxLength={20}
            autoComplete="off"
            placeholder="Ej. Luna"
          />
          <p className="etiqueta texto-suave" style={{ margin: 0 }}>Usa un apodo, no tu nombre completo.</p>
          <button className="sm-btn" type="submit" disabled={!listo}>¡A la aventura!</button>
        </form>
      </div>
    </div>
  );
}

export default function Inicio() {
  const { estado, actualizar } = useJuego();

  // El mensaje de regreso se calcula una vez, antes de actualizar la última visita.
  const diasFuera = useMemo(() => diasEntre(estado.ultimaVisita, hoy()), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (estado.apodo && estado.ultimaVisita !== hoy()) {
      actualizar((s) => ({ ...s, ultimaVisita: hoy() }));
    }
  }, [estado.apodo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!estado.apodo) return <Bienvenida />;

  const paso = siguientePaso(estado);
  const animo = estadoAjolote(estado);
  const pide = loQuePide(estado.bienestar);
  const mundosSuperados = estado.mundosTerminados.length;

  let saludo = `¡Hola, ${estado.apodo}! ¿Listo para la siguiente misión?`;
  if (animo === 'dormido') saludo = 'Kiko está descansando. Cuando quieras, lo despertamos para seguir.';
  else if (diasFuera >= 2) saludo = '¡La selva te esperaba! ¿Seguimos la aventura?';
  else if (pide) saludo = `¡Hola, ${estado.apodo}! Kiko te pide algo. Míralo en la mochila.`;

  const continuar = () => {
    actualizar((s) => ({ ...s, dormido: false, celebrando: false }));
    if (!paso) ir('/mapa');
    else if (paso.tipo === 'reto') ir(`/reto/${paso.reto.id}`);
    else ir('/mapa');
  };

  return (
    <div className="pila inicio-layout">
      <section className="sm-card escena-inicio">
        <div className="ajolote-con-pide">
          {pide && animo !== 'dormido' && (
            <div className="flota" aria-hidden="true"><Icono nombre={pide} tamano={52} /></div>
          )}
          <Ajolote estado={animo} tamano={150} mundosSuperados={mundosSuperados} accesorios={estado.stickers} />
        </div>
        <div className="sm-bubble globo">{saludo}</div>
      </section>

      {paso ? (
        <section className="sm-card">
          <div className="fila-entre" style={{ marginBottom: 'var(--espacio-2)' }}>
            <span className="sm-chip">Mundo {paso.mundo.numero} · {paso.mundo.nombre}</span>
            {estado.ultimoBonoDia !== hoy() && <span className="sm-chip sm-chip-sol">Reto del día · ★ +5</span>}
          </div>
          {paso.tipo === 'reto' ? (
            <>
              <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-1)' }}>{paso.reto.titulo}</h2>
              <p className="cuerpo texto-suave" style={{ margin: '0 0 var(--espacio-3)' }}>
                {paso.reto.a} × {formatoNumero(paso.reto.b, paso.reto.moneda)}
              </p>
            </>
          ) : (
            <>
              <h2 className="subtitulo" style={{ margin: '0 0 var(--espacio-1)' }}>¡El cofre del mundo te espera!</h2>
              <p className="cuerpo texto-suave" style={{ margin: '0 0 var(--espacio-3)' }}>Terminaste todos los retos. Ve al mapa a abrirlo.</p>
            </>
          )}
          <button className="sm-btn ancho" onClick={continuar}>
            {animo === 'dormido' ? 'Despertar a Kiko' : 'Continuar aventura'}
          </button>
        </section>
      ) : (
        <section className="sm-acierto">
          <h2 className="subtitulo" style={{ margin: 0 }}>✓ ¡Exploraste toda la selva disponible!</h2>
          <p className="cuerpo">Pronto abrirá un mundo nuevo. Mientras, repasa en el mapa o cuida a Kiko.</p>
        </section>
      )}

      <section className="sm-card">
        <div className="fila-entre">
          <h2 className="subtitulo" style={{ margin: 0 }}>Bienestar de Kiko</h2>
          <a className="enlace" href="#/mochila">Cuidarlo</a>
        </div>
        <div className="mini-medidores">
          {[['comida', 'Comida'], ['pecera', 'Pecera'], ['alegria', 'Alegría']].map(([id, nombre]) => (
            <div key={id} className="mini-medidor">
              <Icono nombre={id} tamano={32} />
              <span className="etiqueta">{nombre}</span>
              <Marcas valor={estado.bienestar[id]} etiqueta={`${nombre}: ${estado.bienestar[id]} de 5`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
