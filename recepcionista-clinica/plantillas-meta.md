# Plantillas de WhatsApp para aprobar en Meta

WhatsApp solo deja escribirle primero a alguien (o 24 horas después de su último mensaje) con plantillas aprobadas.
Créalas en **Meta Business Suite → WhatsApp Manager → Plantillas de mensajes**, idioma **Spanish (es)**,
con estos nombres exactos. La aprobación suele tardar desde minutos hasta un día.

## 1. `aviso_clinica` — categoría *Utilidad*

Lo recibe el teléfono de la clínica cuando hay una urgencia o un caso que la IA no puede resolver.

```
🔔 {{1}} desde la recepcionista virtual
Paciente: {{2}}
Mensaje: {{3}}
Escríbele cuando puedas.
```

Ejemplos para Meta: `{{1}}` URGENCIA · `{{2}}` Ana Pérez (+573001112233) · `{{3}}` Me duele mucho una muela desde anoche

## 2. `resumen_diario` — categoría *Utilidad*

Lo recibe la doctora cada mañana a las 8:00 si hubo pacientes nuevos.

```
Buenos días, {{1}} ☀️
La recepcionista virtual agendó {{2}} citas nuevas en las últimas 24 horas:
{{3}}
```

Ejemplos: `{{1}}` Dra. Ruiz · `{{2}}` 2 · `{{3}}` mar 17 8:00 a. m. Ana Pérez (dolor de muela, urgencia) · mié 18 10:30 a. m. Luis Gómez (limpieza)

## 3. `recordatorio_cita` — categoría *Utilidad*

Lo recibe cada paciente el día antes de su cita. Agrégale dos botones de **respuesta rápida**:
`Confirmo mi cita` y `Necesito cambiarla` (cuando la persona toca uno, le llega a la recepcionista como un mensaje).

```
Hola, {{1}} 👋 Te recordamos tu cita de mañana a las {{2}} con la {{3}}.
¿Nos confirmas tu asistencia?
```

Ejemplos: `{{1}}` Ana · `{{2}}` 8:00 a. m. · `{{3}}` Dra. Ruiz
