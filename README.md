# Nuestro Espacio

PWA privada de dos personas: música, cartas, recuerdos, videos e instantáneas,
con notificaciones tipo Instagram. Sin backend propio: todo vive en Supabase.

> **Este cambio:** se rediseñó la navegación. Antes había una "bandeja" que
> tapaba toda la pantalla; ahora es un **menú lateral retráctil** (como el
> de YouTube) que se abre con el ícono ☰ de arriba a la izquierda, y el
> contenido siempre vive en una "hoja" central flotando sobre el fondo
> rosado — así cada sección se ve como una página con fondo al lado, en vez
> de ocupar todo el ancho. También se agregó selección múltiple con
> descarga en Recuerdos e Instantáneas, y la opción de guardar una
> instantánea directo en Recuerdos.
>
> **Si algo no aparece (como "Música") aunque el código ya lo tenga:** es
> casi siempre el Service Worker sirviendo una copia vieja guardada en el
> navegador. Ya lo cambié de estrategia (ahora siempre busca la versión más
> nueva primero), pero si sigues sin verlo: abre las herramientas de
> desarrollador → pestaña **Application** → **Service Workers** → *Unregister*,
> y **Clear storage** → *Clear site data*, luego recarga. Mientras sigas
> probando en local con Live Server, esto puede volver a pasar cada vez que
> reemplaces archivos sin recargar así — es una molestia típica de las PWA
> durante el desarrollo, no un bug de la app en sí.

## 1. Configura la base de datos

1. Entra a tu proyecto de Supabase (`ycjemiivjknikzmscudj`) → **SQL Editor**.
2. Pega el contenido completo de `sql/schema.sql` y ejecuta (**Run**).
   Esto crea las tablas `contenido` y `notificaciones`, el trigger que genera
   avisos automáticamente, las políticas de acceso y activa Realtime.
   > Si ya habías corrido una versión anterior de este archivo, no pasa nada:
   > vuelve a pegarlo y dale **Run** de nuevo. Los `alter table ... add column
   > if not exists` solo agregan las columnas nuevas (`autor`, `tipo`,
   > `url_archivo`, `titulo`, `seccion`, `contenido_id`, `letra`,
   > `comentario`) sin borrar ninguna publicación existente.
3. Ve a **Storage** → *New bucket* → nómbralo `media` → actívalo como
   **público**. Ahí se guardarán fotos, audios y videos.

## 2. Conecta la app a tu proyecto

Abre `js/supabase-client.js`. La URL y la clave publicable (`anon key`) ya
están puestas con los datos que compartiste. Si alguna vez rotas la clave en
Supabase, actualízala ahí.

> La `anon key` es pública por diseño (Supabase la protege con las políticas
> de la base de datos, no ocultándola), así que no pasa nada porque quede en
> el código del cliente.

## 3. Pruébala en tu computadora

No necesitas Node ni build tools. Basta un servidor estático, por ejemplo:

```bash
cd nuestro-espacio
python3 -m http.server 8080
```

Abre `http://localhost:8080` en el navegador.

## 4. Publícala para poder instalarla en el celular

Un Service Worker (`sw.js`) solo funciona en **HTTPS** (o `localhost`), así
que para instalarla como app necesitas subirla a un hosting con HTTPS.
Gratis y en minutos con cualquiera de estos, arrastrando la carpeta
`nuestro-espacio`:

- **Netlify** → netlify.com/drop
- **Vercel** → vercel.com (importar carpeta)
- **GitHub Pages** → sube la carpeta a un repo y activa Pages

Después, desde el celular de cada uno:
- **Android/Chrome:** menú ⋮ → "Añadir a pantalla de inicio" / "Instalar app".
- **iPhone/Safari:** botón compartir → "Añadir a pantalla de inicio".

## 5. Cómo se usa

- Al entrar por primera vez, cada quien elige su nombre (Alessandro o
  Mayerli). Eso queda guardado en el propio celular y se usa como autoría de
  lo que publique.
- Música solo la sube Alessandro; Mayerli puede escucharla pero no subir
  canciones nuevas (las demás secciones —cartas, recuerdos, videos,
  instantáneas— las alimentan los dos).
- El ícono ☰ arriba a la izquierda abre y cierra el menú lateral con las
  5 secciones y los avisos. El contenido de cada sección aparece siempre
  dentro de la misma "hoja" central, con el fondo rosado visible alrededor
  — nunca ocupa toda la pantalla de borde a borde. La flecha de "‹" arriba
  regresa a la portada (el cassette del inicio).
- En pantallas anchas (computadora) la app se ve como un celular centrado,
  en vez de estirarse a todo el ancho de la ventana — así las fotos y el
  contenido se ven del tamaño correcto también al probar desde el navegador
  de escritorio.
- En Recuerdos e Instantáneas, el ícono de "check" en el encabezado activa
  el modo de selección: toca las fotos que quieras, y abajo aparece una
  barra para **descargarlas** (se bajan directo al dispositivo) o, si estás
  en Instantáneas, **guardarlas también en Recuerdos**. Esa misma opción de
  "Guardar en Recuerdos" aparece al abrir una sola instantánea en grande.
- En Música puedes agregar, opcionalmente, la letra de la canción (la
  escribes tú mismo al subirla) y se muestra deslizándose de forma
  aproximada mientras suena — no se busca en ninguna base de datos externa.
- También puedes agregar un comentario corto para acompañar esa letra (ej.
  "Esta canción me recuerda a usted"). Es opcional: si no escribes uno, esa
  parte simplemente no aparece en la tarjeta de la canción.
- Instantáneas tiene su propio compositor estilo "historia": tomas la foto
  ahí mismo (o eliges una), escribes un mensaje encima y la compartes.
- Cada publicación nueva crea automáticamente un aviso en la campana 🔔
  (vía el trigger de la base de datos), con conteo de no leídos.
- Además, mientras la app está abierta, en cuanto uno de los dos publica algo
  le aparece a la otra persona un **widget flotante** en la esquina inferior
  izquierda (vía Supabase Realtime, sin recargar nada): si es una foto o un
  recuerdo, la miniatura se queda visible unos segundos; si es una canción,
  un video o una carta, solo aparece el aviso (sin dejar el contenido
  "pegado" en pantalla). Tocar el widget te lleva directo a esa sección.
  Esto solo funciona con la app abierta en primer plano — no es una
  notificación push del sistema operativo (eso requeriría backend propio,
  ver "Ideas para más adelante").

## 6. Estructura del proyecto

```
nuestro-espacio/
├── index.html          → toda la interfaz (una sola pantalla, varias vistas)
├── manifest.json        → metadatos de instalación de la PWA
├── sw.js                 → cache del "shell" de la app para carga rápida
├── css/style.css         → estilos
├── js/supabase-client.js → conexión a Supabase
├── js/app.js              → toda la lógica (routing, CRUD, notificaciones)
├── icons/                 → íconos de instalación (reemplázalos si quieres)
└── sql/schema.sql         → script de base de datos
```

## Ideas para más adelante (no incluidas todavía)

- Fondo con fotos de ustedes de niños, una a cada lado detrás de la hoja
  central (lo mencionaste como opcional, para después). El lugar ya está
  preparado en `.fondo-app` dentro de `css/style.css` — cuando tengas las
  fotos, se agregan ahí como dos `<img>` de fondo bien sutiles.
- Notificaciones push reales (cuando la app está cerrada) — requieren un
  pequeño backend o Supabase Edge Functions + Web Push.
- Compresión/miniaturas automáticas de fotos y videos antes de subir.
- Reordenar o eliminar publicaciones desde la propia app (hoy se haría
  manualmente desde el panel de Supabase).
- Reemplazar el modelo "elige tu nombre" por Supabase Auth si en algún
  momento quieres contraseña real por persona.
