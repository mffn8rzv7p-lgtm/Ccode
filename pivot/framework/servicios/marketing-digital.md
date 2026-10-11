# Marketing digital (estrategia)

Para qué sirve: guía para armar con el cliente un plan de marketing claro: entender su marca, su público y su competencia, decidir qué hacer, en qué canales y con qué presupuesto, y revisar cada mes si está funcionando.

## Qué incluye y qué no

Es una guía del alcance típico. Lo que se entrega en cada caso queda en la cotización (skill personal `pivot-cotizacion`).

**Incluye:**
- Diagnóstico corto: marca, público y competencia.
- Plan de marketing: objetivos, buyer persona (retrato del cliente ideal), mensajes clave, canales, presupuesto y calendario.
- Presentación del plan en Google Slides.
- Seguimiento mensual con informe y ajustes.

**No incluye (salvo que se cotice aparte):**
- Manejo de anuncios pagados → ver [Pauta digital](pauta-digital.md).
- Producción y publicación de contenido → ver [Creación de contenido](creacion-contenido.md).
- Página web → ver [Diseño web](diseno-web.md).
- El dinero de la pauta: lo paga el cliente directamente a cada plataforma.

## Metodología paso a paso

Aterriza las 7 etapas de [la metodología base](../03-metodologia-base.md).

1. **Brief.** Llenar con el cliente la [plantilla de brief](../plantillas/brief-cliente.md): qué vende, a quién, qué quiere lograr, qué ha probado antes y cuánto puede invertir.
2. **Estrategia (diagnóstico + plan).**
   - *Marca* (versión corta de una entrevista de marca): para qué existe el negocio, qué lo hace distinto, cómo quiere sonar. Preguntar una cosa a la vez y pedir ejemplos concretos, no respuestas genéricas.
   - *Público*: quién compra, qué necesita, qué le preocupa y con qué palabras lo dice. Con esto se arma 1 o 2 buyer personas (sugerencia, editable).
   - *Competencia*: revisar 3 competidores (sugerencia, editable): qué prometen, en qué canales están y qué vacío dejan. Separar lo que es un hecho de lo que es una suposición.
   - *Objetivos SMART*: cada objetivo debe ser **E**specífico (qué exactamente), **M**edible (con un número), **A**lcanzable (realista para el presupuesto), **R**elevante (ayuda al negocio) y con **T**iempo (fecha límite). Ejemplo de forma: "Conseguir `[completar]` contactos de clientes interesados al mes antes de `[completar fecha]`".
   - *Mensajes*: una frase con el beneficio principal y la fórmula "`[Negocio]` ayuda a `[público]` a `[lograr resultado]` gracias a `[cómo lo hace]`".
   - *Canales*: elegir pocos y bien hechos (por ejemplo Instagram, Facebook, WhatsApp, web), justificando cada uno.
   - *Presupuesto*: separar honorarios de Pivot y dinero de pauta del cliente.
   - *Calendario*: qué se hace cada mes durante los primeros 3 meses (sugerencia, editable).
3. **Producción.** Armar la presentación en Google Slides con colores y logo de Pivot (ver [Marca Pivot](../05-marca-pivot.md)), máximo 15 diapositivas (sugerencia, editable).
4. **Aprobación.** Presentar el plan en reunión y pedir aprobación por escrito por WhatsApp (o correo, cuando Pivot tenga correo propio). Ajustar máximo 2 rondas de cambios (sugerencia, editable).
5. **Lanzamiento.** Crear las tareas en Asana según la [estructura de Asana](../plantillas/estructura-asana.md) y arrancar con los servicios que el cliente haya contratado.
6. **Informe.** Cada mes usar la [plantilla de informe mensual](../plantillas/informe-mensual.md): qué se hizo, qué resultados dio y qué sigue.
7. **Optimización.** Con los datos del mes, decidir qué seguir, qué cambiar y qué dejar. Revisar el plan completo cada 3 meses (sugerencia, editable).

## Herramientas

| Herramienta | Para qué | Estado |
|---|---|---|
| Google Drive / Sheets | Guardar diagnóstico, presupuesto y datos del cliente | Conectada |
| Google Slides | Presentación del plan | Conectada |
| Asana | Tareas y calendario del plan | Conectada |
| Meta Ads | Ver resultados de anuncios en Facebook e Instagram | Conectada |
| Metricool | Ver resultados de redes sociales | Conectada |
| Microsoft 365 (Teams, Outlook) | Reuniones con el cliente en Teams; Outlook para correo cuando Pivot tenga correo propio | Conectada |
| Google Analytics | Medir visitas y acciones en la web | Pendiente de conectar |
| Google Business Profile | Ficha del negocio en Google Maps | Pendiente de conectar |

## Lista de chequeo

- [ ] Brief completo y guardado en la carpeta del cliente en Drive.
- [ ] Diagnóstico de marca, público y competencia escrito.
- [ ] Buyer persona definido.
- [ ] Objetivos SMART con número y fecha (`[completar]`).
- [ ] Mensajes clave y canales justificados.
- [ ] Presupuesto separado: honorarios de Pivot y pauta del cliente.
- [ ] Calendario de los primeros meses.
- [ ] Presentación en Google Slides revisada (ortografía, datos, marca).
- [ ] Aprobación del cliente por escrito.
- [ ] Tareas creadas en Asana.
- [ ] Fecha del primer informe mensual agendada.

## Definición de terminado

El plan está **listo** cuando el cliente lo aprobó por escrito, la presentación está guardada en su carpeta de Drive, las tareas están en Asana y hay fecha para el primer informe. El seguimiento mensual está **listo** cada mes cuando el informe se envió y el cliente confirmó que lo recibió.

## Qué medimos (informe mensual)

Los indicadores se escogen según el objetivo del negocio, no por moda:

- **Leads (contactos de personas interesadas):** cuántas personas dejaron sus datos, escribieron por WhatsApp o pidieron cotización.
- **Ventas:** cuántas ventas reporta el cliente que vinieron del marketing (este dato lo da el cliente).
- **Costo por cliente (cuánto cuesta conseguir un cliente nuevo):** total invertido en el mes dividido entre clientes nuevos.
- **Tasa de conversión (porcentaje de contactos que terminan comprando):** ventas dividido entre leads.
- **Avance de objetivos SMART:** cuánto falta para cada meta.

Nunca prometer cifras de resultados antes de tener datos reales del cliente.

## Agentes y skills de apoyo

ECC es un conjunto de agentes y skills extra para Claude; solo funciona si su plugin (complemento que se instala en Claude) está instalado.

- `marketing-agent` de ECC (requiere el plugin instalado): estratega que ordena público, posicionamiento y mensajes antes de escribir textos.
- `brand-discovery` de ECC (requiere el plugin instalado): entrevista de marca por módulos; usar una versión corta para el diagnóstico.
- `market-research` de ECC (requiere el plugin instalado): análisis de competencia y mercado con fuentes, separando hechos de suposiciones.
- `marketing-campaign` de ECC (requiere el plugin instalado): cuando el plan incluye una campaña de lanzamiento con varios canales.
- `brand-voice` de ECC (requiere el plugin instalado): definir cómo suena la marca del cliente para que todo el equipo escriba igual.
- `pivot-cotizacion` (skill personal): cotizar el servicio antes de empezar.

## Errores comunes a evitar

- Empezar a publicar o pautar sin objetivos claros.
- Objetivos vagos como "tener más presencia" sin número ni fecha.
- Copiar lo que hace la competencia en vez de buscar en qué se diferencia el cliente.
- Escoger demasiados canales y hacerlos todos a medias.
- Mezclar el dinero de pauta con los honorarios de Pivot.
- Medir solo "me gusta" y no lo que le importa al negocio (contactos, ventas, costo por cliente).
- Prometer resultados sin datos.
