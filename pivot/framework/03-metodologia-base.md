# Metodología base

Para qué sirve: son las 7 etapas que sigue cualquier servicio de Pivot. Cada archivo de servicios las aterriza a su caso; aquí está la regla general.

```
Brief → Estrategia → Producción → Aprobación → Lanzamiento → Informe → Optimización
                                                                  └──── vuelve a Estrategia o Producción
```

## Las 7 etapas

### 1. Brief
- **Objetivo:** entender al cliente antes de hacer nada. El brief es el documento con la información clave del negocio y del proyecto.
- **Entradas:** diagnóstico, cotización aprobada.
- **Salida:** [plantillas/brief-cliente.md](plantillas/brief-cliente.md) completo, guardado en `01-Brief`.
- **Checklist:**
  - [ ] Objetivo del cliente escrito en una frase.
  - [ ] Público, oferta y presupuesto claros.
  - [ ] El cliente confirmó que el brief está bien.

### 2. Estrategia
- **Objetivo:** decidir qué vamos a hacer, para quién y con qué mensaje.
- **Entradas:** brief.
- **Salida:** plan corto (objetivo, público, mensaje principal, canales, fechas y cómo mediremos).
- **Checklist:**
  - [ ] El mensaje principal cabe en una frase y se entiende sin contexto.
  - [ ] Hay una sola acción principal que queremos que haga la persona (escribir, comprar, agendar).
  - [ ] Está definido qué número mostraremos en el informe.

### 3. Producción
- **Objetivo:** crear las piezas: textos, diseños, anuncios o la web.
- **Entradas:** plan aprobado, material del cliente.
- **Salida:** piezas listas para revisar, en `04-Produccion`.
- **Checklist:**
  - [ ] Revisado contra la marca del cliente y contra [05-marca-pivot.md](05-marca-pivot.md) en el tono.
  - [ ] Sin errores de ortografía, precios ni datos inventados.
  - [ ] Cada pieza tiene una sola acción principal.

### 4. Aprobación
- **Objetivo:** que el cliente diga "sí" por escrito antes de publicar.
- **Entradas:** piezas producidas.
- **Salida:** aprobación escrita guardada en `05-Aprobaciones`.
- **Checklist:**
  - [ ] Se envió todo junto, ordenado y con fecha límite para responder.
  - [ ] Cambios aplicados dentro de las rondas incluidas.
  - [ ] Aprobación guardada (ver abajo cómo).

### 5. Lanzamiento
- **Objetivo:** publicar, activar la campaña o subir la web sin errores.
- **Entradas:** piezas aprobadas.
- **Salida:** publicación, anuncio o web en vivo; aviso al cliente.
- **Checklist:**
  - [ ] Revisado en celular y computadora.
  - [ ] Enlaces y botones de WhatsApp funcionan.
  - [ ] Fecha de lanzamiento anotada en Asana.

### 6. Informe
- **Objetivo:** contar qué pasó, en palabras simples.
- **Entradas:** datos de Metricool, Meta Ads o la web.
- **Salida:** [plantillas/informe-mensual.md](plantillas/informe-mensual.md) en PDF, en `07-Informes`.
- **Checklist:**
  - [ ] Cada número tiene una frase que explica qué significa.
  - [ ] Se compara con el periodo anterior o con la meta.
  - [ ] Hay 2 o 3 próximos pasos concretos (sugerencia, editable).

### 7. Optimización
- **Objetivo:** mejorar con lo aprendido: dejar lo que funciona y cambiar lo que no.
- **Entradas:** informe.
- **Salida:** lista de ajustes en Asana para el siguiente ciclo.
- **Checklist:**
  - [ ] Cada ajuste tiene una razón basada en datos.
  - [ ] Se cambia una cosa a la vez para saber qué funcionó.
  - [ ] El cliente sabe qué vamos a cambiar.

## Rondas de cambios

- Cada entrega incluye 2 rondas de cambios (sugerencia, editable). Una ronda es una lista de ajustes enviada de una sola vez.
- Pedir al cliente que junte sus comentarios en un solo mensaje.
- Cambios fuera de las rondas, o que cambien el alcance, se cotizan aparte con la skill `pivot-cotizacion`. Avisarlo con amabilidad antes de hacerlos.

## Cómo queda registrada una aprobación

1. El cliente aprueba por WhatsApp (o correo, cuando Pivot tenga correo propio) con un mensaje claro ("Aprobado", "Sí, publiquen").
2. Se toma captura de pantalla o se exporta el mensaje.
3. Se guarda en Drive en `05-Aprobaciones` con el nombre `AAAA-MM-DD_<cliente>_aprobacion-<que-se-aprobo>`.
4. Se anota en la tarea de Asana y se marca como aprobada.

Un "me gusta" o un emoji no es aprobación: pedir confirmación en palabras.

## Ciclos según el tipo de servicio

**Recurrentes (pauta y contenido):** se repiten cada mes.
- Contenido: el mes completo se envía para aprobar por adelantado, al menos 5 días hábiles antes de que empiece el mes (sugerencia, editable). Ver [creación de contenido](servicios/creacion-contenido.md).
- Pauta: revisar las campañas 2 veces por semana (sugerencia, editable).
- Cada mes (sugerencia, editable): informe, optimización y nueva estrategia corta para el mes siguiente.

**De una sola vez (web):** se recorren las 7 etapas una vez y termina con el acta de entrega ([plantillas/acta-entrega.md](plantillas/acta-entrega.md)). Una web solo tiene informes mensuales si el cliente contrata mantenimiento (ver [diseño web](servicios/diseno-web.md)); la optimización se ofrece como servicio nuevo.
