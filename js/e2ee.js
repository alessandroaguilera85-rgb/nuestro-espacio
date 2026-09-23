// AES-256-GCM + PBKDF2 — cifrado en el teléfono, no en Supabase
(function () {
  const PREFIX = 'E2EE1.';
  const SALT = new TextEncoder().encode('nuestro-espacio-v1-salt');
  const ITER = 150000;
  const KEY_LS = 'keepsake_e2ee_phrase';
  const KEY_SS = 'keepsake_e2ee_session';

  function getPhrase() {
    return sessionStorage.getItem(KEY_SS) || localStorage.getItem(KEY_LS) || '';
  }

  function setPhrase(phrase, remember) {
    sessionStorage.setItem(KEY_SS, phrase);
    if (remember) localStorage.setItem(KEY_LS, phrase);
    else localStorage.removeItem(KEY_LS);
  }

  function clearPhrase() {
    sessionStorage.removeItem(KEY_SS);
    localStorage.removeItem(KEY_LS);
    cachedKey = null;
  }

  function isUnlocked() {
    return !!getPhrase();
  }

  function isE2ee(str) {
    return typeof str === 'string' && str.startsWith(PREFIX);
  }

  let cachedKey = null;
  let cachedPhrase = '';

  async function getKey() {
    const phrase = getPhrase();
    if (!phrase) return null;
    if (cachedKey && cachedPhrase === phrase) return cachedKey;
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey('raw', enc.encode(phrase), 'PBKDF2', false, ['deriveKey']);
    cachedKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: SALT, iterations: ITER, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    cachedPhrase = phrase;
    return cachedKey;
  }

  function b64enc(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function b64dec(str) {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function encryptString(plain) {
    if (plain == null || plain === '') return plain;
    if (isE2ee(plain)) return plain;
    const key = await getKey();
    if (!key) return plain;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(String(plain)));
    const pack = new Uint8Array(12 + ct.byteLength);
    pack.set(iv, 0);
    pack.set(new Uint8Array(ct), 12);
    return PREFIX + b64enc(pack);
  }

  async function decryptString(value) {
    if (value == null || value === '') return value;
    if (!isE2ee(value)) return value;
    const key = await getKey();
    if (!key) return '🔒 (desbloquea con la frase)';
    try {
      const pack = b64dec(value.slice(PREFIX.length));
      const iv = pack.slice(0, 12);
      const ct = pack.slice(12);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      return new TextDecoder().decode(pt);
    } catch (e) {
      return '🔒 Frase incorrecta';
    }
  }

  async function encryptBytes(buf) {
    const key = await getKey();
    if (!key) return null;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf);
    const pack = new Uint8Array(12 + ct.byteLength);
    pack.set(iv, 0);
    pack.set(new Uint8Array(ct), 12);
    return pack;
  }

  async function decryptBytes(pack) {
    const key = await getKey();
    if (!key) return null;
    const iv = pack.slice(0, 12);
    const ct = pack.slice(12);
    return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  }

  async function mapRow(row) {
    if (!row) return row;
    const out = { ...row };
    if ((out.comentario || '') === 'webrtc' || (out.comentario || '') === 'call_state') return out;
    if (out.mensaje) out.mensaje = await decryptString(out.mensaje);
    if (out.titulo && isE2ee(out.titulo)) out.titulo = await decryptString(out.titulo);
    if (out.letra) out.letra = await decryptString(out.letra);
    return out;
  }

  async function mapRows(rows) {
    const list = rows || [];
    const out = [];
    for (const r of list) out.push(await mapRow(r));
    return out;
  }

  const SKIP_TITLE = new Set(['chat', 'sticker', 'audio', 'fondo', 'chat_bg', 'offer', 'answer', 'ice', 'hangup', 'ringing']);

  async function prepareOut(row) {
    const out = { ...row };
    if ((out.comentario || '') === 'webrtc' || (out.comentario || '') === 'call_state') return out;
    if (out.mensaje) out.mensaje = await encryptString(out.mensaje);
    if (out.letra) out.letra = await encryptString(out.letra);
    if (out.titulo && !SKIP_TITLE.has(String(out.titulo).toLowerCase())) {
      out.titulo = await encryptString(out.titulo);
    }
    return out;
  }

  function injectUnlock() {
    if (document.getElementById('e2ee-lock')) return;
    const wrap = document.createElement('div');
    wrap.id = 'e2ee-lock';
    wrap.innerHTML = `
      <div style="position:fixed;inset:0;z-index:200;background:#fcf9f4;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Plus Jakarta Sans,sans-serif">
        <div style="width:100%;max-width:360px;text-align:center">
          <p style="letter-spacing:.2em;font-size:11px;color:#944652;font-weight:600">CIFRADO</p>
          <h2 style="font-family:Playfair Display,serif;font-style:italic;font-size:28px;margin:8px 0 12px">Frase secreta</h2>
          <p style="font-size:13px;color:#534344;margin-bottom:16px">La misma para los dos. Sin ella, nadie (ni Supabase) lee el chat, las cartas ni los textos.</p>
          <input id="e2ee-pass" type="password" placeholder="Frase compartida" style="width:100%;padding:12px 14px;border-radius:14px;background:#fff;border:1px solid #eadfd8;margin-bottom:10px;outline:none"/>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#534344;margin-bottom:14px">
            <input id="e2ee-rem" type="checkbox"/> Recordar en este teléfono
          </label>
          <button id="e2ee-go" type="button" style="width:100%;padding:12px;border-radius:999px;background:#d67b88;color:#fff;font-weight:600;border:0">Desbloquear</button>
          <p id="e2ee-err" style="display:none;color:#b42318;font-size:12px;margin-top:10px"></p>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const go = () => {
      const p = document.getElementById('e2ee-pass').value;
      if (!p || p.length < 6) {
        const err = document.getElementById('e2ee-err');
        err.style.display = 'block';
        err.textContent = 'Mínimo 6 caracteres. Pónganse de acuerdo en la frase.';
        return;
      }
      setPhrase(p, document.getElementById('e2ee-rem').checked);
      wrap.remove();
      document.dispatchEvent(new Event('e2ee-unlocked'));
    };
    document.getElementById('e2ee-go').onclick = go;
    document.getElementById('e2ee-pass').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') go();
    });
  }

  function requireUnlock() {
    if (isUnlocked()) return Promise.resolve(true);
    injectUnlock();
    return new Promise((resolve) => {
      document.addEventListener('e2ee-unlocked', () => resolve(true), { once: true });
    });
  }

  window.KeepsakeE2EE = {
    PREFIX,
    isE2ee,
    isUnlocked,
    getPhrase,
    setPhrase,
    clearPhrase,
    encryptString,
    decryptString,
    encryptBytes,
    decryptBytes,
    mapRow,
    mapRows,
    prepareOut,
    requireUnlock
  };
})();
