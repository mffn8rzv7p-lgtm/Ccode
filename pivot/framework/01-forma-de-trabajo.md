# Forma de trabajo

Para qué sirve: deja claro quién hace qué, cuándo y por dónde nos comunicamos, para que nada dependa de la memoria de una persona.

## Roles como "sombreros"

En Pivot una misma persona puede llevar varios sombreros. Lo importante no es cuántas personas hay, sino que cada tarea tenga un sombrero dueño.

| Sombrero | Qué hace |
|---|---|
| Dirección y comercial | Habla con clientes nuevos, cotiza, cobra, aprueba entregas finales y prioriza. |
| Estrategia | Lee el brief, define objetivos, público y mensajes; arma el plan. |
| Pauta | Crea, vigila y ajusta los anuncios en Meta Ads (Facebook e Instagram). |
| Contenido | Escribe textos, diseña piezas en Canva y programa publicaciones en Metricool. |
| Web | Construye y publica páginas con la skill `/neweb`. |

## Quién hace, quién aprueba, quién se entera

Esta tabla es una versión simple de una matriz RACI (forma de repartir responsabilidades: quién hace, quién aprueba y a quién se le avisa).

| Actividad | Responsable (hace) | Aprueba | Se informa |
|---|---|---|---|
| Cotización | Dirección y comercial | Dirección y comercial | Estrategia |
| Brief del cliente | Estrategia | Dirección y comercial | Todos los sombreros del proyecto |
| Plan o estrategia | Estrategia | Cliente | Pauta, Contenido |
| Piezas y textos | Contenido | Estrategia y luego cliente | Pauta |
| Campañas de pauta | Pauta | Estrategia y luego cliente | Dirección y comercial |
| Página web | Web | Cliente | Dirección y comercial |
| Informe mensual | Estrategia | Dirección y comercial | Cliente |
| Cobro y facturación | Dirección y comercial | Dirección y comercial | — |

## Rutina semanal (sugerencia, editable)

- **Lunes:** planeación. Revisar Asana, ordenar prioridades de la semana y confirmar entregas con clientes.
- **Martes a jueves:** producción, aprobaciones y lanzamientos.
- **Martes y viernes:** revisión rápida de pauta, 2 veces por semana (sugerencia, editable): presupuesto gastado y resultados.
- **Viernes:** revisión. Qué se entregó, qué quedó pendiente, qué aprendimos. Dejar Asana al día.

## Canales

| Para qué | Canal |
|---|---|
| Hablar con clientes | WhatsApp (o correo, cuando Pivot tenga correo propio) |
| Reuniones con clientes | Teams o videollamada/llamada |
| Hablar entre el equipo | Microsoft Teams |
| Tareas y fechas | Asana |
| Archivos de clientes | Google Drive (por defecto). SharePoint es la alternativa si un cliente trabaja con Microsoft. |
| Documentos formales (actas, informes) | PDF enviado por WhatsApp y guardado en Drive |

Regla: lo que se decide por WhatsApp o en una llamada se anota en la tarea de Asana el mismo día.

## Tiempos de respuesta

- Mensaje de un cliente: responder en máximo 4 horas hábiles (sugerencia, editable), aunque sea para decir "lo reviso y te confirmo".
- Cambio pequeño pedido por el cliente: 1 día hábil (sugerencia, editable).
- Mensaje interno en Teams: el mismo día hábil (sugerencia, editable).
- Problema urgente (anuncio rechazado, web caída): atenderlo en cuanto se vea y avisar al cliente.

## Cómo viven las tareas en Asana

Cada cliente tiene un proyecto en Asana con sus secciones y tipos de tarea. La estructura está en [plantillas/estructura-asana.md](plantillas/estructura-asana.md). Toda tarea tiene un responsable y una fecha; sin eso, no está asignada.

## Carpetas y nombres en Drive

```
Clientes/
  <Cliente>/
    01-Brief/
    02-Cotizacion-y-pagos/
    03-Estrategia/
    04-Produccion/
    05-Aprobaciones/
    06-Entregas/
    07-Informes/
```

- Nombre del cliente sin tildes ni espacios raros, igual en Drive y en Asana.
- Archivos con fecha al inicio: `AAAA-MM-DD_<cliente>_<que-es>` (por ejemplo `AAAA-MM-DD_<cliente>_informe-mensual`).
- Versiones con `v1`, `v2`; la final termina en `final`.
- Las webs viven en el repositorio (GitHub, el lugar donde se guardan las versiones de las webs), en `<cliente>/web/` y `<cliente>/entregas/`; una copia del .zip final (un solo archivo comprimido con toda la web) va en Drive `06-Entregas`.
- Nunca guardar contraseñas en Drive. Ver [04-seguridad-y-datos.md](04-seguridad-y-datos.md).
