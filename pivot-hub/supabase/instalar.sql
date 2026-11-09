-- Bong v2 · instalación completa (une las migraciones de supabase/migrations/).
-- Todo lleva el prefijo hub_ para convivir con las tablas del Gestor (Bong) en el mismo proyecto.
-- Pégalo entero en Supabase → SQL Editor y presiona Run una sola vez.

-- Pivot Hub · Auditoría de Instagram
-- Acceso: correos @pivotagencia.com (más las excepciones de la tabla `hub_miembros`).

-- 1. Acceso: cualquier correo verificado de @pivotagencia.com (igual que Bong).
--    La tabla `hub_miembros` sirve solo para excepciones (personas externas autorizadas).
create table if not exists public.hub_miembros (
  email text primary key,
  nombre text,
  creado_en timestamptz not null default now()
);

alter table public.hub_miembros enable row level security;

create or replace function public.hub_es_miembro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) like '%@pivotagencia.com'
    or exists (
      select 1 from public.hub_miembros
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.hub_es_miembro() from public;
grant execute on function public.hub_es_miembro() to authenticated;

create policy "hub_miembros se ven entre sí"
  on public.hub_miembros for select
  to authenticated
  using (public.hub_es_miembro());

-- 2. Informes
create table if not exists public.hub_informes (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cuenta text not null check (cuenta ~ '^[a-z0-9._]{1,30}$'),
  competidores text[] not null default '{}',
  contexto jsonb not null default '{}'::jsonb,
  capturas text[] not null default '{}',
  -- borrador → datos → auditoria → estrategia → listo (o error)
  estado text not null default 'borrador'
    check (estado in ('borrador', 'datos', 'auditoria', 'estrategia', 'listo', 'error')),
  datos jsonb,
  auditoria jsonb,
  estrategia jsonb,
  error text
);

create index if not exists hub_informes_creado_en_idx on public.hub_informes (creado_en desc);

alter table public.hub_informes enable row level security;

create policy "hub_miembros leen informes"
  on public.hub_informes for select
  to authenticated
  using (public.hub_es_miembro());

create policy "hub_miembros crean informes"
  on public.hub_informes for insert
  to authenticated
  with check (public.hub_es_miembro() and creado_por = auth.uid());

create policy "hub_miembros actualizan informes"
  on public.hub_informes for update
  to authenticated
  using (public.hub_es_miembro())
  with check (public.hub_es_miembro());

create policy "hub_miembros borran informes"
  on public.hub_informes for delete
  to authenticated
  using (public.hub_es_miembro());

create or replace function public.hub_tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger informes_actualizado_en
  before update on public.hub_informes
  for each row execute function public.hub_tocar_actualizado_en();

-- 3. Capturas de pantalla (privadas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hub-capturas', 'hub-capturas', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "hub_miembros suben capturas"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'hub-capturas' and public.hub_es_miembro());

create policy "hub_miembros leen capturas"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'hub-capturas' and public.hub_es_miembro());

create policy "hub_miembros borran capturas"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'hub-capturas' and public.hub_es_miembro());

-- 4. Excepciones: personas sin correo @pivotagencia.com que también pueden entrar.
-- insert into public.hub_miembros (email, nombre) values ('persona@otrodominio.com', 'Nombre');

-- Pivot Hub · Cotizador
-- Requiere la migración de auditoría (tabla `hub_miembros` y función `hub_es_miembro`).

-- 1. Consecutivo por año: PIV-2026-001, PIV-2026-002…
create table if not exists public.hub_consecutivos (
  anio integer primary key,
  ultimo integer not null default 0
);

alter table public.hub_consecutivos enable row level security;

create policy "hub_miembros ven hub_consecutivos"
  on public.hub_consecutivos for select
  to authenticated
  using (public.hub_es_miembro());

create policy "hub_miembros ajustan hub_consecutivos"
  on public.hub_consecutivos for update
  to authenticated
  using (public.hub_es_miembro())
  with check (public.hub_es_miembro());

create or replace function public.hub_siguiente_numero_cotizacion()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  a integer := extract(year from (now() at time zone 'America/Bogota'))::integer;
  n integer;
begin
  insert into public.hub_consecutivos (anio, ultimo) values (a, 1)
  on conflict (anio) do update set ultimo = public.hub_consecutivos.ultimo + 1
  returning ultimo into n;
  return 'PIV-' || a || '-' || lpad(n::text, 3, '0');
end;
$$;

revoke all on function public.hub_siguiente_numero_cotizacion() from public;

-- 2. Cotizaciones
create table if not exists public.hub_cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cliente text not null check (char_length(cliente) between 1 and 120),
  contacto text,
  proyecto text not null check (char_length(proyecto) between 1 and 200),
  informe_id uuid references public.hub_informes (id) on delete set null,
  brief jsonb not null default '{}'::jsonb,
  -- análisis de precio propuesto por la IA (piso, mercado, valor, paquetes)
  precio jsonb,
  -- precios que aprobó el equipo; la carta solo usa estos
  aprobado jsonb,
  carta jsonb,
  -- brief → precio → aprobado → listo (o error)
  estado text not null default 'brief'
    check (estado in ('brief', 'precio', 'aprobado', 'listo', 'error')),
  error text
);

create index if not exists hub_cotizaciones_creado_en_idx on public.hub_cotizaciones (creado_en desc);

create or replace function public.hub_numerar_cotizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero is null then
    new.numero := public.hub_siguiente_numero_cotizacion();
  end if;
  return new;
end;
$$;

create trigger cotizaciones_numero
  before insert on public.hub_cotizaciones
  for each row execute function public.hub_numerar_cotizacion();

create trigger cotizaciones_actualizado_en
  before update on public.hub_cotizaciones
  for each row execute function public.hub_tocar_actualizado_en();

alter table public.hub_cotizaciones enable row level security;

create policy "hub_miembros leen cotizaciones"
  on public.hub_cotizaciones for select
  to authenticated
  using (public.hub_es_miembro());

create policy "hub_miembros crean cotizaciones"
  on public.hub_cotizaciones for insert
  to authenticated
  with check (public.hub_es_miembro() and creado_por = auth.uid());

create policy "hub_miembros actualizan cotizaciones"
  on public.hub_cotizaciones for update
  to authenticated
  using (public.hub_es_miembro())
  with check (public.hub_es_miembro());

create policy "hub_miembros borran cotizaciones"
  on public.hub_cotizaciones for delete
  to authenticated
  using (public.hub_es_miembro());

-- 3. Si ya llevan cotizaciones este año, ajusta el último número usado
--    (la próxima será este número + 1):
-- insert into public.hub_consecutivos (anio, ultimo) values (2026, 12)
--   on conflict (anio) do update set ultimo = excluded.ultimo;

-- Bong v2 · Briefs, Parrillas y Moodboards
-- Requiere las migraciones anteriores (hub_es_miembro y hub_tocar_actualizado_en).

-- 1. Briefs
create table if not exists public.hub_briefs (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cliente text not null check (char_length(cliente) between 1 and 120),
  proyecto text not null check (char_length(proyecto) between 1 and 200),
  -- respuestas tal como las escribió el equipo (por secciones) y notas de la reunión
  respuestas jsonb not null default '{}'::jsonb,
  -- brief pulido por la IA (o editado a mano)
  documento jsonb,
  estado text not null default 'borrador' check (estado in ('borrador', 'listo'))
);

-- 2. Parrillas de contenido (un mes por cliente) y sus publicaciones
create table if not exists public.hub_parrillas (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cliente text not null check (char_length(cliente) between 1 and 120),
  mes date not null check (extract(day from mes) = 1),
  brief_id uuid references public.hub_briefs (id) on delete set null,
  redes text[] not null default '{instagram}',
  pilares text[] not null default '{}',
  objetivo text,
  notas text
);

create table if not exists public.hub_publicaciones (
  id uuid primary key default gen_random_uuid(),
  parrilla_id uuid not null references public.hub_parrillas (id) on delete cascade,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  fecha date not null,
  hora text,
  red text not null default 'instagram',
  formato text not null default 'Reel',
  pilar text,
  titulo text not null default '',
  copy text not null default '',
  hashtags text[] not null default '{}',
  idea_visual text,
  arte_url text,
  -- idea → diseño → aprobación → aprobada → programada → publicada
  estado text not null default 'idea'
    check (estado in ('idea', 'diseno', 'aprobacion', 'aprobada', 'programada', 'publicada')),
  orden integer not null default 0
);

create index if not exists hub_publicaciones_parrilla_fecha_idx on public.hub_publicaciones (parrilla_id, fecha);

-- 3. Moodboards
create table if not exists public.hub_moodboards (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cliente text not null check (char_length(cliente) between 1 and 120),
  nombre text not null check (char_length(nombre) between 1 and 120),
  brief_id uuid references public.hub_briefs (id) on delete set null,
  -- concepto, palabras clave, colores, tipografías, estilos gráficos e imágenes
  datos jsonb not null default '{}'::jsonb
);

-- 4. Fecha de actualización y reglas de acceso (mismo patrón para todas)
do $$
declare t text;
begin
  foreach t in array array['hub_briefs', 'hub_parrillas', 'hub_publicaciones', 'hub_moodboards'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.hub_tocar_actualizado_en()', t || '_actualizado_en', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.hub_es_miembro())', 'hub_miembros leen ' || t, t);
    execute format('create policy %I on public.%I for update to authenticated using (public.hub_es_miembro()) with check (public.hub_es_miembro())', 'hub_miembros actualizan ' || t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.hub_es_miembro())', 'hub_miembros borran ' || t, t);
  end loop;
end;
$$;

create policy "hub_miembros crean hub_briefs" on public.hub_briefs for insert to authenticated
  with check (public.hub_es_miembro() and creado_por = auth.uid());
create policy "hub_miembros crean hub_parrillas" on public.hub_parrillas for insert to authenticated
  with check (public.hub_es_miembro() and creado_por = auth.uid());
create policy "hub_miembros crean hub_publicaciones" on public.hub_publicaciones for insert to authenticated
  with check (public.hub_es_miembro());
create policy "hub_miembros crean hub_moodboards" on public.hub_moodboards for insert to authenticated
  with check (public.hub_es_miembro() and creado_por = auth.uid());

-- 5. Imágenes de los moodboards y artes de la parrilla (privadas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hub-moodboards', 'hub-moodboards', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "hub_miembros suben a hub-moodboards" on storage.objects for insert to authenticated
  with check (bucket_id = 'hub-moodboards' and public.hub_es_miembro());
create policy "hub_miembros leen hub-moodboards" on storage.objects for select to authenticated
  using (bucket_id = 'hub-moodboards' and public.hub_es_miembro());
create policy "hub_miembros borran de hub-moodboards" on storage.objects for delete to authenticated
  using (bucket_id = 'hub-moodboards' and public.hub_es_miembro());

