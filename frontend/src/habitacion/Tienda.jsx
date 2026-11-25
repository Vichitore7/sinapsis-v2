import I from '../componentes/IconosUI.jsx';
import { recurso } from './Escenario.jsx';

export function estadoCompra(sticker, inventario, trajineras, saldo) {
  if (inventario.includes(sticker.id)) return 'adquirido';
  if (sticker.trajineraRequerida !== 0 && !trajineras.some(t => t.numero === sticker.trajineraRequerida && t.superada)) return 'bloqueado';
  return saldo >= sticker.precio ? 'disponible' : 'sinSaldo';
}

export default function Tienda({ catalogo, inventario, trajineras, saldo, ocupado, comprar, noche = false }) {
  const grupos = [...new Set(catalogo.stickers.map(s => s.trajineraRequerida))].sort((a,b) => a-b);
  const superadas = trajineras.filter(t => t.superada).length;
  return <>
    <div className="hab-seccion-head"><h2>Tienda de stickers</h2><span className="hab-seccion-badge">Saldo <I n="estrella" tamano={15} className="texto-selva hab-estrella"/> {saldo}</span></div>
    <p>Supera trajineras de {catalogo.mapaTienda.nombre} para desbloquear decoraciones. Compra con tus estrellas verdes.</p>
    <div className="hab-tienda-progreso">
      <div className="hab-tienda-progreso-head"><strong>{superadas} de {trajineras.length} trajineras superadas</strong><a href="#/mapa" className="hab-enlace">Ir al mapa</a></div>
      <progress value={superadas} max={trajineras.length || 1} aria-label="Trajineras superadas"/>
    </div>
    {grupos.map(numero => {
      const t = trajineras.find(t => t.numero === numero);
      return <section key={numero} className="hab-tienda-grupo">
        <div className="hab-seccion-head"><h3>{numero === 0 ? 'Disponibles desde el inicio' : `Trajinera ${numero}${t?.titulo ? ` · ${t.titulo}` : ''}`}</h3><span className="hab-seccion-badge">{numero===0?'Inicio':t?.superada?'Desbloqueado':'Bloqueado'}</span></div>
        {numero !== 0 && <p>{t?.superada ? 'Trajinera superada' : t ? `Completa sus retos (${t.resueltos}/${t.total})` : 'Todavía no disponible'}</p>}
        <div className="hab-tienda-estante">
          {catalogo.stickers.filter(s => s.trajineraRequerida === numero).map(s => {
            const estado = estadoCompra(s, inventario, trajineras, saldo);
            return <article className={`hab-item hab-item-tienda estado-${estado}`} key={s.id}>
              <div className="hab-item-ilustracion"><img src={recurso(s.imagen, noche)} alt=""/></div>
              <div className="hab-item-meta">
                <strong>{s.nombre}</strong>
                <small>{numero === 0 ? 'Disponible desde el inicio' : `Se desbloquea al superar la trajinera ${numero}`}</small>
              </div>
              <div className="hab-item-pie">
                <small className="hab-precio"><I n="estrella" tamano={17} className="texto-selva hab-estrella"/> {s.precio}</small>
                <button type="button" className="hab-btn" disabled={ocupado || estado !== 'disponible'} onClick={() => comprar(s)}>
                  {estado === 'adquirido' ? 'Adquirido' : estado === 'bloqueado' ? <><I n="candado" tamano={15}/> Bloqueado</> : estado === 'sinSaldo' ? 'Faltan estrellas' : 'Comprar'}
                </button>
              </div>
            </article>;
          })}
        </div>
      </section>;
    })}
  </>;
}
