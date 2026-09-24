// Supabase client — Nuestro Espacio (Alessandro & Mayerli)
const SUPABASE_URL = 'https://ycjemiivjknikzmscudj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pwupEPS80mrBGtABOEoFXQ_IkfF51PW';
const STORAGE_BUCKET = 'media';

function loadE2ee() {
  return new Promise((resolve) => {
    if (window.KeepsakeE2EE) return resolve(window.KeepsakeE2EE);
    const s = document.createElement('script');
    s.src = (document.currentScript && document.currentScript.src
      ? document.currentScript.src.replace(/[^/]+$/, 'e2ee.js')
      : '../js/e2ee.js');
    // pages live in /pages so relative from client file:
    s.src = new URL('e2ee.js', document.querySelector('script[src*="supabase-client"]')?.src || '../js/supabase-client.js').href;
    s.onload = () => resolve(window.KeepsakeE2EE);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

function ensureClient() {
  return new Promise((resolve) => {
    if (window.supabaseClient) {
      resolve(window.supabaseClient);
      return;
    }
    if (typeof supabase !== 'undefined') {
      window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      document.dispatchEvent(new Event('supabase-ready'));
      resolve(window.supabaseClient);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      document.dispatchEvent(new Event('supabase-ready'));
      resolve(window.supabaseClient);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function getCurrentUser() {
  return localStorage.getItem('keepsake_user') || null;
}

function setCurrentUser(name) {
  localStorage.setItem('keepsake_user', name);
  document.dispatchEvent(new CustomEvent('keepsake-user-changed', { detail: name }));
}

function hasSelectedUser() {
  return !!localStorage.getItem('keepsake_user');
}

function isAlessandro() {
  return (getCurrentUser() || '').toLowerCase() === 'alessandro';
}

async function fetchContenido(seccion, tipo = null) {
  const client = await ensureClient();
  if (!client) return [];
  let query = client
    .from('contenido')
    .select('*')
    .eq('seccion', seccion)
    .order('created_at', { ascending: false });
  if (tipo) query = query.eq('tipo', tipo);
  const { data, error } = await query;
  if (error) {
    console.error('fetchContenido', error);
    return [];
  }
  const e2 = await loadE2ee();
  return e2 ? e2.mapRows(data || []) : (data || []);
}

async function fetchContenidoAny(secciones) {
  const client = await ensureClient();
  if (!client) return [];
  const { data, error } = await client
    .from('contenido')
    .select('*')
    .in('seccion', secciones)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchContenidoAny', error);
    return [];
  }
  const e2 = await loadE2ee();
  return e2 ? e2.mapRows(data || []) : (data || []);
}

async function insertContenido(row) {
  const client = await ensureClient();
  if (!client) return { data: null, error: { message: 'No hay cliente Supabase' } };

  // Solo campos del esquema; created_at lo pone la BD (default now())
  const payload = {
    seccion: row.seccion,
    tipo: row.tipo || null,
    url_archivo: row.url_archivo || null,
    titulo: row.titulo || null,
    mensaje: row.mensaje || null,
    letra: row.letra || null,
    autor: row.autor || getCurrentUser() || null,
    comentario: row.comentario || null
  };

  const e2 = await loadE2ee();
  let out = payload;
  if (e2 && e2.isUnlocked()) out = await e2.prepareOut(payload);

  Object.keys(out).forEach((k) => {
    if (out[k] === null || out[k] === undefined) delete out[k];
  });

  const { data, error } = await client.from('contenido').insert(out).select().single();
  if (error) {
    console.error('insertContenido', error.code, error.message, error.details, error.hint, payload);
  }
  return { data, error };
}

async function updateContenido(id, fields) {
  const client = await ensureClient();
  if (!client) return { data: null, error: { message: 'No client' } };
  const allowed = {};
  ['titulo', 'mensaje', 'letra', 'comentario', 'url_archivo', 'tipo'].forEach((k) => {
    if (fields[k] !== undefined) allowed[k] = fields[k];
  });
  const e2u = await loadE2ee();
  const outUp = e2u && e2u.isUnlocked() ? await e2u.prepareOut(allowed) : allowed;
  const { data, error } = await client.from('contenido').update(outUp).eq('id', id).select().single();
  if (error) console.error('updateContenido', error);
  return { data, error };
}

async function deleteContenido(id) {
  const client = await ensureClient();
  if (!client) return { error: { message: 'No client' } };
  const { error } = await client.from('contenido').delete().eq('id', id);
  if (error) console.error('deleteContenido', error);
  return { error };
}

async function deleteContenidoByComentario(comentarios) {
  const client = await ensureClient();
  if (!client) return { error: { message: 'No client' } };
  const list = Array.isArray(comentarios) ? comentarios : [comentarios];
  const { error } = await client.from('contenido').delete().in('comentario', list);
  if (error) console.error('deleteContenidoByComentario', error);
  return { error };
}

async function uploadFile(file, folder = 'uploads', opts = {}) {
  const client = await ensureClient();
  if (!client) return { url: null, error: { message: 'No client' } };
  if (!file) return { url: null, error: { message: 'Sin archivo' } };

  const e2f = await loadE2ee();
  let body = file;
  let ext = (file.name && file.name.split('.').pop()) || 'jpg';
  let contentType = file.type || 'image/jpeg';
  // Fotos/videos se suben en claro: el celular no puede pintar .e2ee en <img>/<video>
  if (opts.encrypt && e2f && e2f.isUnlocked() && !opts.plain) {
    const buf = await file.arrayBuffer();
    const packed = await e2f.encryptBytes(buf);
    if (packed) {
      body = new Blob([packed], { type: 'application/octet-stream' });
      ext = 'e2ee';
      contentType = 'application/octet-stream';
    }
  }
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${String(ext).toLowerCase()}`;
  const path = `${folder}/${safeName}`;

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, body, {
    cacheControl: '3600',
    upsert: false,
    contentType
  });

  if (error) {
    console.error('uploadFile', error);
    return { url: null, error };
  }

  const { data: pub } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: pub?.publicUrl || null, error: null, path };
}

async function fetchNotificaciones(onlyUnread = false) {
  const client = await ensureClient();
  if (!client) return [];
  let query = client
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false });
  if (onlyUnread) query = query.eq('leido', false);
  const { data, error } = await query;
  if (error) {
    console.error('fetchNotificaciones', error);
    return [];
  }
  // Solo avisos del otro: si Mayerli sube, ve Alessandro (y viceversa)
  const me = (getCurrentUser() || '').toLowerCase();
  const list = (data || []).filter((n) => (n.autor || '').toLowerCase() !== me);
  const e2n = await loadE2ee();
  if (!e2n) return list;
  const out = [];
  for (const n of list) {
    const row = { ...n };
    if (row.mensaje) row.mensaje = await e2n.decryptString(row.mensaje);
    if (row.titulo) row.titulo = await e2n.decryptString(row.titulo);
    out.push(row);
  }
  return out;
}

async function markAsRead(id) {
  const client = await ensureClient();
  if (!client) return;
  await client.from('notificaciones').update({ leido: true }).eq('id', id);
}

async function markAllAsRead() {
  const client = await ensureClient();
  if (!client) return;
  // Solo marca como leídos los del otro (los propios no se muestran)
  const me = getCurrentUser();
  const list = await fetchNotificaciones(true);
  if (!list.length) return;
  const ids = list.map((n) => n.id);
  await client.from('notificaciones').update({ leido: true }).in('id', ids);
}

async function getUnreadCount() {
  const list = await fetchNotificaciones(true);
  return list.length;
}

async function createNotificacion(payload) {
  const client = await ensureClient();
  if (!client) return;
  const row = {
    mensaje: payload.mensaje,
    leido: false,
    contenido_id: payload.contenido_id || null,
    autor: payload.autor || getCurrentUser(),
    tipo: payload.tipo || null,
    url_archivo: payload.url_archivo || null,
    titulo: payload.titulo || null,
    seccion: payload.seccion || null
  };
  const e2n = await loadE2ee();
  if (e2n && e2n.isUnlocked()) {
    if (row.mensaje) row.mensaje = await e2n.encryptString(row.mensaje);
    if (row.titulo && row.titulo.length > 20) row.titulo = await e2n.encryptString(row.titulo);
  }
  Object.keys(row).forEach((k) => {
    if (row[k] === null) delete row[k];
  });
  const { error } = await client.from('notificaciones').insert(row);
  if (error) console.error('createNotificacion', error);
}

function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHrs < 24) return `hace ${diffHrs} h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatFullDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

async function refreshUnreadBadge() {
  try {
    const count = await getUnreadCount();
    document.querySelectorAll('.unread-badge').forEach((badge) => {
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
  } catch (e) {
    console.warn('badge', e);
  }
}

/** Mensaje legible de error Supabase */
function errMsg(error) {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;
  return error.message || error.details || error.hint || JSON.stringify(error);
}

async function resolveMedia(url) {
  if (!url) return url;
  if (!/\.e2ee(\?|$)/i.test(url)) return url;
  const e2 = await loadE2ee();
  if (!e2 || !e2.isUnlocked()) return url;
  try {
    const res = await fetch(url);
    const buf = new Uint8Array(await res.arrayBuffer());
    const raw = await e2.decryptBytes(buf);
    if (!raw) return url;
    const head = new Uint8Array(raw.slice(0, 12));
    let mime = 'application/octet-stream';
    if (head[0]===0xFF && head[1]===0xD8) mime='image/jpeg';
    else if (head[0]===0x89 && head[1]===0x50) mime='image/png';
    else if (head[0]===0x47 && head[1]===0x49) mime='image/gif';
    else if (head[4]===0x66 && head[5]===0x74 && head[6]===0x79 && head[7]===0x70) mime='video/mp4';
    else if (head[0]===0x1A && head[1]===0x45) mime='video/webm';
    const blob = new Blob([raw], {type: mime});
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('resolveMedia', e);
    return url;
  }
}

window.KeepsakeDB = {
  ensureClient,
  fetchContenido,
  fetchContenidoAny,
  insertContenido,
  updateContenido,
  deleteContenido,
  deleteContenidoByComentario,
  uploadFile,
  fetchNotificaciones,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotificacion,
  formatRelativeTime,
  formatFullDate,
  getCurrentUser,
  setCurrentUser,
  hasSelectedUser,
  isAlessandro,
  refreshUnreadBadge,
  errMsg,
  resolveMedia,
  hydrateMedia: async (root) => {
    const scope = root || document;
    const els = scope.querySelectorAll('img[src], video[src], audio[src]');
    for (const el of els) {
      const u = el.getAttribute('src') || '';
      if (/\.e2ee/i.test(u)) {
        const next = await resolveMedia(u);
        if (next && next !== u) el.src = next;
      }
    }
  },
  requireUnlock: async () => {
    const e2 = await loadE2ee();
    if (e2) return e2.requireUnlock();
  },
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  STORAGE_BUCKET
};

ensureClient().then(() => refreshUnreadBadge());
if (/\/pages\//.test(location.pathname)) {
  loadE2ee().then((e2) => e2 && e2.requireUnlock());
}
