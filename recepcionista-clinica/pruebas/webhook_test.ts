// Prueba de punta a punta del webhook con TODAS las APIs simuladas (Meta, Google, Claude, Supabase).
// No usa internet ni gasta dinero. Ejecutar desde recepcionista-clinica/:  deno test --allow-env pruebas/
import { assert, assertEquals } from "jsr:@std/assert@1.0.14";

const SECRETO = "secreto-app";
for (const [k, v] of Object.entries({
  ANTHROPIC_API_KEY: "sk-prueba", WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "111", WHATSAPP_VERIFY_TOKEN: "verifica",
  WHATSAPP_APP_SECRET: SECRETO, GOOGLE_CALENDAR_ID: "cal@group", GOOGLE_SHEET_ID: "hoja", SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "srk",
  GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "bot@p.iam.gserviceaccount.com", private_key: await clavePrivadaPrueba() }),
})) Deno.env.set(k, v);

// ---- APIs simuladas ----
const enviados: Record<string, unknown>[] = []; // mensajes enviados por WhatsApp
const eventosCreados: unknown[] = [];
const filasSheets: unknown[] = [];
const procesados = new Set<string>();
let respuestasClaude: unknown[] = [];

globalThis.fetch = async (entrada: string | URL | Request, init?: RequestInit) => {
  const req = new Request(entrada, init);
  const url = req.url;
  const cuerpo = req.method === "GET" ? null : await req.text();
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json" } });

  if (url.includes("graph.facebook.com") && url.endsWith("/messages")) {
    const d = JSON.parse(cuerpo!);
    if (d.status !== "read") enviados.push(d);
    return json({ messages: [{ id: "wamid.salida" }] });
  }
  if (url.startsWith("https://oauth2.googleapis.com/token")) return json({ access_token: "g", expires_in: 3600 });
  if (url.includes("/calendar/v3/freeBusy")) return json({ calendars: { "cal@group": { busy: [] } } });
  if (url.includes("/calendar/v3/calendars/") && req.method === "POST") {
    eventosCreados.push(JSON.parse(cuerpo!));
    return json({ id: "evento123" });
  }
  if (url.includes("sheets.googleapis.com")) {
    filasSheets.push(JSON.parse(cuerpo!).values[0]);
    return json({});
  }
  if (url.includes("api.anthropic.com/v1/messages")) {
    const d = JSON.parse(cuerpo!);
    assertEquals(d.model, "claude-opus-5-5");
    assertEquals(d.output_config.format.type, "json_schema");
    return json(respuestasClaude.shift());
  }
  if (url.includes("/rest/v1/mensajes_procesados")) {
    const { id } = JSON.parse(cuerpo!);
    if (procesados.has(id)) return json({ code: "23505", message: "duplicate key" }, 409);
    procesados.add(id);
    return new Response(null, { status: 201 });
  }
  if (url.includes("/rest/v1/conversaciones") && req.method === "GET") return json([]);
  if (url.includes("/rest/v1/")) return new Response(null, { status: 201 });
  throw new Error(`URL no simulada: ${req.method} ${url}`);
};

let manejador!: (req: Request) => Promise<Response>;
// deno-lint-ignore no-explicit-any
(Deno as any).serve = (h: typeof manejador) => {
  manejador = h;
};
await import("../supabase/functions/whatsapp/index.ts");

async function enviarWebhook(mensaje: unknown): Promise<Response> {
  const cuerpo = JSON.stringify({ entry: [{ changes: [{ value: { contacts: [{ profile: { name: "Ana" } }], messages: [mensaje] } }] }] });
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRETO), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(cuerpo)));
  const firma = "sha256=" + Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return manejador(new Request("https://x/whatsapp", { method: "POST", body: cuerpo, headers: { "x-hub-signature-256": firma } }));
}

const mensajeClaude = (content: unknown[], stop_reason: string) => ({
  id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", content, stop_reason, stop_sequence: null,
  stop_details: null, usage: { input_tokens: 10, output_tokens: 10 },
});

// Los clientes HTTP (Supabase, Claude) dejan temporizadores internos: no son fugas de esta prueba.
const prueba = (name: string, fn: () => Promise<void>) => Deno.test({ name, fn, sanitizeOps: false, sanitizeResources: false });

prueba("verificación del webhook de Meta", async () => {
  const ok = await manejador(new Request("https://x/whatsapp?hub.mode=subscribe&hub.verify_token=verifica&hub.challenge=123"));
  assertEquals(await ok.text(), "123");
  const mal = await manejador(new Request("https://x/whatsapp?hub.mode=subscribe&hub.verify_token=otro&hub.challenge=1"));
  assertEquals(mal.status, 403);
});

prueba("rechaza mensajes sin firma de Meta", async () => {
  const r = await manejador(new Request("https://x/whatsapp", { method: "POST", body: "{}" }));
  assertEquals(r.status, 401);
});

prueba("texto → Claude consulta la agenda → se envían botones de horario", async () => {
  enviados.length = 0;
  const lunes = "2026-11-16"; // festivo: la herramienta no debe ofrecer nada ese día
  respuestasClaude = [
    mensajeClaude([{ type: "tool_use", id: "tu_1", name: "horarios_libres", input: { desde: lunes, hasta: "2026-11-17" } }], "tool_use"),
    mensajeClaude([{
      type: "text",
      text: JSON.stringify({
        respuesta: "Ana, tengo estos horarios para ti:", accion: "ofrecer_horarios", urgente: true, motivo: "dolor de muela",
        nombre_paciente: "Ana", cita_inicio: "",
        botones: [{ titulo: "Mar 17 · 8:00 am", inicio: "2026-11-17T08:00:00-05:00" }, { titulo: "Mar 17 · 8:30 am", inicio: "2026-11-17T08:30:00-05:00" }],
      }),
    }], "end_turn"),
  ];
  const r = await enviarWebhook({ id: "in1", from: "573001112233", type: "text", text: { body: "me duele mucho una muela" } });
  assertEquals(r.status, 200);
  const botones = enviados.find((e) => e.type === "interactive") as { interactive: { action: { buttons: unknown[] } } };
  assertEquals(botones.interactive.action.buttons.length, 2);
  // Urgente → también se avisa a la clínica con la plantilla.
  assert(enviados.some((e) => e.type === "template" && (e.template as { name: string }).name === "aviso_clinica"));
});

prueba("el mismo mensaje reenviado por Meta no se responde dos veces", async () => {
  enviados.length = 0;
  await enviarWebhook({ id: "in1", from: "573001112233", type: "text", text: { body: "me duele mucho una muela" } });
  assertEquals(enviados.length, 0);
});

prueba("tocar un botón → crea la cita, guarda la ficha, confirma y manda ubicación", async () => {
  enviados.length = 0;
  const id = JSON.stringify({ i: "2026-11-17T08:00:00-05:00", u: 1, m: "dolor de muela", n: "Ana" });
  await enviarWebhook({
    id: "in2", from: "573001112233", type: "interactive",
    interactive: { type: "button_reply", button_reply: { id, title: "Mar 17 · 8:00 am" } },
  });
  assertEquals(eventosCreados.length, 1);
  assertEquals((eventosCreados[0] as { summary: string }).summary, "🚨 Ana · dolor de muela");
  assertEquals((filasSheets[0] as string[]).slice(1, 7), ["Ana", "573001112233", "dolor de muela", "Sí", "2026-11-17 08:00", "evento123"]);
  assertEquals(enviados.map((e) => e.type), ["text", "location"]);
  assert(String((enviados[0].text as { body: string }).body).includes("martes 17 de noviembre"));
});

prueba("un horario fuera de atención no se reserva", async () => {
  enviados.length = 0;
  const id = JSON.stringify({ i: "2026-11-22T10:00:00-05:00", u: 0, m: "limpieza", n: "Ana" }); // domingo
  await enviarWebhook({
    id: "in3", from: "573001112233", type: "interactive",
    interactive: { type: "button_reply", button_reply: { id, title: "Dom 22" } },
  });
  assertEquals(eventosCreados.length, 1);
  assert(String((enviados[0].text as { body: string }).body).includes("ya no está disponible"));
});

/** Genera una clave RSA de prueba en formato PEM (la de una cuenta de servicio real viene en su JSON). */
async function clavePrivadaPrueba(): Promise<string> {
  const par = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", par.privateKey));
  let s = "";
  for (const b of der) s += String.fromCharCode(b);
  return `-----BEGIN PRIVATE KEY-----\n${btoa(s).match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----\n`;
}
