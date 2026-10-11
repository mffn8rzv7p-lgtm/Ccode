---
name: pivot-framework
description: Forma de trabajo de Pivot Agencia (marketing digital, pauta, contenido y diseño web). Usar antes de cualquier tarea para un cliente de Pivot (brief, estrategia, campañas, calendario de contenido, informe mensual, onboarding, entrega o cierre) o cuando el usuario pregunte cómo trabaja Pivot.
---

# Pivot: aplicar el framework de trabajo

El framework vive en `pivot/framework/`. Es la fuente de verdad: léelo, no lo repitas de memoria.

## Antes de empezar
1. Lee `pivot/framework/README.md` para ubicarte.
2. Identifica en qué etapa del ciclo está el cliente (`02-ciclo-del-cliente.md`) y qué servicio es (`servicios/`).
3. Lee el archivo del servicio y sigue su metodología, su lista de chequeo y su definición de terminado.

## Qué usar para cada cosa
- Cotizar: skill `pivot-cotizacion`.
- Hacer una página web: skill `/neweb` (y `web-design-guidelines` para revisarla).
- Documentos para el cliente: copia la plantilla de `pivot/framework/plantillas/` y llénala; deja `[completar]` en lo que no sepas.

## Reglas
- Habla en español claro, sin jerga, con el tono de `05-marca-pivot.md`.
- No inventes datos del cliente ni de Pivot (precios, resultados, clientes, años).
- Nunca pidas ni guardes contraseñas: los accesos se dan por invitación o como socio (`04-seguridad-y-datos.md`).
- Si cambias algo del framework, corre `python3 -I pivot/framework/validar.py` y corrige los errores.
