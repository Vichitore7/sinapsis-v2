import { Fragment, useState } from 'react';
import { useJuego } from '../estado/store.jsx';
import { ir } from '../ruta.js';
import Ajolote from '../componentes/Ajolote.jsx';
import Icono from '../componentes/Iconos.jsx';
import { MisionCumplida } from '../componentes/Comunes.jsx';
import { MUNDOS, STICKERS } from '../contenido/mundos.js';
import { abrirCofre, nodosDeMundo, retosCompletadosDe, VALORES } from '../logica/juego.js';

function Nodo({ nodo, indice }) {
  const { reto, estado } = nodo;
  const n = indice + 1;
  if (estado === 'bloqueado') {
    return (
      <span className="nodo bloq" role="listitem" aria-label={`Reto ${n} bloqueado`}>
        <Icono nombre="candado" tamano={24} sticker={false} />
      </span>
    );
  }
  const etiqueta = estado === 'completado' ? `Reto ${n}: ${reto.titulo}, completado. Repasar` : `Reto ${n}: ${reto.titulo}, actual`;
  return (
    <a
      href={`#/reto/${reto.id}`}
      className={`nodo${estado === 'actual' ? ' actual' : ''}`}
      role="listitem"
      aria-label={etiqueta}
    >
      {estado === 'completado' ? '✓' : n}
    </a>
  );
}

export default function Mapa() {
  const { estado, actualizar } = useJuego();
  const [premio, setPremio] = useState(null);

  const abrir = (mundo) => {
    const r = abrirCofre(estado, mundo.id);
    if (!r.ok) return;
    actualizar(() => r.estado);
    setPremio(mundo);
  };

  if (premio) {
    return (
      <div className="pila">
        <div className="centro">
          <Ajolote estado="celebrando" tamano={160} mundosSuperados={estado.mundosTerminados.length} accesorios={estado.stickers} />
        </div>
        <MisionCumplida
          texto={`¡Superaste ${premio.nombre}! Ganaste ★ ${VALORES.estrellasMundo} y un sticker nuevo: ${STICKERS[premio.sticker].nombre}. Las branquias de Kiko ganaron un color.`}
          textoBoton="Seguir explorando"
          onPremio={() => {
            actualizar((s) => ({ ...s, celebrando: false }));
            setPremio(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="pila">
      {MUNDOS.map((mundo) => {
        const { nodos, cofre, abierto } = nodosDeMundo(estado, mundo);
        const hechos = retosCompletadosDe(estado, mundo);
        return (
          <section key={mundo.id} className={`mapa${abierto || cofre === 'abierto' ? '' : ' mapa-bloqueado'}`}>
            <h2 className="titulo-mundo">Mundo {mundo.numero}: {mundo.nombre}</h2>
            <p className="etiqueta texto-suave" style={{ margin: '0 0 var(--espacio-3)' }}>
              {mundo.concepto}{mundo.retos.length ? ` · ${hechos} de ${mundo.retos.length} retos` : ''}
            </p>

            {mundo.proximamente ? (
              <div className="sm-card aviso-plano">
                <Icono nombre="candado" tamano={36} />
                <span className="cuerpo">{mundo.entrada}</span>
              </div>
            ) : !abierto && cofre !== 'abierto' ? (
              <div className="sm-card aviso-plano">
                <Icono nombre="candado" tamano={36} />
                <span className="cuerpo">Abre el cofre del mundo anterior para entrar aquí.</span>
              </div>
            ) : (
              <div className="ruta" role="list">
                {nodos.map((nodo, i) => (
                  <Fragment key={nodo.reto.id}>
                    <span className="nodo-con-ajolote">
                      {nodo.estado === 'actual' && (
                        <span className="ajolote-en-nodo" aria-hidden="true">
                          <Ajolote estado="feliz" tamano={56} mundosSuperados={estado.mundosTerminados.length} />
                        </span>
                      )}
                      <Nodo nodo={nodo} indice={i} />
                    </span>
                    <span className={`tramo${nodo.estado === 'completado' ? ' hecho' : ''}`} aria-hidden="true" />
                  </Fragment>
                ))}
                {cofre === 'actual' ? (
                  <button className="nodo actual nodo-cofre" role="listitem" onClick={() => abrir(mundo)} aria-label="Cofre del mundo: ¡ábrelo!">
                    <Icono nombre="cofre" tamano={40} sticker={false} />
                  </button>
                ) : (
                  <span
                    className={`nodo nodo-cofre${cofre === 'abierto' ? '' : ' bloq'}`}
                    role="listitem"
                    aria-label={cofre === 'abierto' ? 'Cofre del mundo abierto' : 'Cofre del mundo bloqueado'}
                  >
                    {cofre === 'abierto' ? '✓' : '★'}
                  </span>
                )}
              </div>
            )}
          </section>
        );
      })}
      <button className="sm-btn sm-btn-suave" onClick={() => ir('/')}>Volver al inicio</button>
    </div>
  );
}
