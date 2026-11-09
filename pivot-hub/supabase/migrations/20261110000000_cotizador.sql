-- Pivot Hub · Cotizador
-- Requiere la migración de auditoría (tabla `miembros` y función `es_miembro`).

-- 1. Consecutivo por año: PIV-2026-001, PIV-2026-002…
create table if not exists public.consecutivos (
  anio integer primary key,
  ultimo integer not null default 0
);

alter table public.consecutivos enable row level security;

create policy "miembros ven consecutivos"
  on public.consecutivos for select
  to authenticated
  using (public.es_miembro());

create policy "miembros ajustan consecutivos"
  on public.consecutivos for update
  to authenticated
  using (public.es_miembro())
  with check (public.es_miembro());

create or replace function public.siguiente_numero_cotizacion()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  a integer := extract(year from (now() at time zone 'America/Bogota'))::integer;
  n integer;
begin
  insert into public.consecutivos (anio, ultimo) values (a, 1)
  on conflict (anio) do update set ultimo = public.consecutivos.ultimo + 1
  returning ultimo into n;
  return 'PIV-' || a || '-' || lpad(n::text, 3, '0');
end;
$$;

revoke all on function public.siguiente_numero_cotizacion() from public;

-- 2. Cotizaciones
create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cliente text not null check (char_length(cliente) between 1 and 120),
  contacto text,
  proyecto text not null check (char_length(proyecto) between 1 and 200),
  informe_id uuid references public.informes (id) on delete set null,
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

create index if not exists cotizaciones_creado_en_idx on public.cotizaciones (creado_en desc);

create or replace function public.numerar_cotizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero is null then
    new.numero := public.siguiente_numero_cotizacion();
  end if;
  return new;
end;
$$;

create trigger cotizaciones_numero
  before insert on public.cotizaciones
  for each row execute function public.numerar_cotizacion();

create trigger cotizaciones_actualizado_en
  before update on public.cotizaciones
  for each row execute function public.tocar_actualizado_en();

alter table public.cotizaciones enable row level security;

create policy "miembros leen cotizaciones"
  on public.cotizaciones for select
  to authenticated
  using (public.es_miembro());

create policy "miembros crean cotizaciones"
  on public.cotizaciones for insert
  to authenticated
  with check (public.es_miembro() and creado_por = auth.uid());

create policy "miembros actualizan cotizaciones"
  on public.cotizaciones for update
  to authenticated
  using (public.es_miembro())
  with check (public.es_miembro());

create policy "miembros borran cotizaciones"
  on public.cotizaciones for delete
  to authenticated
  using (public.es_miembro());

-- 3. Si ya llevan cotizaciones este año, ajusta el último número usado
--    (la próxima será este número + 1):
-- insert into public.consecutivos (anio, ultimo) values (2026, 12)
--   on conflict (anio) do update set ultimo = excluded.ultimo;
