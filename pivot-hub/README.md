# Pivot Hub

Hub de herramientas internas de Pivot Agencia, pensado para vivir en **apps.pivotagencia.com**.
La primera app es la **Auditoría de Instagram**: escribes una cuenta (y hasta 3 competidores), y la app genera una auditoría con datos públicos y una propuesta estratégica de 90 días, lista para mostrar al cliente o descargar en PDF antes de cotizar.

Solo entran las personas del equipo (por ejemplo, Laura y tú), con un enlace que llega al correo, sin contraseñas.

## Cómo funciona

```
apps.pivotagencia.com  (páginas estáticas: carpeta web/)
        │  inicio de sesión, historial y capturas
        ▼
Supabase  ── base de datos + almacenamiento + función "informe"
        │                         │
        ▼                         ▼
API oficial de Instagram      API de Claude
(datos públicos de cuentas    (escribe la auditoría y la
 de empresa o creador)         propuesta en la voz de Pivot)
```

Cada informe pasa por 3 etapas, que la página ejecuta en orden y muestra en pantalla:

1. **Datos:** lee el perfil y las últimas publicaciones con la API de Meta y calcula las métricas en código (interacción, frecuencia, formatos, días, hashtags). Así los números son exactos y no los inventa la IA.
2. **Auditoría:** Claude analiza esos datos (y las capturas, si las hay) y escribe el diagnóstico.
3. **Propuesta:** Claude arma pilares, 8 ideas con guion y texto, calendario de 2 semanas, servicios de Pivot recomendados (sin precios) e indicadores.

Si una cuenta es personal o privada, Meta no la entrega: en ese caso se suben capturas de pantalla y la auditoría se hace con ellas.

## Ver la demostración

Mientras `web/config.js` tenga los valores de ejemplo, el hub abre en **modo demostración** con un informe ficticio (`@cafe.ejemplo`). Para verlo en tu computador:

```bash
cd pivot-hub/web
python3 -m http.server 8000
# abre http://localhost:8000
```

## Puesta en marcha (una sola vez)

Necesitas: una cuenta de Supabase, una clave de la API de Claude y la cuenta profesional de Instagram de Pivot.

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región: São Paulo es la más cercana).
2. En **SQL Editor**, pega y ejecuta `supabase/migrations/20261109000000_auditoria_instagram.sql`.
3. Agrega los correos del equipo, en el mismo SQL Editor:
   ```sql
   insert into public.miembros (email, nombre) values
     ('tu-correo@pivotagencia.com', 'Tu nombre'),
     ('correo-de-laura@pivotagencia.com', 'Laura');
   ```
4. En **Authentication → Users → Invite user**, invita esos mismos dos correos.
5. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up** (nadie más puede crear cuenta).
6. En **Authentication → URL Configuration**, pon `https://apps.pivotagencia.com` como Site URL y agrega `https://apps.pivotagencia.com/**` en Redirect URLs.

### 2. Clave de Claude

Crea una clave en [platform.claude.com](https://platform.claude.com) → API Keys. La app usa el modelo Claude Opus 5.5.

### 3. Conexión con Instagram (Business Discovery)

Business Discovery es la función oficial de Meta que permite que una cuenta profesional consulte los datos públicos de otras cuentas de empresa o creador.

1. La cuenta de Instagram de Pivot debe ser **profesional** y estar conectada a la página de Facebook de Pivot.
2. En [developers.facebook.com](https://developers.facebook.com), crea una app de tipo empresa y agrega el producto de Instagram con inicio de sesión de Facebook.
3. Genera una clave de acceso de larga duración con los permisos que pide la documentación vigente de Business Discovery (normalmente `instagram_basic`, `pages_show_list` y `pages_read_engagement`).
4. Anota el **ID de la cuenta de Instagram de Pivot** (el `instagram_business_account` de la página).

Si todavía no tienes esto listo, la app funciona igual con capturas de pantalla.

### 4. Subir la función y guardar las claves

Con la [CLI de Supabase](https://supabase.com/docs/guides/cli) instalada, desde la carpeta `pivot-hub/`:

```bash
supabase login
supabase link --project-ref TU-PROJECT-REF
supabase secrets set ANTHROPIC_API_KEY=... \
  META_ACCESS_TOKEN=... \
  META_IG_USER_ID=... \
  ORIGENES_PERMITIDOS=https://apps.pivotagencia.com
supabase functions deploy informe
```

Opcional: `META_GRAPH_VERSION` (por defecto `v23.0`; usa la versión vigente de la Graph API).

Las claves quedan como secretos en Supabase: nunca van en el código ni en las páginas.

### 5. Publicar las páginas en apps.pivotagencia.com

1. En `web/config.js`, pega la **Project URL** y la **anon key** de Supabase (Project Settings → API). La anon key es pública por diseño; la seguridad la ponen las reglas de la base de datos.
2. Sube el **contenido** de la carpeta `web/` a cualquier hosting estático:
   - **Hostinger** (donde está el sitio): crea el subdominio `apps` y sube los archivos a su carpeta con el Administrador de archivos.
   - **Netlify** o **Vercel**: arrastra la carpeta `web/` y conecta el dominio `apps.pivotagencia.com`.

## Agregar una nueva herramienta al hub

1. Crea una carpeta en `web/` (por ejemplo `web/cotizador/`) con su `index.html`, usando `../assets/pivot.css` y `../assets/hub.js`.
2. Súmala a la lista `APPS` en `web/assets/hub.js`.
3. Si necesita base de datos o IA, agrega su tabla con su propia migración y su función en `supabase/functions/`.

## Costos aproximados

- **Supabase:** el plan gratuito alcanza para dos usuarias y decenas de informes al mes. Si la generación se corta por tiempo (cada etapa puede tardar 1 a 3 minutos), el plan Pro amplía el tiempo máximo de las funciones.
- **Claude:** cada informe usa dos generaciones; calcula unos pocos centavos de dólar a menos de un dólar por informe según el tamaño. Revisa el consumo real en la consola de Claude después de los primeros informes.
- **Meta:** la API es gratuita, con límites de consultas por hora.

## Archivos

| Ruta | Qué es |
|---|---|
| `web/index.html` | Inicio del hub e inicio de sesión |
| `web/auditoria/` | App de auditoría: formulario, avance, informe y PDF (`demo.json` es el ejemplo ficticio) |
| `web/assets/` | Estilos, logo y utilidades compartidas |
| `supabase/migrations/` | Tablas, reglas de acceso y almacenamiento de capturas |
| `supabase/functions/informe/` | Lectura de Meta, cálculo de métricas y generación con Claude |
