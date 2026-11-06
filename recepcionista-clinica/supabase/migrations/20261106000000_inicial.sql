-- Tablas de la Recepcionista IA. Solo las usan las Edge Functions con la service role key:
-- RLS activado y sin políticas = nadie más puede leerlas ni escribirlas.

-- Ids de mensajes de WhatsApp ya atendidos (Meta a veces reenvía el mismo mensaje).
create table public.mensajes_procesados (
  id text primary key,
  recibido_en timestamptz not null default now()
);

-- Memoria de cada conversación (lo que dijo la persona y lo que respondió la recepcionista).
create table public.conversaciones (
  id bigint generated always as identity primary key,
  telefono text not null,
  rol text not null check (rol in ('user', 'assistant')),
  contenido text not null,
  creado_en timestamptz not null default now()
);
create index conversaciones_telefono_idx on public.conversaciones (telefono, id desc);

-- Bloqueo corto mientras se reserva un horario, para que dos personas no tomen el mismo.
create table public.bloqueos_horario (
  inicio timestamptz primary key,
  creado_en timestamptz not null default now()
);

alter table public.mensajes_procesados enable row level security;
alter table public.conversaciones enable row level security;
alter table public.bloqueos_horario enable row level security;
