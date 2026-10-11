# Estructura de proyectos en Asana

Para qué sirve: cómo organizar el proyecto de cada cliente en Asana (la herramienta donde viven las tareas y fechas), para que todos encuentren todo en el mismo lugar. Ver también [../01-forma-de-trabajo.md](../01-forma-de-trabajo.md).

## Reglas generales
- Un proyecto por cliente, con el mismo nombre que su carpeta en Drive: `<Cliente>`. Si tiene dos servicios de una sola vez distintos, un proyecto por servicio: `<Cliente> - <Servicio>`.
- Toda tarea tiene responsable, fecha y el sombrero en el nombre o en una etiqueta.
- Las aprobaciones del cliente se anotan como comentario en la tarea, con enlace al archivo de `05-Aprobaciones`.
- Nada de contraseñas en tareas ni comentarios.

## Secciones (columnas del proyecto)

| Sección | Qué va aquí |
|---|---|
| 0. Onboarding | Tareas de [checklist-onboarding.md](checklist-onboarding.md). |
| 1. Brief y estrategia | Brief, plan, ajustes de estrategia. |
| 2. Producción | Piezas, textos, anuncios o la web en construcción. |
| 3. Para aprobar | Lo que está esperando respuesta del cliente. |
| 4. Lanzamiento | Listo para publicar o activar. |
| 5. Informe y optimización | Informe del mes y ajustes que salen de él. |
| 6. Hecho | Tareas terminadas. |

## Tipos de tarea

Usar una etiqueta para cada tipo: `Estrategia`, `Pauta`, `Contenido`, `Web`, `Comercial`, `Aprobación`, `Informe`.

## Servicios recurrentes (pauta y contenido)

Tareas que se repiten (en Asana se marcan como "repetir"):

| Tarea | Frecuencia | Sombrero |
|---|---|---|
| Planear contenido del mes en [calendario-contenido.md](calendario-contenido.md) | Mensual (sugerencia, editable) | Contenido |
| Producir y enviar piezas de la semana para aprobar | Semanal (sugerencia, editable) | Contenido |
| Programar publicaciones aprobadas en Metricool | Semanal (sugerencia, editable) | Contenido |
| Revisar campañas en Meta Ads (gasto y resultados) | 2 veces por semana (sugerencia, editable) | Pauta |
| Armar y enviar [informe-mensual.md](informe-mensual.md) | Mensual (sugerencia, editable) | Estrategia |
| Reunión o mensaje de próximos pasos | Mensual (sugerencia, editable) | Dirección y comercial |
| Recordar cobro del mes | Mensual (sugerencia, editable) | Dirección y comercial |

## Servicios de una sola vez (web)

Tareas en secuencia, cada una depende de la anterior:

1. Onboarding y brief → 2. Propuesta de estilo con `/neweb` → 3. Aprobación del estilo → 4. Construcción → 5. Revisión en celular y computadora (skill `web-design-guidelines`) → 6. Ronda de cambios → 7. Aprobación final → 8. Publicación en Hostinger o Netlify → 9. [acta-entrega.md](acta-entrega.md) y cobro del 50% final → 10. Cierre.

Ver [../servicios/diseno-web.md](../servicios/diseno-web.md).

## Al cerrar
- [ ] Todas las tareas en "Hecho" o canceladas con motivo.
- [ ] Proyecto archivado en Asana.
- [ ] Accesos retirados según [../04-seguridad-y-datos.md](../04-seguridad-y-datos.md).
