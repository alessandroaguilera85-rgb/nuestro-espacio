-- ============================================================
-- "Nuestro Espacio" — esquema de base de datos (Supabase / Postgres)
-- Pega este archivo completo en Supabase → SQL Editor → Run
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tabla: contenido ----------
create table if not exists public.contenido (
  id          uuid primary key default gen_random_uuid(),
  seccion     text not null check (seccion in ('musica','recuerdos','textos','videos','instantaneas')),
  tipo        text not null check (tipo in ('imagen','video','texto','youtube','audio')),
  url_archivo text,
  titulo      text,
  mensaje     text,
  autor       text not null check (autor in ('alessandro','ella')),
  created_at  timestamptz not null default now()
);

-- Letra opcional de la canción (la escribe quien la sube, para verla
-- mientras suena). No se busca ni se copia de ninguna base de datos externa.
alter table public.contenido add column if not exists letra text;

-- Comentario opcional que acompaña a la letra (ej. "Esta canción me
-- recuerda a usted"). Solo se muestra en la tarjeta de la canción si se
-- escribió uno; si queda vacío, esa parte no aparece.
alter table public.contenido add column if not exists comentario text;

create index if not exists contenido_seccion_idx on public.contenido (seccion, created_at desc);

-- ---------- Tabla: notificaciones ----------
create table if not exists public.notificaciones (
  id          uuid primary key default gen_random_uuid(),
  mensaje     text not null,
  leido       boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Columnas extra para que el "widget" flotante sepa qué mostrar sin tener
-- que ir a buscar el contenido aparte (autor, tipo, url, sección, título).
-- Si ya tenías la tabla creada de antes, esto la actualiza sin borrar nada.
alter table public.notificaciones add column if not exists contenido_id uuid references public.contenido(id) on delete set null;
alter table public.notificaciones add column if not exists autor text;
alter table public.notificaciones add column if not exists tipo text;
alter table public.notificaciones add column if not exists url_archivo text;
alter table public.notificaciones add column if not exists titulo text;
alter table public.notificaciones add column if not exists seccion text;

-- Si ya habías creado estas columnas a mano desde el editor de tablas de
-- Supabase y elegiste "text" para TODAS (incluida contenido_id), corrige
-- solo esa: tiene que ser uuid para poder enlazar con contenido.id.
-- Las demás (autor, tipo, url_archivo, titulo, seccion) sí van como text,
-- esas están bien. Corre esto una sola vez si contenido_id quedó como text:
--
--   alter table public.notificaciones
--     alter column contenido_id type uuid using nullif(contenido_id, '')::uuid;
--   alter table public.notificaciones
--     add constraint notificaciones_contenido_id_fkey
--     foreign key (contenido_id) references public.contenido(id) on delete set null;

-- ---------- Trigger: crea la notificación automáticamente ----------
create or replace function public.crear_notificacion_contenido()
returns trigger
language plpgsql
security definer
as $$
declare
  quien text;
  seccion_label text;
begin
  quien := case when new.autor = 'alessandro' then 'Alessandro' else 'Ella' end;
  seccion_label := case new.seccion
    when 'musica' then 'la música'
    when 'recuerdos' then 'los recuerdos'
    when 'textos' then 'las cartas'
    when 'videos' then 'los videos'
    when 'instantaneas' then 'instantáneas'
    else new.seccion
  end;

  insert into public.notificaciones (mensaje, contenido_id, autor, tipo, url_archivo, titulo, seccion)
  values (
    quien || ' compartió algo nuevo en ' || seccion_label,
    new.id, new.autor, new.tipo, new.url_archivo, new.titulo, new.seccion
  );

  return new;
end;
$$;

drop trigger if exists trg_contenido_notificacion on public.contenido;
create trigger trg_contenido_notificacion
  after insert on public.contenido
  for each row execute function public.crear_notificacion_contenido();

-- ---------- Row Level Security ----------
-- App privada de 2 personas que comparten la misma clave publicable (anon key).
-- No hay login de Supabase Auth: el acceso está protegido porque la URL/clave
-- del proyecto solo la tienen ustedes dos. Se deja abierto para lectura/escritura
-- del anon key. Si más adelante quieren Auth real, estas policies se reemplazan
-- por reglas basadas en auth.uid().

alter table public.contenido enable row level security;
alter table public.notificaciones enable row level security;

create policy "contenido: lectura publica" on public.contenido
  for select using (true);
create policy "contenido: insercion publica" on public.contenido
  for insert with check (true);
create policy "contenido: actualizacion publica" on public.contenido
  for update using (true);
create policy "contenido: borrado publico" on public.contenido
  for delete using (true);

create policy "notificaciones: lectura publica" on public.notificaciones
  for select using (true);
create policy "notificaciones: actualizacion publica" on public.notificaciones
  for update using (true);

-- ---------- Realtime ----------
-- Activa "Realtime" para estas dos tablas. El bloque de abajo revisa primero
-- si ya están agregadas antes de intentarlo — así puedes correr este script
-- completo las veces que quieras sin que falle con el error 42710
-- ("relation is already member of publication").
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contenido'
  ) then
    alter publication supabase_realtime add table public.contenido;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificaciones'
  ) then
    alter publication supabase_realtime add table public.notificaciones;
  end if;
end $$;

-- ---------- Storage ----------
-- Crea manualmente, en Storage, un bucket público llamado "media"
-- (Storage → New bucket → "media" → Public bucket: activado).
-- Ahí se subirán fotos, audios y videos; en "contenido.url_archivo"
-- se guarda la URL pública que Supabase genera para cada archivo.
