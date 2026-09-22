import { supabase, BUCKET } from './supabase-client.js';

/* ============================================================
   Estado y helpers básicos
   ============================================================ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const CLAVE_USUARIO = 'ne_usuario';
let usuarioActual = localStorage.getItem(CLAVE_USUARIO); // 'alessandro' | 'ella' | null
let seccionActual = null;
let audioActivo = null;

const ETIQUETAS_SECCION = {
  musica: 'Música',
  textos: 'Cartas',
  recuerdos: 'Recuerdos',
  videos: 'Videos',
  instantaneas: 'Instantáneas',
};

const ICONOS_SECCION = {
  musica: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
  textos: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>',
  recuerdos: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M20 15.5l-5-5-9 9"/></svg>',
  videos: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
  instantaneas: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.3"/></svg>',
};

// Solo estas dos secciones se muestran como galería seleccionable/descargable.
const SECCIONES_GALERIA = ['recuerdos', 'instantaneas'];
let seleccionActual = new Map(); // id -> item, mientras el modo selección está activo

function mostrarPantalla(id) {
  $$('.pantalla').forEach((p) => p.classList.remove('activa'));
  $(`#${id}`).classList.add('activa');
}

function formatearFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

function nombreVisible(autor) {
  return autor === 'alessandro' ? 'Alessandro' : 'Mayerli';
}

/* ============================================================
   Arranque
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  iniciarLluviaDePetalos();
  iniciarSecuenciaBienvenida();

  $('#btn-entrar').addEventListener('click', () => {
    if (usuarioActual) entrarAlApp();
    else mostrarPantalla('pantalla-quien');
  });

  $$('.tarjeta-usuario').forEach((btn) => {
    btn.addEventListener('click', () => {
      usuarioActual = btn.dataset.usuario;
      localStorage.setItem(CLAVE_USUARIO, usuarioActual);
      entrarAlApp();
    });
  });

  $$('.item-seccion[data-seccion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('bloqueado')) return;
      btn.classList.add('tocado');
      setTimeout(() => abrirSeccion(btn.dataset.seccion), 120);
      alternarMenuLateral(false);
    });
  });

  $('#btn-volver').addEventListener('click', () => mostrarInicio());

  // Menú lateral retráctil (estilo YouTube)
  $('#btn-menu-lateral').addEventListener('click', () => alternarMenuLateral());
  $('#btn-cerrar-lateral').addEventListener('click', () => alternarMenuLateral(false));
  $('#fondo-lateral').addEventListener('click', () => alternarMenuLateral(false));

  // Notificaciones
  $('#btn-notificaciones').addEventListener('click', () => {
    alternarMenuLateral(false);
    abrirPanelNotificaciones();
  });
  $('#btn-cerrar-notificaciones').addEventListener('click', cerrarPanelNotificaciones);
  $('#fondo-panel').addEventListener('click', cerrarPanelNotificaciones);

  // Modal nuevo / compositor de instantáneas
  $('#btn-agregar').addEventListener('click', () => {
    if (seccionActual === 'instantaneas') abrirCompositorInstantanea();
    else abrirModalNuevo();
  });
  $('#btn-cerrar-modal').addEventListener('click', cerrarModalNuevo);
  $('#form-nuevo').addEventListener('submit', publicar);

  // Selección (galerías)
  $('#btn-seleccionar').addEventListener('click', () => activarModoSeleccion());
  $('#btn-cancelar-seleccion').addEventListener('click', () => desactivarModoSeleccion());
  $('#btn-descargar-seleccion').addEventListener('click', descargarSeleccionados);
  $('#btn-guardar-recuerdos').addEventListener('click', () => guardarEnRecuerdos([...seleccionActual.values()]));

  // Compositor de instantáneas
  $('#btn-cerrar-compositor').addEventListener('click', cerrarCompositorInstantanea);
  $('#btn-tomar-foto').addEventListener('click', () => $('#entrada-camara').click());
  $('#entrada-camara').addEventListener('change', (e) => manejarFotoElegida(e.target.files[0]));
  $('#btn-repetir-foto').addEventListener('click', volverAElegirFoto);
  $('#btn-publicar-instantanea').addEventListener('click', publicarInstantanea);

  // Visor
  $('#btn-cerrar-visor').addEventListener('click', cerrarVisor);

  registrarServiceWorker();
});

function entrarAlApp() {
  $('#saludo-usuario').textContent = usuarioActual === 'alessandro' ? 'hola, Alessandro' : 'hola, mi amor';
  mostrarPantalla('pantalla-app');
  aplicarPermisosMenu();
  mostrarInicio();
  revisarNotificacionesPendientes();
  iniciarEscuchaEnVivo();
}

// Ella puede ver y escuchar música, pero solo Alessandro puede subir canciones.
function aplicarPermisosMenu() {
  const itemMusica = document.querySelector('.item-seccion[data-seccion="musica"]');
  if (!itemMusica) return;
  const puedeSubir = usuarioActual === 'alessandro';
  itemMusica.querySelector('small').textContent = puedeSubir
    ? 'las canciones que nos gustan'
    : 'las canciones que nos gustan · solo Alessandro sube';
}

function alternarMenuLateral(forzar) {
  const barra = $('#barra-lateral');
  const fondo = $('#fondo-lateral');
  const boton = $('#btn-menu-lateral');
  const abrir = typeof forzar === 'boolean' ? forzar : !barra.classList.contains('abierta');
  barra.classList.toggle('abierta', abrir);
  fondo.classList.toggle('visible', abrir);
  boton.setAttribute('aria-expanded', String(abrir));
}

/* ============================================================
   Vista de inicio dentro de la hoja central
   ============================================================ */
function mostrarInicio() {
  seccionActual = null;
  desactivarModoSeleccion();
  if (audioActivo) { audioActivo.pause(); audioActivo = null; }

  $('#titulo-seccion').textContent = 'Nuestro Espacio';
  $('#btn-volver').classList.add('oculto');
  $$('.item-seccion[data-seccion]').forEach((btn) => btn.classList.remove('activo'));
  $('#btn-agregar').classList.add('oculto');
  $('#btn-seleccionar').classList.add('oculto');
  $('#estado-seccion').classList.add('oculto');

  const cont = $('#contenido-seccion');
  cont.innerHTML = `
    <div class="inicio-central">
      <p class="inicio-etiqueta">songs for you</p>
      <button class="cassette-cuerpo${audioActivo && !audioActivo.paused ? ' reproduciendo' : ''}" id="btn-cassette-inicio" aria-label="Ir a Música">
        <span class="cassette-tornillo t-tl"></span><span class="cassette-tornillo t-tr"></span>
        <span class="cassette-tornillo t-bl"></span><span class="cassette-tornillo t-br"></span>
        <span class="carrete"></span>
        <span class="cassette-etiqueta"><b class="hoja-mini"></b>Nuestro Espacio</span>
        <span class="carrete"></span>
      </button>
      <p class="inicio-leyenda">un mixtape que nunca termina</p>
      <button id="btn-abrir-menu-inicio" class="boton-menu-inicio">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        <span>Menú</span>
      </button>
    </div>
  `;
  $('#btn-cassette-inicio').addEventListener('click', () => abrirSeccion('musica'));
  $('#btn-abrir-menu-inicio').addEventListener('click', () => alternarMenuLateral(true));
}

/* ============================================================
   Bienvenida: lluvia de pétalos + secuencia flor → botón
   ============================================================ */
function iniciarLluviaDePetalos() {
  const cont = $('#lluvia-petalos');
  if (!cont) return;
  const CANTIDAD = 16;
  for (let i = 0; i < CANTIDAD; i++) {
    const petalo = document.createElement('i');
    petalo.className = 'petalo-caido';
    const x = Math.round(Math.random() * 100);
    const ancho = 8 + Math.round(Math.random() * 8);
    const alto = ancho * 1.5;
    const duracion = (7 + Math.random() * 6).toFixed(2);
    const retraso = (Math.random() * 10).toFixed(2);
    const rotacion = Math.round(Math.random() * 360);
    petalo.style.setProperty('--x', x + '%');
    petalo.style.setProperty('--w', ancho + 'px');
    petalo.style.setProperty('--h', alto + 'px');
    petalo.style.setProperty('--dur', duracion + 's');
    petalo.style.setProperty('--del', retraso + 's');
    petalo.style.setProperty('--rot', rotacion + 'deg');
    cont.appendChild(petalo);
  }
}

function iniciarSecuenciaBienvenida() {
  // La flor termina de abrir ~1.7s después de empezar (ver keyframes en CSS).
  // Le damos un respiro y luego se desvanece mientras aparece el botón.
  const TIEMPO_FLORECER = 1900;
  setTimeout(() => {
    $('#flor-grupo')?.classList.add('se-va');
    $('#btn-entrar')?.classList.add('mostrar');
  }, TIEMPO_FLORECER);
}

/* ============================================================
   Notificaciones
   ============================================================ */
async function revisarNotificacionesPendientes() {
  try {
    const { count, error } = await supabase
      .from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('leido', false);
    if (error) throw error;
    $('#punto-notificacion').classList.toggle('oculto', !count);
  } catch (e) {
    console.warn('No se pudo revisar notificaciones:', e.message);
  }
}

async function abrirPanelNotificaciones() {
  $('#panel-notificaciones').classList.add('visible');
  $('#fondo-panel').classList.add('visible');

  const lista = $('#lista-notificaciones');
  lista.innerHTML = '<li class="vacio-panel">Cargando…</li>';

  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;

    if (!data || data.length === 0) {
      lista.innerHTML = '<li class="vacio-panel">Todavía no hay avisos.</li>';
    } else {
      lista.innerHTML = '';
      data.forEach((n) => {
        const li = document.createElement('li');
        if (!n.leido) li.classList.add('no-leido');
        li.innerHTML = `<strong>${escapeHtml(n.mensaje)}</strong><time>${formatearFecha(n.created_at)}</time>`;
        lista.appendChild(li);
      });
    }

    const idsNoLeidos = data.filter((n) => !n.leido).map((n) => n.id);
    if (idsNoLeidos.length) {
      await supabase.from('notificaciones').update({ leido: true }).in('id', idsNoLeidos);
      $('#punto-notificacion').classList.add('oculto');
    }
  } catch (e) {
    lista.innerHTML = `<li class="vacio-panel">No se pudieron cargar los avisos.<br><small>${escapeHtml(e.message)}</small></li>`;
  }
}

function cerrarPanelNotificaciones() {
  $('#panel-notificaciones').classList.remove('visible');
  $('#fondo-panel').classList.remove('visible');
}

/* ============================================================
   Widgets flotantes en vivo
   ------------------------------------------------------------
   Cuando alguno de los dos publica algo, Supabase Realtime avisa
   al instante al otro celular. Si es una imagen, el widget se
   queda mostrando la miniatura; si es canción, video, carta u
   otra cosa, solo aparece el aviso (sin dejar el contenido
   pegado en pantalla).
   ============================================================ */
let canalEnVivo = null;

function iniciarEscuchaEnVivo() {
  if (canalEnVivo) return; // ya está escuchando
  canalEnVivo = supabase
    .channel('avisos-en-vivo')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, (payload) => {
      manejarNuevaNotificacion(payload.new);
    })
    .subscribe();
}

function manejarNuevaNotificacion(n) {
  // Siempre refrescamos el puntito de la campana.
  revisarNotificacionesPendientes();

  // El widget flotante solo aparece con lo que publicó la OTRA persona.
  if (!n.autor || n.autor === usuarioActual) return;
  mostrarWidget(n);
}

function mostrarWidget(n) {
  const cont = $('#widgets-flotantes');
  if (!cont) return;

  const autor = nombreVisible(n.autor);
  const esImagen = n.tipo === 'imagen';
  const widget = document.createElement('div');
  widget.className = 'widget-flot ' + (esImagen ? 'imagen' : 'simple');

  if (esImagen && n.url_archivo) {
    widget.innerHTML = `
      <div class="miniatura-widget"><img src="${escapeAttr(n.url_archivo)}" alt="" loading="lazy"></div>
      <div class="pie-widget">
        <strong>${escapeHtml(autor)} compartió una foto</strong>
        <button class="cerrar-widget" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>`;
  } else {
    const { icono, titulo, detalle } = infoWidgetSimple(n, autor);
    widget.innerHTML = `
      <span class="icono-widget">${icono}</span>
      <div class="texto-widget">
        <strong>${escapeHtml(titulo)}</strong>
        <small>${escapeHtml(detalle)}</small>
      </div>
      <button class="cerrar-widget" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>`;
  }

  const quitar = () => {
    widget.classList.add('saliendo');
    widget.classList.remove('visible');
    setTimeout(() => widget.remove(), 450);
  };

  widget.querySelector('.cerrar-widget')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    quitar();
  });

  widget.addEventListener('click', () => {
    if (n.seccion) abrirSeccion(n.seccion);
    quitar();
  });

  cont.appendChild(widget);
  // reflow para que la transición de entrada corra
  requestAnimationFrame(() => requestAnimationFrame(() => widget.classList.add('visible')));

  // Las imágenes se quedan un rato más visibles; el resto es solo un aviso breve.
  const TIEMPO_VISIBLE = esImagen ? 12000 : 6000;
  setTimeout(quitar, TIEMPO_VISIBLE);
}

function infoWidgetSimple(n, autor) {
  switch (n.tipo) {
    case 'audio':
      return { icono: '♪', titulo: `Nueva canción de ${autor}`, detalle: n.titulo || 'Suena algo nuevo en Música' };
    case 'video':
      return { icono: '▶', titulo: `Nuevo video de ${autor}`, detalle: n.titulo || 'Hay un video nuevo para ver' };
    case 'youtube':
      return { icono: '▶', titulo: `Nuevo video de ${autor}`, detalle: n.titulo || 'Un video de YouTube para ustedes' };
    case 'texto':
      return { icono: '✎', titulo: `Nueva carta de ${autor}`, detalle: n.titulo || n.mensaje || 'Te dejó unas palabras' };
    default:
      return { icono: '❀', titulo: `${autor} compartió algo`, detalle: n.mensaje || 'Toca la campana para ver el aviso' };
  }
}

/* ============================================================
   Secciones — carga y render
   ============================================================ */
async function abrirSeccion(seccion) {
  seccionActual = seccion;
  desactivarModoSeleccion();
  if (audioActivo) { audioActivo.pause(); audioActivo = null; }

  $('#titulo-seccion').textContent = ETIQUETAS_SECCION[seccion];
  $('#btn-volver').classList.remove('oculto');
  $$('.item-seccion[data-seccion]').forEach((btn) => btn.classList.toggle('activo', btn.dataset.seccion === seccion));
  const puedeAgregar = !(seccion === 'musica' && usuarioActual !== 'alessandro');
  $('#btn-agregar').classList.toggle('oculto', !puedeAgregar);
  $('#btn-seleccionar').classList.toggle('oculto', !SECCIONES_GALERIA.includes(seccion));

  const cont = $('#contenido-seccion');
  const estado = $('#estado-seccion');
  cont.innerHTML = '';
  estado.classList.remove('oculto');
  estado.textContent = 'Cargando…';

  try {
    const { data, error } = await supabase
      .from('contenido')
      .select('*')
      .eq('seccion', seccion)
      .order('created_at', { ascending: false });
    if (error) throw error;

    itemsSeccionActual = data || [];
    if (itemsSeccionActual.length === 0) {
      estado.textContent = mensajeVacio(seccion);
      return;
    }
    estado.classList.add('oculto');
    renderSeccion(seccion, itemsSeccionActual, cont);
  } catch (e) {
    estado.textContent = 'No se pudo cargar esta sección. Revisa la conexión con Supabase.';
    console.error(e);
  }
}
let itemsSeccionActual = [];

function mensajeVacio(seccion) {
  const textos = {
    musica: 'Todavía no han subido canciones.',
    textos: 'Aún no hay cartas escritas. Sé el primero en dejar una.',
    recuerdos: 'La galería está vacía por ahora.',
    videos: 'No hay videos todavía.',
    instantaneas: 'Nadie ha compartido una instantánea aún.',
  };
  return textos[seccion] || 'Todavía no hay nada aquí.';
}

function renderSeccion(seccion, items, cont) {
  if (seccion === 'musica') return renderMusica(items, cont);
  if (seccion === 'textos') return renderTextos(items, cont);
  if (seccion === 'videos') return renderVideos(items, cont);
  if (seccion === 'instantaneas' || seccion === 'recuerdos') return renderGaleria(items, cont);
}

function renderMusica(items, cont) {
  items.forEach((item) => {
    const fila = document.createElement('div');
    fila.className = 'fila-musica';
    const tieneLetra = !!(item.letra && item.letra.trim());
    const tieneComentario = !!(item.comentario && item.comentario.trim());
    fila.innerHTML = `
      <button class="icono-play" aria-label="Reproducir">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <div class="info-cancion">
        <strong>${escapeHtml(item.titulo || 'Sin título')}</strong>
        <small>${nombreVisible(item.autor)} · ${formatearFecha(item.created_at)}</small>
      </div>
      <audio src="${escapeAttr(item.url_archivo || '')}"></audio>
      <div class="ventana-letra ${tieneLetra ? 'tiene-letra' : ''}">
        <div class="ventana-letra-marco"><p class="ventana-letra-texto">${escapeHtml(item.letra || '')}</p></div>
      </div>
      ${tieneComentario ? `<p class="nota-cancion">${escapeHtml(item.comentario)}</p>` : ''}
    `;
    const audio = fila.querySelector('audio');
    const boton = fila.querySelector('.icono-play');
    const textoLetra = fila.querySelector('.ventana-letra-texto');
    const marcoLetra = fila.querySelector('.ventana-letra-marco');

    if (tieneLetra) {
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const progreso = audio.currentTime / audio.duration;
        const desplazable = Math.max(0, textoLetra.scrollHeight - marcoLetra.clientHeight);
        textoLetra.style.transform = `translateY(-${desplazable * progreso}px)`;
      });
    }

    boton.addEventListener('click', () => {
      if (audioActivo && audioActivo !== audio) {
        audioActivo.pause();
        audioActivo.closest('.fila-musica')?.classList.remove('reproduciendo');
      }
      if (audio.paused) {
        audio.play();
        fila.classList.add('reproduciendo');
        audioActivo = audio;
      } else {
        audio.pause();
        fila.classList.remove('reproduciendo');
      }
      actualizarCassetteInicio();
    });
    audio.addEventListener('ended', () => { fila.classList.remove('reproduciendo'); actualizarCassetteInicio(); });
    cont.appendChild(fila);
  });
}

function actualizarCassetteInicio() {
  const cassette = $('#btn-cassette-inicio');
  if (cassette) cassette.classList.toggle('reproduciendo', !!audioActivo && !audioActivo.paused);
}

function renderTextos(items, cont) {
  items.forEach((item) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-texto';
    tarjeta.innerHTML = `
      <div class="meta"><span>${nombreVisible(item.autor)}</span><span>${formatearFecha(item.created_at)}</span></div>
      ${item.titulo ? `<h4>${escapeHtml(item.titulo)}</h4>` : ''}
      <p>${escapeHtml(item.mensaje || '')}</p>
    `;
    cont.appendChild(tarjeta);
  });
}

function renderVideos(items, cont) {
  items.forEach((item) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-video';
    const media = item.tipo === 'youtube'
      ? `<iframe src="${escapeAttr(convertirYoutubeEmbed(item.url_archivo))}" allowfullscreen loading="lazy"></iframe>`
      : `<video src="${escapeAttr(item.url_archivo || '')}" controls playsinline></video>`;
    tarjeta.innerHTML = `${media}<div class="pie-video">${escapeHtml(item.titulo || nombreVisible(item.autor))} · ${formatearFecha(item.created_at)}</div>`;
    cont.appendChild(tarjeta);
  });
}

function renderGaleria(items, cont) {
  const rejilla = document.createElement('div');
  rejilla.className = 'rejilla';
  if (modoSeleccionActivo) rejilla.classList.add('modo-seleccion');
  items.forEach((item) => {
    const celda = document.createElement('button');
    celda.className = 'celda';
    celda.dataset.id = item.id;
    const esVideo = item.tipo === 'video';
    celda.innerHTML = (esVideo
      ? `<video src="${escapeAttr(item.url_archivo || '')}" muted></video><span class="marca-video">▶</span>`
      : `<img src="${escapeAttr(item.url_archivo || '')}" alt="" loading="lazy">`)
      + `<span class="marca-seleccion">✓</span>`;
    celda.addEventListener('click', () => {
      if (modoSeleccionActivo) alternarSeleccionCelda(celda, item);
      else abrirVisor(item);
    });
    rejilla.appendChild(celda);
  });
  cont.appendChild(rejilla);
}

function convertirYoutubeEmbed(url) {
  try {
    const u = new URL(url);
    const id = u.searchParams.get('v') || u.pathname.split('/').pop();
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return url;
  }
}

/* ============================================================
   Selección múltiple (Recuerdos e Instantáneas): descargar y,
   para instantáneas, guardar también en Recuerdos.
   ============================================================ */
let modoSeleccionActivo = false;

function activarModoSeleccion() {
  modoSeleccionActivo = true;
  seleccionActual.clear();
  $('.rejilla')?.classList.add('modo-seleccion');
  $('#barra-seleccion').classList.remove('oculto');
  $('#btn-guardar-recuerdos').classList.toggle('oculto', seccionActual !== 'instantaneas');
  actualizarConteoSeleccion();
}

function desactivarModoSeleccion() {
  modoSeleccionActivo = false;
  seleccionActual.clear();
  $('.rejilla')?.classList.remove('modo-seleccion');
  $$('.celda.seleccionada').forEach((c) => c.classList.remove('seleccionada'));
  $('#barra-seleccion')?.classList.add('oculto');
}

function alternarSeleccionCelda(celda, item) {
  const yaEsta = seleccionActual.has(item.id);
  celda.classList.toggle('seleccionada', !yaEsta);
  if (yaEsta) seleccionActual.delete(item.id);
  else seleccionActual.set(item.id, item);
  actualizarConteoSeleccion();
}

function actualizarConteoSeleccion() {
  const n = seleccionActual.size;
  $('#conteo-seleccion').textContent = n === 1 ? '1 seleccionada' : `${n} seleccionadas`;
}

async function descargarArchivo(url, nombre) {
  const respuesta = await fetch(url);
  const blob = await respuesta.blob();
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 4000);
}

async function descargarSeleccionados() {
  const items = [...seleccionActual.values()];
  if (!items.length) return;
  const boton = $('#btn-descargar-seleccion');
  boton.disabled = true;
  boton.textContent = 'Descargando…';
  try {
    for (const item of items) {
      if (!item.url_archivo) continue;
      const ext = item.tipo === 'video' ? 'mp4' : 'jpg';
      await descargarArchivo(item.url_archivo, `${seccionActual}-${item.id}.${ext}`);
      await new Promise((r) => setTimeout(r, 350)); // evita que el navegador bloquee varias descargas seguidas
    }
  } catch (e) {
    console.error('No se pudo descargar:', e);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Descargar';
  }
}

async function guardarEnRecuerdos(items) {
  if (!items.length) return;
  const boton = $('#btn-guardar-recuerdos');
  if (boton) { boton.disabled = true; boton.textContent = 'Guardando…'; }
  try {
    const filas = items.map((item) => ({
      seccion: 'recuerdos',
      tipo: item.tipo,
      url_archivo: item.url_archivo,
      titulo: item.titulo || null,
      mensaje: item.mensaje || null,
      autor: item.autor,
    }));
    const { error } = await supabase.from('contenido').insert(filas);
    if (error) throw error;
    desactivarModoSeleccion();
    if (seccionActual === 'instantaneas') abrirSeccion('instantaneas');
  } catch (e) {
    console.error('No se pudo guardar en recuerdos:', e);
  } finally {
    if (boton) { boton.disabled = false; boton.textContent = 'Guardar en Recuerdos'; }
  }
}

/* ============================================================
   Visor (lightbox)
   ============================================================ */
let itemVisorActual = null;

function abrirVisor(item) {
  itemVisorActual = item;
  const cont = $('#visor-contenido');
  cont.innerHTML = item.tipo === 'video'
    ? `<video src="${escapeAttr(item.url_archivo || '')}" controls autoplay playsinline></video>`
    : `<img src="${escapeAttr(item.url_archivo || '')}" alt="">`;

  const meta = $('#visor-meta');
  const puedeGuardar = item.seccion === 'instantaneas' || seccionActual === 'instantaneas';
  meta.innerHTML = `
    <p class="visor-autor">${nombreVisible(item.autor)} · ${formatearFecha(item.created_at)}</p>
    ${item.mensaje ? `<p class="visor-mensaje">${escapeHtml(item.mensaje)}</p>` : ''}
    <div class="visor-acciones">
      ${puedeGuardar ? `<button id="btn-guardar-uno" class="boton-fantasma-claro">Guardar en Recuerdos</button>` : ''}
    </div>
  `;
  $('#btn-guardar-uno')?.addEventListener('click', () => guardarEnRecuerdos([{ ...item, seccion: 'instantaneas' }]));
  $('#visor').classList.add('visible');
}
function cerrarVisor() {
  $('#visor').classList.remove('visible');
  $('#visor-contenido').innerHTML = '';
  $('#visor-meta').innerHTML = '';
  itemVisorActual = null;
}

/* ============================================================
   Modal: nueva publicación
   ============================================================ */
const CONFIG_MODAL = {
  musica: { titulo: 'Subir canción', tipo: 'audio', archivo: true, accept: 'audio/*', tituloCampo: true, tituloPlaceholder: 'Nombre de la canción', mensaje: false, soloAdmin: true, letraCampo: true, comentarioCampo: true },
  textos: { titulo: 'Escribir carta', tipo: 'texto', archivo: false, tituloCampo: true, tituloPlaceholder: 'Título (opcional)', mensaje: true, mensajeLabel: 'Tu carta', mensajeRequerido: true },
  recuerdos: { titulo: 'Agregar recuerdo', tipo: 'imagen', archivo: true, accept: 'image/*,video/*', tituloCampo: false, mensaje: false },
  videos: { titulo: 'Agregar video', tipo: 'video', archivo: true, accept: 'video/*', tituloCampo: true, tituloPlaceholder: 'Título del video', mensaje: false, permiteYoutube: true },
  instantaneas: { titulo: 'Nueva instantánea', tipo: 'imagen', archivo: true, accept: 'image/*,video/*', tituloCampo: false, mensaje: true, mensajeLabel: 'Un pie de foto (opcional)' },
};

function abrirModalNuevo() {
  const cfg = CONFIG_MODAL[seccionActual];
  if (!cfg) return;

  if (cfg.soloAdmin && usuarioActual !== 'alessandro') {
    mostrarErrorForm('Solo Alessandro puede agregar música por ahora.');
    return;
  }

  $('#titulo-modal').textContent = cfg.titulo;
  $('#form-nuevo').reset();
  $('#error-form').classList.add('oculto');

  $('#campo-titulo-wrap').classList.toggle('oculto', !cfg.tituloCampo);
  $('#campo-archivo-wrap').classList.toggle('oculto', !cfg.archivo);
  $('#campo-mensaje-wrap').classList.toggle('oculto', !cfg.mensaje);
  $('#campo-youtube-wrap').classList.toggle('oculto', !cfg.permiteYoutube);
  $('#campo-letra-wrap').classList.toggle('oculto', !cfg.letraCampo);
  $('#campo-comentario-wrap').classList.toggle('oculto', !cfg.comentarioCampo);
  if (cfg.archivo) $('#campo-archivo').accept = cfg.accept || '';
  if (cfg.mensaje) $('#etiqueta-mensaje').textContent = cfg.mensajeLabel || 'Mensaje';
  if (cfg.tituloCampo) $('#campo-titulo').placeholder = cfg.tituloPlaceholder || 'Título';

  $('#modal-nuevo').classList.add('visible');
}

function cerrarModalNuevo() {
  $('#modal-nuevo').classList.remove('visible');
}

/* ============================================================
   Compositor de instantáneas (estilo historia): tomar foto o
   elegir una, escribir un mensaje encima y compartir.
   ============================================================ */
let archivoInstantanea = null;
let previaUrlInstantanea = null;

function abrirCompositorInstantanea() {
  const otro = usuarioActual === 'alessandro' ? 'Mayerli' : 'Alessandro';
  $('#compositor-instantanea .compositor-titulo').textContent = `Una instantánea para ${otro}`;
  volverAElegirFoto();
  $('#compositor-instantanea').classList.add('visible');
}

function cerrarCompositorInstantanea() {
  $('#compositor-instantanea').classList.remove('visible');
  volverAElegirFoto();
}

function volverAElegirFoto() {
  archivoInstantanea = null;
  if (previaUrlInstantanea) { URL.revokeObjectURL(previaUrlInstantanea); previaUrlInstantanea = null; }
  $('#previa-texto').value = '';
  $('#error-compositor').classList.add('oculto');
  $('#entrada-camara').value = '';
  $('#compositor-elegir').classList.remove('oculto');
  $('#compositor-previa').classList.add('oculto');
}

function manejarFotoElegida(archivo) {
  if (!archivo) return;
  archivoInstantanea = archivo;
  previaUrlInstantanea = URL.createObjectURL(archivo);
  $('#previa-imagen').src = previaUrlInstantanea;
  $('#compositor-elegir').classList.add('oculto');
  $('#compositor-previa').classList.remove('oculto');
}

async function publicarInstantanea() {
  if (!archivoInstantanea) return;
  const boton = $('#btn-publicar-instantanea');
  const mensaje = $('#previa-texto').value.trim();
  $('#error-compositor').classList.add('oculto');
  boton.disabled = true;
  boton.textContent = 'Compartiendo…';

  try {
    const ruta = `instantaneas/${Date.now()}-${archivoInstantanea.name}`;
    const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(ruta, archivoInstantanea);
    if (errorSubida) throw errorSubida;
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(ruta);

    const { error } = await supabase.from('contenido').insert({
      seccion: 'instantaneas',
      tipo: 'imagen',
      url_archivo: pub.publicUrl,
      titulo: null,
      mensaje: mensaje || null,
      autor: usuarioActual,
    });
    if (error) throw error;

    cerrarCompositorInstantanea();
    if (seccionActual === 'instantaneas') abrirSeccion('instantaneas');
  } catch (e) {
    const err = $('#error-compositor');
    err.textContent = 'No se pudo compartir: ' + e.message;
    err.classList.remove('oculto');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Compartir';
  }
}

function mostrarErrorForm(msg) {
  const el = $('#error-form');
  el.textContent = msg;
  el.classList.remove('oculto');
}

async function publicar(ev) {
  ev.preventDefault();
  const cfg = CONFIG_MODAL[seccionActual];
  const boton = $('#btn-publicar');
  $('#error-form').classList.add('oculto');

  const titulo = $('#campo-titulo').value.trim();
  const mensaje = $('#campo-mensaje').value.trim();
  const youtubeUrl = $('#campo-youtube').value.trim();
  const letra = $('#campo-letra').value.trim();
  const comentario = $('#campo-comentario').value.trim();
  const archivo = $('#campo-archivo').files[0];

  if (cfg.mensajeRequerido && !mensaje) {
    mostrarErrorForm('Escribe algo antes de publicar.');
    return;
  }
  if (cfg.archivo && !archivo && !(cfg.permiteYoutube && youtubeUrl)) {
    mostrarErrorForm('Elige un archivo para subir.');
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Publicando…';

  try {
    let url_archivo = null;
    let tipo = cfg.tipo;

    if (cfg.permiteYoutube && youtubeUrl && !archivo) {
      url_archivo = youtubeUrl;
      tipo = 'youtube';
    } else if (archivo) {
      const ruta = `${seccionActual}/${Date.now()}-${archivo.name}`;
      const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(ruta, archivo);
      if (errorSubida) throw errorSubida;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
      url_archivo = pub.publicUrl;
      if (archivo.type.startsWith('video/')) tipo = 'video';
      else if (archivo.type.startsWith('image/')) tipo = 'imagen';
      else if (archivo.type.startsWith('audio/')) tipo = 'audio';
    }

    const { error } = await supabase.from('contenido').insert({
      seccion: seccionActual,
      tipo,
      url_archivo,
      titulo: cfg.tituloCampo ? (titulo || null) : null,
      mensaje: cfg.mensaje ? (mensaje || null) : null,
      letra: cfg.letraCampo ? (letra || null) : null,
      comentario: cfg.comentarioCampo ? (comentario || null) : null,
      autor: usuarioActual,
    });
    if (error) throw error;

    cerrarModalNuevo();
    abrirSeccion(seccionActual); // recarga la lista
  } catch (e) {
    mostrarErrorForm('No se pudo publicar: ' + e.message);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Publicar';
  }
}

/* ============================================================
   Utilidades de escape
   ============================================================ */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }

/* ============================================================
   Service worker (PWA)
   ============================================================ */
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW no registrado:', e));
  }
}
