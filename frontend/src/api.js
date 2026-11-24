// Cliente de la API. La sesión viaja en una cookie httpOnly (no se guarda ningún token en JavaScript).
// Documentación de los endpoints: http://localhost:8000/docs

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

async function pedir(metodo, ruta, cuerpo) {
  let res;
  try {
    res = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('Sin conexión con el servidor. Revisa tu internet.', 0);
  }
  if (res.status === 204) return null;
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorApi(datos.error || 'Algo salió mal. Intenta de nuevo.', res.status);
  return datos;
}

export const api = {
  // Cuenta
  registro: (d) => pedir('POST', '/auth/registro', d),
  login: (d) => pedir('POST', '/auth/login', d),
  logout: () => pedir('POST', '/auth/logout'),
  recuperar: (d) => pedir('POST', '/auth/recuperar', d),
  nuevoCodigo: () => pedir('POST', '/auth/nuevo-codigo'),
  cambiarPassword: (d) => pedir('POST', '/auth/cambiar-password', d),
  yo: () => pedir('GET', '/auth/yo'),
  cambiarPerfil: (d) => pedir('PATCH', '/auth/yo', d),

  // Juego (alumno)
  contenido: () => pedir('GET', '/contenido'),
  estado: () => pedir('GET', '/juego/estado'),
  intentar: (ejercicioId, d) => pedir('POST', `/ejercicios/${encodeURIComponent(ejercicioId)}/intentos`, d),
  abrirCofre: (leccionId) => pedir('POST', `/lecciones/${encodeURIComponent(leccionId)}/cofre`),
  ejemploVisto: (leccionId) => pedir('POST', `/lecciones/${encodeURIComponent(leccionId)}/ejemplo-visto`),
  cuidar: (accion) => pedir('POST', '/mascota/cuidar', { accion }),
  despertar: () => pedir('POST', '/mascota/despertar'),
  renombrarMascota: (nombre) => pedir('PATCH', '/mascota', { nombre }),
  vestir: (traje) => pedir('PUT', '/mascota/traje', { traje }),

  // Tutor de IA (Kiko en el chat del escáner). Regresa { respuesta, origen: 'claude' | 'reglas' }.
  tutor: (d) => pedir('POST', '/tutor', d),

  // Aulas
  aulas: () => pedir('GET', '/aulas'),
  crearAula: (d) => pedir('POST', '/aulas', typeof d === 'string' ? { nombre: d } : d),
  editarAula: (id, d) => pedir('PATCH', `/aulas/${id}`, typeof d === 'string' ? { nombre: d } : d),
  aprobarAlumno: (id, alumnoId) => pedir('POST', `/aulas/${id}/solicitudes/${alumnoId}/aprobar`),
  rechazarAlumno: (id, alumnoId) => pedir('DELETE', `/aulas/${id}/solicitudes/${alumnoId}`),
  diagnosticoGrupo: (id) => pedir('GET', `/aulas/${id}/diagnostico`),
  curso: (id) => pedir('GET', `/aulas/${id}/curso`),
  borrarAula: (id) => pedir('DELETE', `/aulas/${id}`),
  regenerarCodigo: (id) => pedir('POST', `/aulas/${id}/regenerar-codigo`),
  expulsar: (id, alumnoId) => pedir('DELETE', `/aulas/${id}/alumnos/${alumnoId}`),
  asignar: (id, d) => pedir('POST', `/aulas/${id}/asignaciones`, d),
  quitarAsignacion: (id, asignacionId) => pedir('DELETE', `/aulas/${id}/asignaciones/${asignacionId}`),
  panel: (id) => pedir('GET', `/aulas/${id}/panel`),
  detalleAlumno: (id, alumnoId) => pedir('GET', `/aulas/${id}/alumnos/${alumnoId}`),
  unirse: (codigo) => pedir('POST', '/aulas/unirse', { codigo }),

  // Examen diagnóstico (alumno)
  diagnostico: () => pedir('GET', '/diagnostico'),
  responderDiagnostico: (respuestas) => pedir('POST', '/diagnostico', { respuestas }),

  // Ajustes
  ajustes: () => pedir('GET', '/ajustes'),
  guardarAjustes: (d) => pedir('PUT', '/ajustes', d),
};

// ---------- Adaptadores: del formato de la API al que usan las pantallas ----------

export function adaptarMundos(mundos) {
  return mundos.map((m) => {
    const mundo = { ...m, retos: [] };
    mundo.retos = m.retos.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      enunciado: r.enunciado,
      a: r.a,
      b: r.b,
      op: r.op,
      moneda: r.moneda,
      objeto: r.objeto,
      etapaMin: r.etapa_min,
      ejemplo: r.ejemplo || null,
      pistas: r.pistas,
      tipo: r.tipo || 'numerica',
      opciones: r.opciones || null,
      visual: r.visual || null,
      nivel: r.nivel || null,
      nivelTema: r.nivel_tema || null,
      nivelTitulo: r.nivel_titulo || null,
      mundo,
    }));
    return mundo;
  });
}

export function adaptarEstado(r) {
  return {
    apodo: r.apodo,
    estrellas: r.estrellas,
    xp: r.xp,
    nivel: r.nivel,
    rachaDias: r.racha_dias,
    etapaApoyo: r.etapa_apoyo,
    ultimoBonoDia: r.ultimo_bono_dia,
    ultimaActividad: r.ultima_actividad,
    completados: r.completados,
    mundosTerminados: r.lecciones_terminadas,
    stickers: r.stickers,
    ejemplosVistos: r.ejemplos_vistos,
    stats: {
      cuidados: r.stats.cuidados || 0,
      pistasPedidas: r.stats.pistas_pedidas || 0,
      retosSinAyuda: r.stats.retos_sin_ayuda || 0,
    },
    nombreAjolote: r.mascota.nombre,
    bienestar: { comida: r.mascota.comida, pecera: r.mascota.pecera, alegria: r.mascota.alegria },
    dormido: r.mascota.dormido,
    trajes: r.mascota.trajes || [],
    traje: r.mascota.traje || null,
    logros: r.logros,
    mapa: r.mapa,
    diagnosticoHecho: r.diagnostico_hecho,
  };
}
