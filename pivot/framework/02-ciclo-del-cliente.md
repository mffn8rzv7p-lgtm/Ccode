# Ciclo del cliente

Para qué sirve: muestra el recorrido completo de un cliente con Pivot, del primer mensaje al cierre, para saber siempre en qué etapa está y qué hay que hacer para pasar a la siguiente.

## Mapa rápido

```
Primer contacto → Diagnóstico → Cotización → Aprobación y anticipo 50%
      → Bienvenida (onboarding) → Ejecución → Entrega y 50% final
      → Informe → ¿Renovación o nuevo servicio?
                     ├─ sí → vuelve a Cotización o a Ejecución
                     └─ no → Cierre (quitar accesos)
```

Los sombreros (roles) están explicados en [01-forma-de-trabajo.md](01-forma-de-trabajo.md).

## Etapas

### 1. Primer contacto
- **Qué pasa:** el cliente escribe o lo refieren. Se saluda, se pregunta qué necesita y se agenda una conversación corta.
- **Quién:** Dirección y comercial.
- **Herramienta:** WhatsApp.
- **Salida:** cita agendada para el diagnóstico.
- **Pasa a la siguiente cuando:** hay fecha y hora confirmadas.

### 2. Diagnóstico
- **Qué pasa:** se entiende el negocio, el problema y lo que espera lograr. Se revisa lo que ya tiene (redes, anuncios, web).
- **Quién:** Dirección y comercial, con apoyo de Estrategia.
- **Herramienta:** llamada o reunión en Teams; notas en Drive.
- **Salida:** notas del diagnóstico y servicio recomendado.
- **Pasa a la siguiente cuando:** está claro qué servicio y qué alcance cotizar.

### 3. Cotización
- **Qué pasa:** se arma la propuesta con la skill `pivot-cotizacion` (precio y 3 paquetes: Básico, Recomendado y Premium). Se numera PIV-AAAA-NNN, tiene vigencia de 15 días calendario y se envía en PDF por WhatsApp.
- **Quién:** Dirección y comercial.
- **Herramienta:** skill `pivot-cotizacion`, WhatsApp, Drive (`02-Cotizacion-y-pagos`).
- **Salida:** cotización enviada y guardada.
- **Pasa a la siguiente cuando:** el cliente elige un paquete por escrito. Si no responde, hacer seguimiento a los 3 días (sugerencia, editable) y otra vez antes de que venza.

### 4. Aprobación y anticipo 50%
- **Qué pasa:** el cliente confirma por escrito y paga el 50% por transferencia bancaria.
- **Quién:** Dirección y comercial.
- **Herramienta:** WhatsApp; comprobante guardado en Drive.
- **Salida:** aprobación escrita y anticipo recibido.
- **Pasa a la siguiente cuando:** el pago está confirmado en la cuenta. Sin anticipo no se empieza.

### 5. Bienvenida (onboarding)
- **Qué pasa:** onboarding significa "dar la bienvenida y dejar todo listo para trabajar". Se crean carpetas y proyecto, se piden accesos y se llena el brief.
- **Quién:** Dirección y comercial y Estrategia.
- **Herramienta:** [plantillas/checklist-onboarding.md](plantillas/checklist-onboarding.md), [plantillas/brief-cliente.md](plantillas/brief-cliente.md), Asana, Drive.
- **Salida:** brief completo, accesos recibidos y proyecto creado en Asana.
- **Pasa a la siguiente cuando:** toda la lista de onboarding está marcada.

### 6. Ejecución
- **Qué pasa:** se trabaja con las 7 etapas de [03-metodologia-base.md](03-metodologia-base.md), aterrizadas en el servicio: [marketing digital](servicios/marketing-digital.md), [pauta digital](servicios/pauta-digital.md), [creación de contenido](servicios/creacion-contenido.md) o [diseño web](servicios/diseno-web.md).
- **Quién:** Estrategia, Pauta, Contenido o Web, según el servicio.
- **Herramienta:** Asana, Canva, Metricool, Meta Ads, skill `/neweb`.
- **Salida:** trabajo aprobado y lanzado.
- **Pasa a la siguiente cuando:** se cumple la "definición de terminado" del servicio.

### 7. Entrega y 50% final
- **Qué pasa:** se entrega lo acordado, el cliente firma o confirma el acta y paga el 50% restante.
- **Quién:** Dirección y comercial.
- **Herramienta:** [plantillas/acta-entrega.md](plantillas/acta-entrega.md), WhatsApp, Drive (`06-Entregas`).
- **Salida:** acta confirmada y pago final recibido.
- **Pasa a la siguiente cuando:** ambas cosas están guardadas en Drive.

### 8. Informe
- **Qué pasa:** se muestran resultados en palabras simples y se proponen próximos pasos. En servicios recurrentes (que se repiten cada mes) se hace cada mes.
- **Quién:** Estrategia.
- **Herramienta:** [plantillas/informe-mensual.md](plantillas/informe-mensual.md), Metricool, Meta Ads, Google Slides.
- **Salida:** informe enviado en PDF y guardado en `07-Informes`.
- **Pasa a la siguiente cuando:** el cliente lo recibió y se conversó.

### 9. Renovación o nuevo servicio
- **Qué pasa:** con el informe en la mano, se propone seguir, ajustar o sumar otro servicio.
- **Quién:** Dirección y comercial.
- **Herramienta:** WhatsApp; skill `pivot-cotizacion` si hay nueva cotización.
- **Salida:** decisión del cliente por escrito.
- **Pasa a la siguiente cuando:** si renueva, vuelve a Ejecución (o a Cotización si cambia el alcance); si no, pasa a Cierre.

### 10. Cierre
- **Qué pasa:** se agradece, se entregan los archivos finales y se quitan todos los accesos de Pivot a las cuentas del cliente.
- **Quién:** Dirección y comercial.
- **Herramienta:** [04-seguridad-y-datos.md](04-seguridad-y-datos.md), Asana (archivar proyecto), Drive.
- **Salida:** accesos retirados, proyecto archivado y mensaje de cierre enviado.
- **Terminado cuando:** no queda ningún acceso abierto ni pago pendiente.
