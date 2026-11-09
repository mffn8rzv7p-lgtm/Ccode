# Bong v2

Plataforma de herramientas internas de Pivot Agencia. **Bong v2** es un inicio estilo iPad con todas las apps del equipo; el gestor de tareas que hasta ahora se llamaba Bong pasa a ser la app **Gestor**. Se instala en el mismo proyecto de Supabase y en el mismo hosting de Bong, así que comparte cuentas, inicio de sesión, datos y notificaciones.

Solo entran correos **@pivotagencia.com** (también se verifica en la base de datos).

| App | Qué hace |
|---|---|
| **Gestor** | El Bong de siempre: tareas, tableros, clientes, calendario, notificaciones. Vive en `/gestor/`. |
| **Auditoría** | Escribes una cuenta de Instagram y genera una auditoría con datos públicos y una propuesta estratégica de 90 días, en PDF. |
| **Cotizador** | Del brief al precio ideal (piso, mercado y valor, 3 paquetes) que el equipo aprueba, y a la carta PIV-AAAA-NNN en PDF con su mensaje de WhatsApp. |
| **Briefs** | El Brief de marca de Pivot (versión mejorada: 6 bloques, 26 preguntas) se envía al cliente con un enlace (`/brief/?t=…`) que llena desde el celular, sin cuenta y con guardado automático; o lo llena el equipo. La IA lo pule en un brief interno con preguntas pendientes y riesgos. Desde ahí se cotiza, se crea el moodboard o la parrilla. |
| **Parrillas** | La parrilla del mes en un calendario: una card por publicación, se arrastra entre días, se edita en un panel, avanza de idea a publicada y se puede llenar con IA. Reemplaza el Excel. |
| **Moodboards** | Tablero con módulos fijos (concepto, palabras clave, colores, tipografías, estilos gráficos, imágenes). Imágenes por arrastre, desde el computador o buscando fotos gratis en Pixabay o Pexels, y un botón mágico que lo llena con IA (incluidas imágenes generadas con Cloudflare). |

El registro de apps está en `web/assets/hub.js` y sus íconos en `web/assets/iconos.js`.

## Ver la demostración

Mientras `web/config.js` tenga los valores de ejemplo, todo abre en **modo demostración** con datos ficticios (Café Ejemplo):

```bash
cd pivot-hub/web
python3 -m http.server 8000
# abre http://localhost:8000
```

## Instalación (una sola vez)

Se usa **el proyecto de Supabase que ya tiene Bong**. Todo lo nuevo lleva el prefijo `hub_` (tablas, funciones, almacenamientos `hub-capturas` y `hub-moodboards`, funciones del servidor `hub-*`), así que no toca nada del Gestor.

### 1. Base de datos

En Supabase → **SQL Editor**, pega todo `supabase/instalar.sql` y presiona **Run** una vez.
Si ya llevan cotizaciones este año, al final del bloque del cotizador está cómo fijar el último número usado.

### 2. Claves y funciones del servidor

Con la [CLI de Supabase](https://supabase.com/docs/guides/cli), desde la carpeta `pivot-hub/`:

```bash
supabase login
supabase link --project-ref mwqjwktuoytvqprhvpvp
supabase secrets set ANTHROPIC_API_KEY=... ORIGENES_PERMITIDOS=https://bong.pivotagencia.com
# Opcionales:
supabase secrets set META_ACCESS_TOKEN=... META_IG_USER_ID=...   # auditoría automática (si no, con capturas)
supabase secrets set CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=...   # imágenes con IA (cupo diario gratis)
supabase secrets set PIXABAY_API_KEY=...                        # buscar fotos gratis (o PEXELS_API_KEY)
supabase functions deploy hub-informe
supabase functions deploy hub-cotizacion
supabase functions deploy hub-ia
```

- **Claude** (textos de todas las apps): clave en platform.claude.com → API Keys. Modelo: Claude Opus 5.5.
- **Imágenes con IA (Cloudflare Workers AI, gratis):** crea una cuenta en cloudflare.com, copia el **Account ID** (aparece en el panel) y crea un **API Token** con el permiso "Workers AI" (My Profile → API Tokens → Create Token → plantilla *Workers AI*). Modelo: FLUX.1 schnell. El plan gratuito da 10.000 "neuronas" al día; cuando se acaban, la generación falla ese día sin cobrar nada y se renueva a las 7 p. m. hora Colombia (medianoche UTC). Alternativa de pago: `IMAGENES_PROVEEDOR=openai` + `OPENAI_API_KEY`.
- **Fotos gratis (Pixabay o Pexels):** con una cuenta gratis en pixabay.com, la clave aparece en pixabay.com/api/docs (sección *Parameters → key*). Pexels (pexels.com/api) sirve igual si tienes clave; si están las dos, usa Pexels. Las fotos se copian al almacenamiento de Bong (Pixabay no permite enlazarlas directo) y cada una muestra el crédito del fotógrafo.
- Sin estas claves, el botón mágico igual llena concepto, colores, tipografías y estilos, y deja las ideas de imágenes listas para generar.
- **Instagram (Business Discovery):** cuenta de Instagram de Pivot profesional y conectada a su página de Facebook, una app en developers.facebook.com y una clave de larga duración (permisos según la documentación vigente: normalmente `instagram_basic`, `pages_show_list`, `pages_read_engagement`). Opcional: `META_GRAPH_VERSION` (por defecto `v23.0`).

### 3. Inicio de sesión

Google ya está configurado para Bong. En **Authentication → URL Configuration → Redirect URLs** confirma que esté `https://bong.pivotagencia.com/**` (con `/**` cubre el inicio y `/gestor/`).

### 4. Publicar en bong.pivotagencia.com (Hostinger)

1. Arma el paquete con la configuración de producción (`despliegue/`):
   ```bash
   bash scripts/empaquetar-hostinger.sh   # → entregas/bong-v2-hostinger.zip
   ```
2. En Hostinger → Administrador de archivos → carpeta de `bong.pivotagencia.com`: **descarga primero una copia de seguridad** de todo.
3. Sube y descomprime `bong-v2-hostinger.zip` en esa carpeta (reemplaza `index.html`, `sw.js` y `config.js`).
4. Conserva `manifest.webmanifest`, la carpeta `icons/` y cualquier `.htaccess`. Puedes borrar `app-202610150016.*` y `version.json` de la raíz (ahora están en `/gestor/`).

### Cómo se mueve Bong al Gestor sin perder nada

- **Datos:** el Gestor usa las mismas tablas y el mismo proyecto; nada se migra.
- **Notificaciones push:** el nuevo `sw.js` de la raíz reemplaza al de Bong en la misma ruta, así los celulares conservan su suscripción. Las notificaciones (`#/tarea/…`) se abren dentro de `/gestor/`.
- **Enlaces viejos:** cualquier enlace o acceso directo a `…/#/algo` se redirige solo al Gestor.
- **App instalada en el celular:** abre el inicio de Bong v2; el Gestor está en el dock.

El código del Gestor es la versión compilada 1.4.1 de Bong (`web/gestor/`), con un solo cambio: el registro del service worker apunta a la raíz. El código fuente original de Bong no está en este repositorio.

## Costos aproximados

- **Supabase:** el plan actual de Bong. Si alguna generación con IA se corta por tiempo (1 a 3 minutos por etapa), el plan Pro amplía el tiempo de las funciones.
- **Claude:** unos centavos de dólar por brief, parrilla o moodboard, y menos de un dólar por auditoría o cotización. Revisa el consumo real en la consola después de los primeros usos.
- **Imágenes con IA y fotos:** gratis con Cloudflare (cupo diario) y Pixabay o Pexels. Solo si cambian a OpenAI se cobra por imagen.
- **Meta:** gratis, con límites de consultas por hora.

## Archivos

| Ruta | Qué es |
|---|---|
| `web/index.html`, `web/sw.js` | Inicio estilo iPad, pantalla de entrada y service worker compartido |
| `web/assets/` | Estilos, íconos, logo y utilidades compartidas |
| `web/gestor/` | El Bong de siempre (compilado) |
| `web/auditoria/`, `web/cotizador/`, `web/briefs/`, `web/parrillas/`, `web/moodboards/` | Cada app, con su `demo.json` ficticio |
| `supabase/instalar.sql` | Todas las migraciones en un solo archivo |
| `web/brief/` | Página pública donde el cliente llena el brief (marca Pivot, sin cuenta) |
| `despliegue/`, `scripts/empaquetar-hostinger.sh`, `entregas/` | Configuración de producción y el .zip para Hostinger |
| `supabase/migrations/` | Tablas, reglas de acceso y almacenamiento, por app |
| `supabase/functions/hub-informe/` | Auditoría: Meta, métricas en código y Claude |
| `supabase/functions/hub-cotizacion/` | Cotizador: piso y redondeo en código, precio y carta con Claude |
| `supabase/functions/hub-ia/` | Briefs, parrillas y moodboards (incluye imágenes) |
| `supabase/functions/_shared/` | Llamada a Claude y verificación de acceso |
