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
