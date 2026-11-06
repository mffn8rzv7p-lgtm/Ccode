// Tarea de cada mañana (la llama pg_cron a las 8:00 a. m. de Medellín):
// 1) resumen de pacientes nuevos para la doctora y 2) recordatorios de las citas de mañana.
import { CLINICA } from "../_shared/config.ts";
import { env } from "../_shared/env.ts";
import { DateTime } from "../_shared/fechas.ts";
import { citasAgendadas, leerFichas } from "../_shared/google.ts";
import { paramPlantilla } from "../_shared/mensaje.ts";
import { enviarPlantilla } from "../_shared/whatsapp.ts";

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== env("CRON_SECRET")) return new Response("No autorizado", { status: 401 });

  const z = CLINICA.zonaHoraria;
  const ahora = DateTime.now().setZone(z);
  const informe = { pacientesNuevos: 0, recordatorios: 0, errores: [] as string[] };

  // 1) Pacientes registrados en las últimas 24 horas (desde la hoja "Pacientes").
  try {
    const desde = ahora.minus({ hours: 24 });
    const filas = (await leerFichas())
      .filter((f) => {
        const registrado = DateTime.fromFormat(f.Registrado, "yyyy-MM-dd HH:mm", { zone: z });
        return registrado.isValid && registrado >= desde;
      })
      .sort((a, b) => a.Cita.localeCompare(b.Cita));
    informe.pacientesNuevos = filas.length;
    if (filas.length > 0) {
      const lista = filas.map((f) => {
        const cita = DateTime.fromFormat(f.Cita, "yyyy-MM-dd HH:mm", { zone: z }).setLocale("es-CO");
        const hora = cita.isValid ? cita.toFormat("ccc d h:mm a") : f.Cita;
        return `${hora} ${f.Nombre} (${f.Motivo.toLowerCase()}${f.Urgente === "Sí" ? ", urgencia" : ""})`;
      }).join(" · ");
      await enviarPlantilla(CLINICA.telefonoClinica, "resumen_diario", CLINICA.idiomaPlantillas, [
        paramPlantilla(CLINICA.doctora),
        String(filas.length),
        paramPlantilla(lista, 1000),
      ]);
    }
  } catch (e) {
    console.error("Falló el resumen diario", e);
    informe.errores.push(`resumen: ${e}`);
  }

  // 2) Un recordatorio por cada cita de mañana agendada por la recepcionista.
  try {
    const manana = ahora.plus({ days: 1 });
    const citas = await citasAgendadas(manana.startOf("day").toISO()!, manana.endOf("day").toISO()!);
    for (const c of citas) {
      try {
        await enviarPlantilla(c.telefono, "recordatorio_cita", CLINICA.idiomaPlantillas, [
          paramPlantilla(c.nombre || "Hola"),
          DateTime.fromISO(c.inicio).setZone(z).setLocale("es-CO").toFormat("h:mm a"),
          paramPlantilla(CLINICA.doctora),
        ]);
        informe.recordatorios++;
      } catch (e) {
        console.error(`No se pudo enviar el recordatorio a ${c.telefono}`, e);
        informe.errores.push(`recordatorio ${c.telefono}: ${e}`);
      }
    }
  } catch (e) {
    console.error("No se pudieron leer las citas de mañana", e);
    informe.errores.push(`citas: ${e}`);
  }

  return Response.json(informe, { status: informe.errores.length ? 207 : 200 });
});
