# Recepcionista IA por WhatsApp · Clínica dental (Medellín)

Atiende a los pacientes por WhatsApp a cualquier hora: entiende texto y notas de voz, detecta urgencias,
ofrece horarios libres con botones, agenda en Google Calendar, guarda la ficha en Google Sheets,
manda la ubicación y, cada mañana, le envía un resumen a la doctora y recordatorios a los pacientes.

Corre completo en **Supabase**: Edge Functions, base de datos y cron. No necesitas n8n ni otro servidor.

```
Paciente ──WhatsApp──▶ Meta ──webhook──▶ Supabase Edge Function "whatsapp"
                                            │  ├─ Claude (recepcionista) ──▶ consulta horarios libres en Google Calendar
                                            │  ├─ OpenAI (transcribe notas de voz)
                                            │  ├─ Postgres (memoria, mensajes atendidos, bloqueo de horarios)
                                            │  └─ Reserva: Google Calendar + Google Sheets + confirmación + ubicación
pg_cron 8:00 a. m. ──▶ Edge Function "resumen-diario" ──▶ resumen a la doctora + recordatorios de mañana
```

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `supabase/functions/_shared/config.ts` | **Datos de la clínica**: nombre, doctora, dirección, horario, festivos y precios. Es lo único que editas. |
| `supabase/functions/whatsapp/` | El webhook que recibe los mensajes de WhatsApp. |
| `supabase/functions/resumen-diario/` | La tarea de las 8:00 a. m. |
| `supabase/functions/_shared/` | Claude, WhatsApp, Google, base de datos y fechas. |
| `supabase/migrations/` | Tablas de la base de datos. |
| `supabase/sql/programar_tareas.sql` | Programa el cron de las 8:00 y una limpieza semanal. |
| `plantillas-meta.md` | Textos de las 3 plantillas que debes aprobar en Meta. |
| `pruebas/` | Pruebas automáticas, sin internet ni costo. |

## Lo que necesitas antes de empezar

- Cuenta de **Supabase**. Para producción conviene el plan Pro (25 USD/mes), porque el gratuito pausa el proyecto tras una semana sin uso.
- **Supabase CLI** en tu computador ([instalación](https://supabase.com/docs/guides/local-development/cli/getting-started)).
- Cuenta de **Meta Business** y una app de **WhatsApp Cloud API**, con un número que no esté usando la app normal de WhatsApp.
- Proyecto de **Google Cloud** (gratis) y la cuenta de Google donde está el calendario de la doctora.
- **API key de Anthropic**: [console.anthropic.com](https://console.anthropic.com).
- **API key de OpenAI**, opcional, solo para las notas de voz. Sin ella, la recepcionista le pide a la persona que escriba.

## Paso a paso

### 1. Datos de la clínica

Edita `supabase/functions/_shared/config.ts`: nombre, doctora, dirección y coordenadas (en Google Maps, clic derecho
sobre la clínica → copiar las coordenadas), teléfono que recibe los avisos, horario por día, festivos y precios.

### 2. Supabase

1. Crea el proyecto en [supabase.com](https://supabase.com) y elige la región **East US** o **São Paulo**, que son las más cercanas.
2. En la terminal, dentro de la carpeta `recepcionista-clinica/`:
   ```bash
   supabase login
   supabase link --project-ref TU_PROJECT_REF    # el código que aparece en la URL del proyecto
   supabase db push                              # crea las tablas
   ```

### 3. Google Calendar y Google Sheets

1. En [console.cloud.google.com](https://console.cloud.google.com) crea un proyecto y activa **Google Calendar API** y **Google Sheets API**.
2. Ve a **IAM → Cuentas de servicio → Crear**. Luego entra a **Claves → Agregar clave → JSON** y se descargará un archivo, por ejemplo `cuenta.json`. Guárdalo en un lugar seguro.
3. **Calendario.** En Google Calendar, abre la configuración del calendario de la doctora, ve a *Compartir con personas específicas*, agrega el correo de la cuenta de servicio (`...@...iam.gserviceaccount.com`) con el permiso **Hacer cambios en los eventos**. En *Integrar el calendario* copia el **ID del calendario**.
4. **Hoja.** Crea un Google Sheet con una pestaña llamada **`Pacientes`** y estos encabezados en la fila 1:
   `Registrado | Nombre | WhatsApp | Motivo | Urgente | Cita | Evento`.
   Compártela con el correo de la cuenta de servicio como **Editor**. El **ID de la hoja** es la parte de la URL que va entre `/d/` y `/edit`.

### 4. WhatsApp (Meta)

1. En [developers.facebook.com](https://developers.facebook.com) crea una app de tipo **Empresa** y agrégale el producto **WhatsApp**.
2. Agrega y verifica el número de la clínica. Copia el **Phone number ID**, que no es el número de teléfono.
3. Crea un **token permanente**: en Meta Business Suite ve a *Configuración del negocio → Usuarios del sistema*, crea un usuario administrador, asígnale la app y genera un token con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
4. Copia el **Secreto de la app** desde *Configuración de la app → Básica*.
5. Inventa un **token de verificación**, cualquier texto largo, por ejemplo `clinica-ruiz-2026-xyz`.

### 5. Secrets en Supabase

Las claves nunca van en el código. Desde `recepcionista-clinica/`:

```bash
supabase secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  WHATSAPP_TOKEN=EAAG... \
  WHATSAPP_PHONE_NUMBER_ID=123456789012345 \
  WHATSAPP_APP_SECRET=abc123... \
  WHATSAPP_VERIFY_TOKEN=clinica-ruiz-2026-xyz \
  GOOGLE_CALENDAR_ID=xxxx@group.calendar.google.com \
  GOOGLE_SHEET_ID=1AbC... \
  CRON_SECRET=$(openssl rand -hex 24) \
  OPENAI_API_KEY=sk-...                    # opcional (notas de voz)

supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat ruta/a/cuenta.json)"
supabase secrets list                      # para ver el CRON_SECRET que se generó (lo usas en el paso 7)
```

### 6. Desplegar

```bash
supabase functions deploy whatsapp
supabase functions deploy resumen-diario
```

La URL del webhook queda así: `https://TU_PROJECT_REF.supabase.co/functions/v1/whatsapp`.

En Meta ve a **WhatsApp → Configuración → Webhook → Editar**, pega esa URL y el token de verificación, y suscríbete
al campo **`messages`**.

### 7. Tarea de las 8:00 a. m.

Abre `supabase/sql/programar_tareas.sql`, reemplaza los dos valores marcados con `<<< >>>` (la URL de tu proyecto y
el `CRON_SECRET`) y pégalo en **Supabase → SQL Editor → Run**.

### 8. Plantillas

Crea y envía a aprobación las 3 plantillas de [`plantillas-meta.md`](plantillas-meta.md).

### 9. Probar

Escríbele al número de la clínica desde tu celular, por ejemplo: *"Hola, me duele una muela, ¿tienen cita mañana?"*.
Los registros se ven en **Supabase → Edge Functions → whatsapp → Logs**.

Para probar el resumen sin esperar a las 8:00:

```bash
curl -X POST https://TU_PROJECT_REF.supabase.co/functions/v1/resumen-diario -H "x-cron-secret: TU_CRON_SECRET"
```

> Mientras la app de Meta esté en modo desarrollo, solo puede escribirles a los números que agregues como prueba.
> Para atender a cualquier paciente, publica la app y verifica el negocio en Meta.

## Diferencias con el flujo original de n8n

- **Medellín**: hora de Bogotá, precios en COP, español de Colombia y festivos configurables.
- **Horarios calculados en el código.** La IA recibe solo horarios libres que ya cumplen el horario de atención, los festivos y el margen de una hora; no tiene que deducirlos ella misma.
- **Memoria permanente** en Postgres, que no se borra al reiniciar. Además, la IA sabe cuándo ya se agendó una cita y qué horarios ofreció.
- **Sin dobles reservas**: un bloqueo corto evita que dos personas tomen el mismo horario.
- **Sin respuestas duplicadas** cuando Meta reenvía un mensaje.
- **Seguridad**: solo se aceptan mensajes firmados por Meta, y las tablas tienen RLS sin acceso público.
- **Recordatorios** con los datos guardados de forma oculta en el evento del calendario, en vez de leerlos del texto de la descripción.
- Si Claude, Google o Meta fallan, el paciente recibe un mensaje amable en lugar de silencio.

## Costos aproximados

| Servicio | Costo |
|---|---|
| Supabase | 0 USD en pruebas · 25 USD/mes en el plan Pro |
| Claude (Opus 5.5) | Unos centavos de dólar por conversación |
| WhatsApp | Responder dentro de las 24 h del último mensaje del paciente no se cobra. Las plantillas (recordatorios, avisos) cuestan centavos cada una ([tarifas de Meta](https://developers.facebook.com/docs/whatsapp/pricing)). |
| OpenAI (notas de voz) | Aproximadamente 0,006 USD por minuto de audio |

## Datos personales

Los datos de salud son **datos sensibles** según la Ley 1581 de 2012 (habeas data). Te recomiendo:

- Publicar un aviso de privacidad y que la recepcionista lo enlace en el primer mensaje.
- Mantener privada la hoja de Google y el proyecto de Supabase.
- Dejar activa la limpieza automática de conversaciones antiguas que trae `programar_tareas.sql`.

## Para desarrolladores

```bash
cd recepcionista-clinica
deno test --allow-env pruebas/      # 17 pruebas: lectura de mensajes, horarios, firma de Meta y flujo completo con APIs simuladas
deno check supabase/functions/whatsapp/index.ts supabase/functions/resumen-diario/index.ts
```

El modelo y el tamaño de la memoria están en `config.ts` (`MODELO_CLAUDE`, `MENSAJES_DE_MEMORIA`). Si el modelo
rechaza una solicitud, la API la reintenta automáticamente en otro modelo (`fallbacks: "default"` en `agente.ts`).
