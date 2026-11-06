// Pruebas sin red ni dinero: lectura de mensajes, botones, horarios libres, firma de Meta e historial.
// Ejecutar desde recepcionista-clinica/:  deno test --allow-env pruebas/
import { assert, assertEquals } from "jsr:@std/assert@1.0.14";
import { CLINICA } from "../supabase/functions/_shared/config.ts";
import { DateTime, dentroDeHorario, horariosLibres } from "../supabase/functions/_shared/fechas.ts";
import { firmaValida, leerMensajes, paramPlantilla, prepararRespuesta } from "../supabase/functions/_shared/mensaje.ts";

Deno.env.set("ANTHROPIC_API_KEY", "clave-de-prueba");
const { armarHistorial } = await import("../supabase/functions/_shared/agente.ts");

const z = CLINICA.zonaHoraria;
const webhook = (msg: unknown) => ({
  entry: [{ changes: [{ value: { contacts: [{ profile: { name: "Ana" } }], messages: [msg] } }] }],
});

Deno.test("lee un mensaje de texto", () => {
  const [m] = leerMensajes(webhook({ id: "w1", from: "573001112233", type: "text", text: { body: "Hola, me duele una muela" } }));
  assertEquals(m.tipo, "texto");
  assertEquals(m.texto, "Hola, me duele una muela");
  assertEquals(m.nombre, "Ana");
  assertEquals(m.telefono, "573001112233");
});

Deno.test("ignora los avisos de estado (entregado, leído)", () => {
  assertEquals(leerMensajes({ entry: [{ changes: [{ value: { statuses: [{ status: "read" }] } }] }] }), []);
});

Deno.test("un botón de horario trae la cita dentro", () => {
  const id = JSON.stringify({ i: "2026-11-10T09:30:00-05:00", u: 1, m: "dolor de muela", n: "Ana Pérez" });
  const [m] = leerMensajes(webhook({
    id: "w2", from: "573001112233", type: "interactive",
    interactive: { type: "button_reply", button_reply: { id, title: "Mar 10 · 9:30 am" } },
  }));
  assertEquals(m.tipo, "eleccion");
  assertEquals(m.inicio, "2026-11-10T09:30:00-05:00");
  assertEquals(m.urgente, true);
  assertEquals(m.nombre, "Ana Pérez");
});

Deno.test("nota de voz y tipos no soportados", () => {
  const [a] = leerMensajes(webhook({ id: "w3", from: "57", type: "audio", audio: { id: "media1" } }));
  assertEquals([a.tipo, a.audioId], ["audio", "media1"]);
  const [s] = leerMensajes(webhook({ id: "w4", from: "57", type: "sticker" }));
  assert(s.texto.includes("sticker"));
});

Deno.test("prepara botones: máx. 3, títulos únicos y de 20 caracteres, id ≤ 256", () => {
  const r = prepararRespuesta({
    respuesta: "Tengo estos horarios",
    accion: "ofrecer_horarios",
    botones: [
      { titulo: "Mar 10 · 9:30 am", inicio: "2026-11-10T09:30:00-05:00" },
      { titulo: "Mar 10 · 9:30 am", inicio: "2026-11-10T09:30:00-05:00" }, // repetido
      { titulo: "Un título larguísimo que no cabe", inicio: "2026-11-10T10:00:00-05:00" },
      { titulo: "Mié 11 · 8:00 am", inicio: "2026-11-11T08:00:00-05:00" },
      { titulo: "Jue 12 · 8:00 am", inicio: "2026-11-12T08:00:00-05:00" },
    ],
    urgente: false,
    motivo: "x".repeat(300),
    nombre_paciente: "y".repeat(300),
  }, "Ana");
  assertEquals(r.botones.length, 3);
  assert(r.botones.every((b) => b.reply.title.length <= 20 && b.reply.id.length <= 256));
  assertEquals(JSON.parse(r.botones[0].reply.id).i, "2026-11-10T09:30:00-05:00");
});

Deno.test("sin botones no se ofrecen horarios; sin fecha no se reserva", () => {
  assertEquals(prepararRespuesta({ respuesta: "a", accion: "ofrecer_horarios", botones: [] }, "").accion, "responder");
  assertEquals(prepararRespuesta({ respuesta: "a", accion: "reservar", cita_inicio: "" }, "").accion, "responder");
});

Deno.test("parámetros de plantilla sin saltos de línea", () => {
  assertEquals(paramPlantilla("hola\n\n  mundo\t!"), "hola mundo !");
  assertEquals(paramPlantilla(""), "-");
});

Deno.test("horarios libres: respeta horario, ocupados, margen y festivos", () => {
  // Lunes 9 de noviembre de 2026, 7:00 a. m. en Medellín.
  const ahora = DateTime.fromISO("2026-11-09T07:00:00", { zone: z });
  const desde = ahora.startOf("day");
  const hasta = ahora.endOf("day");
  const libres = horariosLibres(desde, hasta, [
    { start: "2026-11-09T09:00:00-05:00", end: "2026-11-09T10:00:00-05:00" },
  ], ahora, CLINICA);
  const horas = libres.map((t) => t.toFormat("HH:mm"));
  assertEquals(horas[0], "08:00"); // 7:00 + 60 min de margen
  assert(!horas.includes("09:00") && !horas.includes("09:30"));
  assertEquals(horas.at(-1), "17:30");
  assertEquals(libres.length, 18);

  // Domingo 15 y festivo lunes 16 cerrados: solo cuenta el martes 17 completo (8:00 a 18:00 = 20 citas).
  const domingo = DateTime.fromISO("2026-11-15T00:00:00", { zone: z });
  assertEquals(horariosLibres(domingo, domingo.plus({ days: 2 }).endOf("day"), [], ahora, CLINICA).length, 20);
});

Deno.test("dentro de horario", () => {
  assert(dentroDeHorario(DateTime.fromISO("2026-11-10T17:30:00-05:00"), CLINICA));
  assert(!dentroDeHorario(DateTime.fromISO("2026-11-10T18:00:00-05:00"), CLINICA));
  assert(!dentroDeHorario(DateTime.fromISO("2026-11-14T13:00:00-05:00"), CLINICA)); // sábado después de la 1
  assert(!dentroDeHorario(DateTime.fromISO("2026-12-25T10:00:00-05:00"), CLINICA)); // Navidad
});

Deno.test("firma de Meta", async () => {
  const cuerpo = '{"hola":1}';
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode("secreto"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(cuerpo)));
  const firma = "sha256=" + Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  assert(await firmaValida(cuerpo, firma, "secreto"));
  assert(!(await firmaValida(cuerpo + " ", firma, "secreto")));
  assert(!(await firmaValida(cuerpo, null, "secreto")));
});

Deno.test("historial: une turnos seguidos y empieza con la persona", () => {
  const h = armarHistorial([
    { rol: "assistant", contenido: "¡Listo!" },
    { rol: "user", contenido: "hola" },
    { rol: "user", contenido: "¿hay cita?" },
    { rol: "assistant", contenido: "Claro" },
  ]);
  assertEquals(h.map((m) => m.role), ["user", "assistant"]);
  assertEquals(h[0].content, "hola\n¿hay cita?");
});
