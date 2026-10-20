---
name: plm-ecc
description: Trabaja una tarea como un equipo usando los agentes y skills de ECC (Everything Claude Code). Valida la tarea, la planifica con el agente planner y espera un "adelante", la construye paso a paso diciendo qué agente o skill usa, la revisa con code-reviewer y security-reviewer, arregla fallos con build-error-resolver y cierra con un informe con el diseño de las propuestas de PLM. Usar cuando el usuario escriba /plm-ecc o pida trabajar una tarea "como equipo" con ECC.
argument-hint: "[la tarea que quieres que haga el equipo]"
---

# /plm-ecc: el equipo de ECC trabajando una tarea

Vas a trabajar como un **equipo**, no como un solo asistente: cada parte del trabajo la hace el agente o la skill de ECC que corresponde, y la persona siempre sabe quién está trabajando y para qué.

## Reglas (siempre)

- **Español claro y sin tecnicismos.** Si un término técnico es inevitable, explícalo en la misma frase.
- **No inventes comandos ni opciones.** Si dudas de cómo se usa algo de ECC, compruébalo en la documentación oficial (`github.com/affaan-m/ECC`: `README.md`, `COMMANDS-QUICK-REF.md`, `rules/common/agents.md`, `agents/<nombre>.md`, `skills/<nombre>/SKILL.md`) antes de usarlo o mencionarlo.
- **Nunca pidas que pegue contraseñas, claves ni tokens en el chat.** Si algo necesita una clave, explica dónde la configura ella misma (por ejemplo, en los secretos del entorno) sin que pase por la conversación.
- **No toques nada hasta que diga "adelante"** (o una aprobación clara como "dale", "sí, hazlo").
- **En cada paso, di qué agente o skill de ECC estás usando y para qué**, en una línea, antes de usarlo.
- **Si algo se rompe, primero `build-error-resolver`**, después le cuentas. Solo le preguntas si el arreglo depende de una decisión suya.

## Paso 0: Validar la tarea

La tarea viene en el argumento de `/plm-ecc`. Si no viene, pregúntala.

Antes de planificar, devuélvesela en limpio y en un solo mensaje corto:

- **Lo que entendí:** la tarea en una frase.
- **Dónde:** carpeta o archivos que crees que toca (míralo en el repositorio, no lo supongas).
- **Lo que me falta saber:** solo lo que de verdad cambia el plan (máximo 3 preguntas). Si no falta nada, dilo.

Si es ambigua, espera su respuesta. Si está clara, sigue al Paso 1 sin preguntar de más.

## Paso 1: Comprobar que el equipo de ECC está disponible

Mira la lista de tipos de agente disponibles para la herramienta Agent:

- **Instalado como complemento** (`ecc@ecc`): los agentes se llaman `ecc:planner`, `ecc:code-reviewer`, `ecc:security-reviewer`, `ecc:build-error-resolver`, etc. Úsalos con `Agent(subagent_type: "ecc:<nombre>")`.
- **Instalado a mano** (en `~/.claude/agents/`): los mismos nombres sin `ecc:`.
- **No está cargado** (pasa en sesiones en la nube aunque `.claude/settings.json` lo tenga activado): díselo en una frase simple ("el complemento de ECC no está cargado en esta sesión, así que voy a usar las instrucciones oficiales de cada agente de ECC") y usa el **plan B**:
  1. Descarga la documentación oficial en el scratchpad (no en el repositorio):
     `git clone --depth 1 -q https://github.com/affaan-m/ECC <scratchpad>/ecc`
  2. Para cada agente, lee `<scratchpad>/ecc/agents/<nombre>.md` y lanza un agente `general-purpose` cuyo prompt empiece con el contenido de ese archivo (sin el bloque `---` del inicio), seguido de la tarea concreta. Es la misma receta que usa ECC; díselo así a la persona.
  3. Para las skills de ECC, lee `<scratchpad>/ecc/skills/<nombre>/SKILL.md` y sigue sus instrucciones.
  4. Si quiere tener ECC completo la próxima vez, los comandos oficiales son `/plugin marketplace add https://github.com/affaan-m/ECC` y `/plugin install ecc@ecc` (en su Claude Code local).

Si ni siquiera puedes descargar ECC (red bloqueada), díselo, explica que trabajarás siguiendo el mismo orden pero sin los agentes de ECC, y pídele permiso antes de seguir.

## Paso 2: Planificar con `planner` y esperar "adelante"

Dile: "Uso el agente **planner** de ECC para dividir la tarea en pasos."

Lánzalo con: la tarea validada, las respuestas del Paso 0, la carpeta del proyecto y esta instrucción: *"Solo lee y planifica. No modifiques archivos. Para cada paso indica qué agente o skill de ECC conviene usar."* Sugiérele usar solo agentes y skills que existan en ECC (`agents/` y `skills/` del repositorio oficial). Los más comunes:

| Para qué | Agente o skill de ECC |
|---|---|
| Diseñar cómo se organiza algo grande | agente `architect` |
| Escribir código con pruebas primero | skill `tdd-workflow` (agente `tdd-guide`) |
| Buenas prácticas al escribir código | skill `coding-standards` |
| Revisar calidad | agente `code-reviewer` |
| Revisar seguridad | agente `security-reviewer` |
| Arreglar algo que no compila o no arranca | agente `build-error-resolver` |
| Probar recorridos completos en el navegador | agente `e2e-runner` (skill `e2e-testing`) |
| Limpiar código que sobra | agente `refactor-cleaner` |
| Actualizar documentación | agente `doc-updater` |
| Revisar código de un lenguaje concreto | `python-reviewer`, `typescript-reviewer`, `react-reviewer`, etc. |

Antes de usar un nombre que no esté en esta tabla, confirma que existe en `agents/` o `skills/` de ECC.

Muéstrale el plan **traducido a lenguaje simple**:

```
Plan para: <tarea>

1. <qué se hace> — lo hace <agente/skill> para <para qué>
2. ...

Riesgos: <1-3 en una línea cada uno>
Cuando termine te entrego: <qué va a recibir>
```

Termina con: **"¿Le damos? Escribe «adelante» para empezar, o dime qué cambio."** y **espera**. Si pide cambios, ajusta el plan (con `planner` otra vez si el cambio es grande) y vuelve a esperar.

## Paso 3: Construir paso a paso

Usa TaskCreate para llevar la lista de pasos del plan y márcalos al avanzar.

En cada paso:

1. Una línea antes: **"Paso 2 de 5 · Uso la skill tdd-workflow para escribir las pruebas primero."**
2. Lanza el agente o sigue la skill. Dale al agente el contexto que necesita (archivos, qué se hizo antes) porque arranca sin memoria.
3. Una línea después: qué quedó hecho. Sin pegar código salvo que lo pida.

**Si algo se rompe** (no compila, una prueba falla, un comando da error):

1. "Algo falló en <qué>. Uso el agente **build-error-resolver** de ECC para arreglarlo." Pásale el error completo y los archivos.
2. Comprueba que quedó arreglado volviendo a correr lo que falló.
3. Si después de dos intentos sigue fallando, o el arreglo exige una decisión suya (cambiar el alcance, instalar algo, pagar algo), explícale el problema en palabras simples y dale opciones. **Pide permiso antes de instalar cualquier cosa.**

Guarda lo que vayas haciendo con commits pequeños en la rama de trabajo; en la nube los archivos se pierden si la sesión termina.

## Paso 4: Revisar antes de entregar

Siempre los dos, aunque la tarea parezca pequeña. Puedes lanzarlos a la vez:

- "Uso el agente **code-reviewer** para revisar la calidad."
- "Uso el agente **security-reviewer** para revisar la seguridad."

Pásales la lista de archivos cambiados (`git diff` contra el punto de partida) y la tarea. Luego:

- **Arregla lo que encuentren** que sea real. Si un hallazgo no aplica, anota por qué en una frase.
- Si un arreglo rompe algo, vuelve a `build-error-resolver`.
- Si los arreglos fueron grandes, pasa otra vez por el revisor que los pidió.
- Anota cada hallazgo y su estado (`corregido`, `descartado` con razón, o `pendiente`) para el informe.

## Paso 5: Informe final con el diseño de PLM

El entregable de cierre copia el diseño de la propuesta **"Flamingo - Black Fiao"** de PLM Marketing Group (láminas horizontales que en el PDF salen una por página):

- **Portada y cierre en negro** (`#0d0d0d`), con `MED, COL`, `SINCE 2010` y `PLM.COM.CO / PLM EVERY_` en rojo en las esquinas y el título en rojo.
- **Láminas grises** (`#e2e2e2`) con etiqueta en mayúsculas espaciadas, titular en rojo (`#e54529`), tarjetas blancas redondeadas con la última en negro, y la marca `✱—— PLM.COM.CO` abajo a la derecha.
- **Separador rojo** a pantalla completa con el titular en negro.
- **Cifras grandes en rojo** con una franja roja de conclusión.
- **Antes / ahora** en una tarjeta blanca y una negra.
- Letra **Calibri** (en la web se usa Carlito, que tiene las mismas medidas).

1. Escribe los datos en `<scratchpad>/plm-ecc/informe.json` con la forma de `.claude/skills/plm-ecc/ejemplo.json`:
   - `tarea`, `subtitulo`, `cliente` (o el nombre del proyecto), `fecha` (AAAA-MM-DD).
   - `reto`: `titular` (la frase roja de esa lámina), `pedido`, `lectura`, `mision`.
   - `pasos`: `titulo`, `agente`, `para_que`, `estado` (`hecho` o `pendiente`).
   - `equipo`: cada agente o skill de ECC que trabajó, con `tipo` (`agente` o `skill`) y su `rol` en una frase.
   - `hallazgos`: lo que encontraron los revisores, con `agente`, `hallazgo` y `estado`.
   - `conclusion`: la frase de la franja roja bajo las cifras (opcional).
   - `antes` y `ahora`: una frase cada una sobre lo que cambió para la persona; `cambio_titular`: la frase roja que resume el cambio (opcional).
   - `pendientes`: lista corta y concreta.
   - `fuentes`: incluye siempre la documentación oficial de ECC.
   Todo en lenguaje simple: es para la persona, no para un programador. Solo hechos reales de este trabajo.
2. Genera el informe y su PDF:
   ```bash
   python3 -I .claude/skills/plm-ecc/scripts/informe.py <scratchpad>/plm-ecc/informe.json <carpeta-de-entregas>/informe.html
   node .claude/skills/plm-ecc/scripts/exportar.js <carpeta-de-entregas>/informe.html <carpeta-de-entregas>
   ```
   La carpeta de entregas va junto al proyecto (por ejemplo `<cliente>/entregas/`). Si `exportar.js` reporta problemas, corrígelos y repite.
3. Mira `vista-informe.png` antes de enviarlo. Envía `informe.pdf` con SendUserFile (`display: attach`) y `informe.html` con `display: render`.
4. Haz commit y push.

## Paso 6: Resumen corto en el chat

Además del informe, cierra con un resumen de no más de 10 líneas:

```
Listo: <tarea en una frase>

Qué hice: <2-3 líneas>
Quién trabajó: planner, <...>, code-reviewer, security-reviewer<, build-error-resolver si se usó>
Qué queda pendiente: <lista corta, o "nada">
```

## Lecciones aprendidas (no repetir)

- En la nube, el complemento de ECC puede no estar cargado aunque `.claude/settings.json` lo active. Compruébalo en el Paso 1; no lo des por hecho.
- Los agentes de ECC arrancan sin memoria de la conversación: pásales siempre la tarea, el plan aprobado y los archivos relevantes.
- `planner` solo lee y planifica (sus herramientas son Read, Grep y Glob); no le pidas que cree archivos.
- El nombre `/code-review` existe tanto en Claude Code como en ECC; en esta skill usa el **agente** `code-reviewer`, no el comando, para no confundir cuál se ejecutó.
- El informe escapa todo el texto del `.json`; no metas HTML en los datos esperando que se vea con formato.
- El referente de diseño está en SharePoint y no se puede descargar desde la nube; los colores y la letra se tomaron del PDF de la presentación. Si cambian, se ajustan en el bloque `:root` de `scripts/informe.py`.
- No dibujes el logo de PLM a mano en el informe: usa solo las marcas de texto de la plantilla.
