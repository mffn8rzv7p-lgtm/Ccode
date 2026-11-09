-- Bong v2 · Brief que llena el cliente desde un enlace (sin cuenta)
-- El cliente solo puede leer y escribir SU brief, y únicamente mediante estas dos funciones con su token.

alter table public.hub_briefs
  add column if not exists token_cliente uuid unique,
  add column if not exists enviado_en timestamptz,
  add column if not exists respondido_en timestamptz,
  add column if not exists respuestas_cliente jsonb not null default '{}'::jsonb;

alter table public.hub_briefs drop constraint if exists hub_briefs_estado_check;
alter table public.hub_briefs add constraint hub_briefs_estado_check
  check (estado in ('borrador', 'enviado', 'respondido', 'listo'));

-- Lo que ve el cliente al abrir su enlace
create or replace function public.hub_brief_publico(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'cliente', cliente,
    'proyecto', proyecto,
    'respuestas', respuestas_cliente,
    'respondido_en', respondido_en
  )
  from public.hub_briefs
  where token_cliente = p_token and enviado_en is not null and documento is null;
$$;

-- Guarda las respuestas del cliente (borrador o envío final)
create or replace function public.hub_brief_responder(p_token uuid, p_respuestas jsonb, p_final boolean default false)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_respuestas is null or jsonb_typeof(p_respuestas) <> 'object' or pg_column_size(p_respuestas) > 200000 then
    raise exception 'respuestas inválidas';
  end if;
  update public.hub_briefs
     set respuestas_cliente = p_respuestas,
         respondido_en = case when p_final then now() else respondido_en end,
         estado = case when p_final then 'respondido' else estado end
   where token_cliente = p_token and enviado_en is not null and documento is null;
  get diagnostics n = row_count;
  return n = 1;
end;
$$;

revoke all on function public.hub_brief_publico(uuid) from public;
revoke all on function public.hub_brief_responder(uuid, jsonb, boolean) from public;
grant execute on function public.hub_brief_publico(uuid) to anon, authenticated;
grant execute on function public.hub_brief_responder(uuid, jsonb, boolean) to anon, authenticated;
