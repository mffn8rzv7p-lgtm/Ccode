# Framework de trabajo de Pivot Agencia

Para qué sirve: es el manual de cómo trabaja Pivot, desde que llega un cliente hasta que se cierra su proyecto. Aquí está todo en un solo lugar para no improvisar y para que cualquier persona del equipo haga las cosas igual.

## Índice de archivos

**Base**
- [01-forma-de-trabajo.md](01-forma-de-trabajo.md) — roles ("sombreros"), quién hace y quién aprueba, rutina semanal, canales, tiempos de respuesta y orden de carpetas.
- [02-ciclo-del-cliente.md](02-ciclo-del-cliente.md) — el recorrido completo de un cliente: del primer contacto al cierre, etapa por etapa.
- [03-metodologia-base.md](03-metodologia-base.md) — las 7 etapas que sigue todo servicio: Brief → Estrategia → Producción → Aprobación → Lanzamiento → Informe → Optimización.
- [04-seguridad-y-datos.md](04-seguridad-y-datos.md) — cómo pedir, guardar y quitar accesos, y cómo cuidar los datos de los clientes.
- [05-marca-pivot.md](05-marca-pivot.md) — colores, uso del logo P!VOT, tono para hablar con clientes y firma de mensajes.

**Servicios** (cada uno aterriza la metodología base a su caso)
- [servicios/marketing-digital.md](servicios/marketing-digital.md) — estrategia de marketing digital.
- [servicios/pauta-digital.md](servicios/pauta-digital.md) — anuncios pagados en Facebook e Instagram (Meta Ads).
- [servicios/creacion-contenido.md](servicios/creacion-contenido.md) — piezas y publicaciones para redes sociales.
- [servicios/diseno-web.md](servicios/diseno-web.md) — páginas web hechas con la skill `/neweb`.

**Plantillas** (para copiar y llenar con cada cliente)
- [plantillas/brief-cliente.md](plantillas/brief-cliente.md) — preguntas para entender al cliente antes de empezar.
- [plantillas/checklist-onboarding.md](plantillas/checklist-onboarding.md) — lista de bienvenida: accesos, carpetas y primera reunión.
- [plantillas/informe-mensual.md](plantillas/informe-mensual.md) — estructura del informe de resultados que se envía al cliente.
- [plantillas/calendario-contenido.md](plantillas/calendario-contenido.md) — columnas para armar el calendario de publicaciones en Google Sheets.
- [plantillas/acta-entrega.md](plantillas/acta-entrega.md) — documento que deja por escrito qué se entregó y que el cliente lo recibió.
- [plantillas/estructura-asana.md](plantillas/estructura-asana.md) — cómo organizar el proyecto de cada cliente en Asana (la herramienta de tareas).

## Cómo usar este framework

Con un cliente nuevo, empieza en este orden:

1. Lee [02-ciclo-del-cliente.md](02-ciclo-del-cliente.md) para saber en qué etapa estás y qué sigue.
2. Llena con el cliente [plantillas/brief-cliente.md](plantillas/brief-cliente.md).
3. Abre el archivo del servicio que contrató, en [servicios/](servicios/marketing-digital.md), y sigue su metodología paso a paso.

Si tienes dudas de quién hace qué, mira [01-forma-de-trabajo.md](01-forma-de-trabajo.md). Si vas a pedir o quitar accesos, mira [04-seguridad-y-datos.md](04-seguridad-y-datos.md) antes.

## Cómo mantenerlo

- Revísalo completo una vez por trimestre (sugerencia, editable).
- Si algo no funciona en la práctica, cámbialo: este manual se adapta al trabajo real, no al revés.
- Anota en el mismo archivo qué cambiaste y por qué, en una línea al final.
- Después de editar cualquier archivo, corre esta revisión para confirmar que los enlaces y el formato siguen bien:

```
python3 -I pivot/framework/validar.py
```
