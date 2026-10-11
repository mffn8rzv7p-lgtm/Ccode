# Seguridad y datos

Para qué sirve: reglas simples para cuidar las cuentas de Pivot, las de los clientes y los datos personales de las personas que les escriben, y qué hacer si algo sale mal.

La idea de fondo: **cada persona entra solo a lo que necesita, con su propio usuario, y se le quita el acceso cuando ya no lo necesita.**

## Reglas de oro

1. **Nunca pedir ni enviar contraseñas por WhatsApp, correo o chat.** Ni del cliente ni de Pivot. Si alguien manda una por error, se le pide que la cambie de inmediato.
2. **Meta Business Manager (el panel de Meta para administrar páginas de Facebook, Instagram y anuncios): acceso como socio (partner).** El cliente agrega a Pivot como socio desde su propio Business Manager y le da **el rol mínimo** que haga falta (por ejemplo, solo anuncios si solo se hace pauta). Nunca pedir el usuario personal de Facebook del cliente.
3. **Invitaciones en vez de cuentas compartidas.** En Canva, Metricool, Google Drive, Asana y demás, cada persona entra con su propio usuario por invitación. Así se sabe quién hizo qué y se puede quitar a alguien sin cambiar la clave de todos.
4. **Verificación en dos pasos en todas las cuentas de Pivot.** Es un segundo candado: además de la contraseña, se pide un código del celular. Mejor con una app de códigos que con mensaje de texto.
5. **Gestor de contraseñas para las cuentas propias de Pivot** (una app que guarda las claves cifradas, crea claves fuertes y permite compartirlas de forma segura; por ejemplo, Bitwarden o 1Password). Una clave distinta para cada cuenta, nunca en notas del celular, hojas de cálculo ni papelitos.
6. **Dominio y hosting siempre a nombre del cliente**, con su correo y su medio de pago. Pivot entra como colaborador. Ver [Diseño web](servicios/diseno-web.md).
7. **Lo mínimo necesario:** pedir solo los accesos y datos que el trabajo requiere, y por el tiempo que dure.

## Dónde se guardan los datos del cliente

- **Google Drive, una carpeta por cliente**, compartida solo con las personas que trabajan en esa cuenta y con el cliente. Nada de "cualquiera con el enlace".
- Logo, fotos, briefs y entregas van ahí, no en el celular personal ni en chats.
- **GitHub** guarda las webs: solo archivos de la página, **nunca** contraseñas, listas de clientes ni datos personales.
- Asana para tareas; sin contraseñas en las descripciones ni comentarios.

## Datos personales de clientes finales (leads)

Los leads son las personas que escriben, dejan su número o llenan un formulario por una campaña o la web del cliente.

- **Mínimo necesario:** solo lo que sirve para responder (nombre y forma de contacto, por ejemplo).
- **Dónde sí:** en la cuenta del cliente (su WhatsApp Business, su formulario) o en una hoja de Drive dentro de la carpeta del cliente con permisos limitados.
- **Dónde no:** en GitHub, en chats personales, en capturas de pantalla reenviadas, ni en informes (en el [informe mensual](plantillas/informe-mensual.md) van números totales, nunca nombres ni teléfonos).
- **Ley 1581 de 2012 (ley colombiana de protección de datos personales):** exige pedir autorización para usar los datos de las personas, decirles para qué se usan y permitirles consultarlos o pedir que se borren. El dueño de los datos es el cliente, no Pivot. **Recomendación: que el cliente consulte con un abogado para redactar su aviso de privacidad** (el texto que explica cómo usa los datos) y ponerlo en su web y formularios. Pivot no redacta textos legales.

## Al iniciar un cliente

Se hace junto con la [checklist de onboarding](plantillas/checklist-onboarding.md).

- [ ] Carpeta del cliente creada en Drive, compartida solo con quien corresponde.
- [ ] Pivot agregado como socio en el Meta Business Manager del cliente, con el rol mínimo.
- [ ] Invitaciones enviadas en Canva, Metricool y demás herramientas (nada de cuentas compartidas).
- [ ] Dominio y hosting confirmados a nombre del cliente.
- [ ] Ninguna contraseña recibida por chat o correo.
- [ ] Lista de accesos dados anotada en la carpeta del cliente (qué herramienta, quién y con qué rol; **sin claves**).
- [ ] Cliente informado sobre la Ley 1581 y la recomendación del aviso de privacidad, si hay captación de leads.

## Al terminar un cliente

Se hace dentro de los 5 días hábiles siguientes al cierre (sugerencia, editable).

- [ ] Pedirle al cliente que quite a Pivot como socio en su Meta Business Manager (o quitarse Pivot, si tiene cómo).
- [ ] Salir o pedir que retiren a Pivot de Canva, Metricool, Drive compartidos, hosting y demás.
- [ ] Entregar al cliente todo su material y archivos finales.
- [ ] Borrar o devolver los datos de leads que Pivot haya tenido.
- [ ] Archivar el proyecto en Asana.
- [ ] Revisar la lista de accesos: todos retirados.
- [ ] Si alguien del equipo de Pivot se va: quitarle todos sus accesos el mismo día y cambiar las claves de Pivot que conocía.

## Qué hacer si algo se filtra

Si se envió una contraseña por chat, alguien desconocido entró a una cuenta, se compartió un archivo con quien no era o se perdió un celular:

1. **Cambiar la contraseña** de la cuenta afectada de inmediato y cerrar todas las sesiones abiertas (casi todas las plataformas tienen la opción "cerrar sesión en todos los dispositivos").
2. **Activar o revisar la verificación en dos pasos** de esa cuenta.
3. **Quitar accesos raros:** revisar quién tiene permiso (en Meta, Drive, hosting) y retirar a quien no corresponda.
4. **Avisar al cliente el mismo día** si la cuenta o los datos eran suyos, con palabras claras: qué pasó, qué se hizo y qué falta.
5. **Si hay datos personales de leads involucrados:** el cliente, como responsable, debe consultar con su abogado los pasos legales (puede haber obligación de reportarlo ante la Superintendencia de Industria y Comercio, la entidad que vigila la protección de datos en Colombia).
6. **Anotar lo ocurrido** en la carpeta del cliente (fecha, qué pasó, qué se hizo, sin claves) y ajustar la regla que falló.

## Relación con otros documentos

- [Forma de trabajo](01-forma-de-trabajo.md) y [ciclo del cliente](02-ciclo-del-cliente.md): cuándo se dan y se quitan accesos.
- Principios tomados del agente `security-reviewer` de ECC (requiere el plugin instalado): mínimo privilegio (solo el acceso necesario), varias capas de protección, nunca secretos guardados donde no deben y cambiar claves apenas se expongan.
