# Seguridad y datos

Para qué sirve: reglas simples para cuidar las cuentas de Pivot, las de los clientes y los datos personales de las personas que les escriben, y qué hacer si algo sale mal.

La idea de fondo: **cada persona entra solo a lo que necesita, con su propio usuario, y se le quita el acceso cuando ya no lo necesita.**

## Reglas de oro

1. **Nunca pedir ni enviar contraseñas por WhatsApp, correo o chat.** Ni del cliente ni de Pivot. Si alguien manda una por error, se le pide que la cambie de inmediato.
2. **Meta Business Manager (el panel de Meta para administrar páginas de Facebook, Instagram y anuncios): acceso como socio (partner).** El cliente agrega a Pivot como socio desde su propio Business Manager y le da **el rol mínimo** que haga falta (por ejemplo, solo anuncios si solo se hace pauta). Nunca pedir el usuario personal de Facebook del cliente.
3. **Invitaciones en vez de cuentas compartidas.** En Canva, Metricool, Google Drive, Asana y demás, cada persona entra con su propio usuario por invitación. Así se sabe quién hizo qué y se puede quitar a alguien sin cambiar la clave de todos.
4. **Verificación en dos pasos en todas las cuentas de Pivot.** Es un segundo candado: además de la contraseña, se pide un código del celular. Mejor con una app de códigos que con mensaje de texto.
5. **Gestor de contraseñas para las cuentas propias de Pivot** (una app que guarda las claves cifradas, crea claves fuertes y permite compartirlas de forma segura; por ejemplo, Bitwarden o 1Password). Una clave distinta para cada cuenta, nunca en notas del celular, hojas de cálculo ni papelitos.
6. **Dominio (la dirección de la web, como `negocio.com`), hosting (el espacio donde vive la página), Business Manager, cuenta publicitaria, página, Instagram y pixel (código que avisa a Meta cuando alguien compra o deja sus datos en la web) siempre a nombre del cliente**, con su correo y su medio de pago. Pivot nunca los crea en su propio Business Manager; entra como colaborador o socio. Ver [Diseño web](servicios/diseno-web.md) y [Pauta digital](servicios/pauta-digital.md).
7. **Lo mínimo necesario:** pedir solo los accesos y datos que el trabajo requiere, y por el tiempo que dure.

## Dónde se guardan los datos del cliente

- **Google Drive, una carpeta por cliente**, compartida solo con las personas que trabajan en esa cuenta y con el cliente. Nada de "cualquiera con el enlace".
- Logo, fotos, briefs y entregas van ahí, no en el celular personal ni en chats.
- **GitHub** guarda las webs: solo archivos de la página, **nunca** contraseñas, listas de clientes ni datos personales. Repositorios privados, verificación en dos pasos en GitHub y acceso solo para quien trabaja en la web.
- Asana para tareas; sin contraseñas en las descripciones ni comentarios.

## Datos personales de clientes finales (leads)

Los leads son las personas que escriben, dejan su número o llenan un formulario por una campaña o la web del cliente.

- **Mínimo necesario:** solo lo que sirve para responder (nombre y forma de contacto, por ejemplo).
- **Dónde sí:** en la cuenta del cliente (su WhatsApp Business, su formulario) o en una hoja de Drive dentro de la carpeta del cliente con permisos limitados.
- **Dónde no:** en GitHub, en chats personales, en capturas de pantalla reenviadas, ni en informes (en el [informe mensual](plantillas/informe-mensual.md) van números totales, nunca nombres ni teléfonos).
- **Borrar de la hoja los leads ya entregados al cliente** al cierre de cada mes (sugerencia, editable).
- **Ley 1581 de 2012 (ley colombiana de protección de datos personales):** exige pedir autorización para usar los datos de las personas y decirles para qué se usan.
  - El **titular** de los datos es la persona (el lead). Ella tiene derecho a conocer sus datos, actualizarlos o rectificarlos, revocar la autorización y pedir que se borren.
  - El cliente es el **responsable del tratamiento** (quien decide para qué se usan los datos).
  - Pivot, cuando maneja leads, es **encargado del tratamiento**: debe protegerlos, usarlos solo para lo que el cliente indicó y avisarle al cliente de cualquier incidente.
  - El cliente normalmente necesita una **política de tratamiento de datos** (el documento con sus reglas para manejar datos personales), no solo un **aviso de privacidad** (el texto corto que se muestra en la web y los formularios). El acuerdo entre el cliente y Pivot debería incluir cómo se manejan los datos.
  - **Recomendación: que el cliente consulte con un abogado** para estos documentos. Pivot no redacta textos legales.

## Al iniciar un cliente

Se hace junto con la [checklist de onboarding](plantillas/checklist-onboarding.md).

- [ ] Carpeta del cliente creada en Drive, compartida solo con quien corresponde.
- [ ] Pivot agregado como socio en el Meta Business Manager del cliente, con el rol mínimo.
- [ ] Invitaciones enviadas en Canva, Metricool y demás herramientas (nada de cuentas compartidas).
- [ ] Dominio, hosting, Business Manager, cuenta publicitaria, página, Instagram y pixel confirmados a nombre del cliente (nada creado en el Business Manager de Pivot).
- [ ] Ninguna contraseña recibida por chat o correo.
- [ ] Lista de accesos dados anotada en la carpeta del cliente (qué herramienta, quién y con qué rol; **sin claves**).
- [ ] Cliente informado sobre la Ley 1581 y la recomendación de tener política de tratamiento de datos y aviso de privacidad, si hay captación de leads.

## Al terminar un cliente

Se hace dentro de los 5 días hábiles siguientes al cierre (sugerencia, editable).

- [ ] Pedirle al cliente que quite a Pivot como socio en su Meta Business Manager (o quitarse Pivot, si tiene cómo).
- [ ] Salir o pedir que retiren a Pivot de Canva, Metricool, Drive compartidos, hosting y demás.
- [ ] Desconectar de Metricool las redes del cliente.
- [ ] Entregar al cliente todo su material y archivos finales.
- [ ] Borrar o devolver los datos de leads que Pivot haya tenido.
- [ ] Archivar el proyecto en Asana.
- [ ] Revisar la lista de accesos: todos retirados.
- [ ] Si alguien del equipo de Pivot se va: quitarle todos sus accesos el mismo día (Business Manager de Pivot, gestor de contraseñas, GitHub, Asana, equipo de Canva, Metricool, Drive y grupos de WhatsApp con clientes) y cambiar las claves de Pivot que conocía.

## Qué hacer si algo se filtra

Si se envió una contraseña por chat, alguien desconocido entró a una cuenta, se compartió un archivo con quien no era o se perdió un celular:

1. **Cambiar la contraseña** de la cuenta afectada de inmediato y cerrar todas las sesiones abiertas (casi todas las plataformas tienen la opción "cerrar sesión en todos los dispositivos"). Si la contraseña se envió por chat, cambiarla y después borrar el mensaje.
2. **Activar o revisar la verificación en dos pasos** de esa cuenta.
3. **Quitar accesos raros:** revisar quién tiene permiso (en Meta, Drive, hosting) y retirar a quien no corresponda.
4. **Si alguien tomó una cuenta de anuncios:** revisar si hay gasto no autorizado, campañas nuevas o cambios en el medio de pago, y reportarlo al soporte de Meta y al banco.
5. **Si se perdió un celular:** bloquearlo o borrarlo a distancia y cerrar WhatsApp Web y las demás sesiones abiertas.
6. **Avisar al cliente el mismo día** si la cuenta o los datos eran suyos, con palabras claras: qué pasó, qué se hizo y qué falta.
7. **Si hay datos personales de leads involucrados:** Pivot avisa al cliente de inmediato; la ley obliga a informar los incidentes de seguridad a la SIC (Superintendencia de Industria y Comercio), así que el cliente debe hacerlo con asesoría de su abogado.
8. **Anotar lo ocurrido** en la carpeta del cliente (fecha, qué pasó, qué se hizo, sin claves) y ajustar la regla que falló.

## Relación con otros documentos

- [Forma de trabajo](01-forma-de-trabajo.md) y [ciclo del cliente](02-ciclo-del-cliente.md): cuándo se dan y se quitan accesos.
- Principios tomados del agente `security-reviewer` de ECC (un conjunto de agentes y skills extra para Claude; requiere el plugin, es decir, el complemento que se instala en Claude): mínimo privilegio (solo el acceso necesario), varias capas de protección, nunca secretos guardados donde no deben y cambiar claves apenas se expongan.
