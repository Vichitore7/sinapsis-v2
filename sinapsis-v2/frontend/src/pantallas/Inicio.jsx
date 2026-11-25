import { useJuego } from '../estado/store.jsx';
import { api } from '../api.js';
import { ir } from '../ruta.js';
import Ajolote from '../componentes/Ajolote.jsx';
import Icono from '../componentes/Iconos.jsx';
import { Marcas } from '../componentes/Comunes.jsx';
import { diasEntre, estadoAjolote, hoy, loQuePide, siguientePaso } from '../logica/juego.js';
import { formatoNumero } from '../contenido/mundos.js';

export default function Inicio() {
  const { estado, mundos, actualizar, aplicarServidor } = useJuego();

  const paso = siguientePaso(estado, mundos);
  const animo = estadoAjolote(estado);
  const pide = loQuePide(estado.bienestar);
  const diasFuera = diasEntre(estado.ultimaActividad, hoy());
  const kiko = estado.nombreAjolote;

  let saludo = `¡Hola, ${estado.apodo}! ¿Listo para la siguiente misión?`;
  if (animo === 'dormido') saludo = `${kiko} está descansando. Cuando quieras, lo despertamos para seguir.`;
  else if (diasFuera >= 2) saludo = '¡La selva te esperaba! ¿Seguimos la aventura?';
  else if (pide) saludo = `¡Hola, ${estado.apodo}! ${kiko} te pide algo. Míralo en la habitación.`;

  const continuar = async () => {
    actualizar((s) => ({ ...s, celebrando: false }));
    if (estado.dormido) {
      try { aplicarServidor(await api.despertar()); } catch { /* sigue igual */ }
    }
    if (paso?.tipo === 'reto') ir(`/reto/${paso.reto.id}`);
    else ir('/mapa');
  };

  return (
    <div className="pila inicio-layout">
      <section className="sm-card escena-inicio">
        <div className="ajolote-con-pide">
          {pide && animo !== 'dormido' && (
            <div className="flota" aria-hidden="true"><Icono nombre={pide} tamano={52} /></div>
          )}
          <Ajolote estado={animo} tamano={150} mundosSuperados={estado.mundosTerminados.length} accesorios={estado.stickers} />
        </div>
        <div className="sm-bubble globo">{saludo}</div>
        <div className="chips centro">
          <span className="sm-chip">Nivel {estado.nivel}</span>
          {estado.rachaDias > 0 && <span className="sm-chip sm-chip-sol">Racha: {estado.rachaDias} día{estado.rachaDias > 1 ? 's' : ''}</span>}
        </div>
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
            {animo === 'dormido' ? `Despertar a ${kiko}` : 'Continuar aventura'}
          </button>
        </section>
      ) : (
        <section className="sm-acierto">
          <h2 className="subtitulo" style={{ margin: 0 }}>✓ ¡Exploraste toda la selva disponible!</h2>
          <p className="cuerpo">Pronto abrirá un mundo nuevo. Mientras, repasa en el mapa o cuida a {kiko}.</p>
        </section>
      )}

      <section className="sm-card">
        <div className="fila-entre">
          <h2 className="subtitulo" style={{ margin: 0 }}>Bienestar de {kiko}</h2>
          <a className="enlace" href="#/habitacion">Cuidarlo</a>
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
