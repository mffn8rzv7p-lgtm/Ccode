-- Pivot Hub · Auditoría de Instagram
-- Acceso: correos @pivotagencia.com (más las excepciones de la tabla `miembros`).

-- 1. Acceso: cualquier correo verificado de @pivotagencia.com (igual que Bong).
--    La tabla `miembros` sirve solo para excepciones (personas externas autorizadas).
create table if not exists public.miembros (
  email text primary key,
  nombre text,
  creado_en timestamptz not null default now()
);

alter table public.miembros enable row level security;

create or replace function public.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) like '%@pivotagencia.com'
    or exists (
      select 1 from public.miembros
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.es_miembro() from public;
grant execute on function public.es_miembro() to authenticated;

create policy "miembros se ven entre sí"
  on public.miembros for select
  to authenticated
  using (public.es_miembro());

-- 2. Informes
create table if not exists public.informes (
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

create index if not exists informes_creado_en_idx on public.informes (creado_en desc);

alter table public.informes enable row level security;

create policy "miembros leen informes"
  on public.informes for select
  to authenticated
  using (public.es_miembro());

create policy "miembros crean informes"
  on public.informes for insert
  to authenticated
  with check (public.es_miembro() and creado_por = auth.uid());

create policy "miembros actualizan informes"
  on public.informes for update
  to authenticated
  using (public.es_miembro())
  with check (public.es_miembro());

create policy "miembros borran informes"
  on public.informes for delete
  to authenticated
  using (public.es_miembro());

create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger informes_actualizado_en
  before update on public.informes
  for each row execute function public.tocar_actualizado_en();

-- 3. Capturas de pantalla (privadas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('capturas', 'capturas', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "miembros suben capturas"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'capturas' and public.es_miembro());

create policy "miembros leen capturas"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'capturas' and public.es_miembro());

create policy "miembros borran capturas"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'capturas' and public.es_miembro());

-- 4. Excepciones: personas sin correo @pivotagencia.com que también pueden entrar.
-- insert into public.miembros (email, nombre) values ('persona@otrodominio.com', 'Nombre');
