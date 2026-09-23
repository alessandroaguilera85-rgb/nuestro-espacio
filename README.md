# Nuestro Espacio — Alessandro & Mayerli

App móvil de recuerdos compartidos + Supabase (Storage + tablas).

## Subir a Netlify (con GitHub)

1. En GitHub: **New repository** (puede ser privado).
2. Sube **el contenido de esta carpeta** (`index.html`, `pages/`, `js/`, `netlify.toml`) en la raíz del repo, no otra carpeta adentro.
3. En [netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub → ese repo.
4. Build command: vacío. Publish directory: `.` (o déjalo vacío).
5. Deploy. Te da una URL tipo `https://algo.netlify.app`.

Cámara, mic y el cifrado AES solo funcionan en **https** (Netlify ya lo trae).

## Abrir en local
Abre `index.html` en el celular (o Live Server / ngrok).

1. Bienvenida → Entrar  
2. ¿Quién eres? → Alessandro / Mayerli  
3. Menú inferior: Espacio · Recuerdos · Fotos · Música · Cartas · Avisos  

## Supabase

- URL: `https://ycjeiwjknikzmcudj.supabase.co`
- Key: `sb_publishable_pwupEP80mrBGtABOEoFXQ_IkfF51PW`

### Storage (obligatorio para subir fotos)

1. En el dashboard → **Storage** → New bucket  
2. Nombre: **`media`**  
3. Marca **Public bucket**  
4. Policies (o usa el editor de policies):

```sql
-- Lectura pública
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Subida con anon key
CREATE POLICY "Anon upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media');
```

### Tablas RLS

Permite a `anon`:
- `contenido`: SELECT, INSERT  
- `notificaciones`: SELECT, INSERT, UPDATE  

### Columnas usadas
`contenido`: seccion, tipo, url_archivo, titulo, mensaje, letra, autor, created_at  
`notificaciones`: mensaje, leido, contenido_id, autor, titulo, seccion, url_archivo, created_at  

Valores de `seccion`: `recuerdos` | `fotos` | `musica` | `cartas`

## Funciones
- Subida real de fotos (cámara o galería) → Storage → URL en `contenido`
- Filtros por autor en Recuerdos / Instantáneas
- Polaroids del inicio: textos editables (toca el pie del marco)
- Cambiar usuario → pantalla “¿Quién eres?”
- Avisos con badge y marcar leído
- Diseño pensado para celular (viewport fijo, safe-area, menú inferior)

## Estructura
```
couple-memory-app/
├── index.html
├── js/supabase-client.js
└── pages/
    ├── inicio.html
    ├── cambiar-usuario.html
    ├── recuerdos.html
    ├── fotos.html
    ├── musica.html
    ├── cartas.html
    └── avisos.html
```
