-- Pégalo en Supabase → SQL Editor DESPUÉS de desplegar las funciones (paso 7 del README).
-- Cambia los dos valores marcados con <<< >>> antes de ejecutarlo.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Se guardan en el Vault de Supabase (cifrados), no en el texto de la tarea.
select vault.create_secret('https://<<<TU-PROYECTO>>>.supabase.co', 'project_url');
select vault.create_secret('<<<EL MISMO VALOR QUE PUSISTE EN CRON_SECRET>>>', 'cron_secret');

-- Todos los días a las 8:00 a. m. de Medellín (13:00 UTC; Colombia no cambia de horario).
select cron.schedule(
  'resumen-diario',
  '0 13 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/resumen-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Limpieza cada domingo a las 3:00 a. m. de Medellín: borra ids de mensajes de hace más de 7 días
-- y conversaciones de hace más de 90 días (datos de salud: no guardar más de lo necesario).
select cron.schedule(
  'limpieza-semanal',
  '0 8 * * 0',
  $$
  delete from public.mensajes_procesados where recibido_en < now() - interval '7 days';
  delete from public.conversaciones where creado_en < now() - interval '90 days';
  $$
);

-- Para revisar que quedaron programadas:   select * from cron.job;
-- Para ver las últimas ejecuciones:         select * from cron.job_run_details order by start_time desc limit 10;
