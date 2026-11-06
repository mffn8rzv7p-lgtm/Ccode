// Google Calendar y Google Sheets con una cuenta de servicio (sin librerías: JWT firmado con WebCrypto).
import { env } from "./env.ts";
import type { Ocupado } from "./fechas.ts";

const ALCANCES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets";
let tokenEnCache: { valor: string; vence: number } | null = null;

const b64url = (datos: Uint8Array | string) => {
  const bytes = typeof datos === "string" ? new TextEncoder().encode(datos) : datos;
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function tokenGoogle(): Promise<string> {
  if (tokenEnCache && tokenEnCache.vence > Date.now() + 60_000) return tokenEnCache.valor;
  const cuenta = JSON.parse(env("GOOGLE_SERVICE_ACCOUNT_JSON"));
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const carga = b64url(JSON.stringify({
    iss: cuenta.client_email,
    scope: ALCANCES,
    aud: "https://oauth2.googleapis.com/token",
    iat: ahora,
    exp: ahora + 3600,
  }));
  const pem = String(cuenta.private_key).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const clave = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const firma = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", clave, new TextEncoder().encode(`${cabecera}.${carga}`)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${cabecera}.${carga}.${b64url(firma)}`,
    }),
  });
  const datos = await r.json();
  if (!r.ok) throw new Error(`Google no entregó el token: ${JSON.stringify(datos)}`);
  tokenEnCache = { valor: datos.access_token, vence: Date.now() + datos.expires_in * 1000 };
  return datos.access_token;
}

async function google(url: string, init: RequestInit = {}) {
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${await tokenGoogle()}`, "Content-Type": "application/json", ...init.headers },
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Google ${r.status} en ${url.split("?")[0]}: ${JSON.stringify(datos)}`);
  return datos;
}

// ---------- Calendar ----------

const CAL = "https://www.googleapis.com/calendar/v3";
const calendario = () => encodeURIComponent(env("GOOGLE_CALENDAR_ID"));

/** Horarios ocupados del calendario de la doctora entre dos fechas ISO. */
export async function ocupados(desde: string, hasta: string): Promise<Ocupado[]> {
  const id = env("GOOGLE_CALENDAR_ID");
  const datos = await google(`${CAL}/freeBusy`, {
    method: "POST",
    body: JSON.stringify({ timeMin: desde, timeMax: hasta, items: [{ id }] }),
  });
  const cal = datos.calendars?.[id];
  if (cal?.errors?.length) throw new Error(`No se pudo leer el calendario: ${JSON.stringify(cal.errors)}`);
  return cal?.busy ?? [];
}

export interface DatosCita {
  inicio: string;
  fin: string;
  nombre: string;
  telefono: string;
  motivo: string;
  urgente: boolean;
  direccion: string;
}

export async function crearCita(c: DatosCita): Promise<string> {
  const ev = await google(`${CAL}/calendars/${calendario()}/events`, {
    method: "POST",
    body: JSON.stringify({
      summary: `${c.urgente ? "🚨 " : ""}${c.nombre} · ${c.motivo}`,
      description:
        `Paciente: ${c.nombre}\nWhatsApp: +${c.telefono}\nMotivo: ${c.motivo}\nUrgente: ${c.urgente ? "Sí" : "No"}\n` +
        "Agendada por la Recepcionista IA",
      location: c.direccion,
      start: { dateTime: c.inicio },
      end: { dateTime: c.fin },
      // Datos ocultos que usa el recordatorio de la mañana.
      extendedProperties: { private: { origen: "recepcionista", telefono: c.telefono, nombre: c.nombre } },
    }),
  });
  return ev.id;
}

export interface EventoRecordatorio {
  telefono: string;
  nombre: string;
  inicio: string;
}

/** Citas agendadas por la recepcionista entre dos fechas. */
export async function citasAgendadas(desde: string, hasta: string): Promise<EventoRecordatorio[]> {
  const q = new URLSearchParams({
    timeMin: desde,
    timeMax: hasta,
    singleEvents: "true",
    orderBy: "startTime",
    privateExtendedProperty: "origen=recepcionista",
    maxResults: "250",
  });
  const datos = await google(`${CAL}/calendars/${calendario()}/events?${q}`);
  // deno-lint-ignore no-explicit-any
  return (datos.items ?? []).filter((e: any) => e.status !== "cancelled" && e.start?.dateTime).map((e: any) => ({
    telefono: e.extendedProperties?.private?.telefono ?? "",
    nombre: e.extendedProperties?.private?.nombre ?? "",
    inicio: e.start.dateTime,
  })).filter((e: EventoRecordatorio) => e.telefono);
}

// ---------- Sheets ----------

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
export const COLUMNAS = ["Registrado", "Nombre", "WhatsApp", "Motivo", "Urgente", "Cita", "Evento"] as const;
const RANGO = encodeURIComponent("Pacientes!A:G");

/** Agrega una fila a la pestaña "Pacientes" (en el orden de COLUMNAS). */
export async function guardarFicha(fila: string[]): Promise<void> {
  // RAW para que el teléfono no se convierta en número ni pierda ceros.
  await google(`${SHEETS}/${env("GOOGLE_SHEET_ID")}/values/${RANGO}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [fila] }),
  });
}

/** Todas las filas de la pestaña "Pacientes" como objetos { Registrado, Nombre, ... }. */
export async function leerFichas(): Promise<Record<string, string>[]> {
  const datos = await google(`${SHEETS}/${env("GOOGLE_SHEET_ID")}/values/${RANGO}`);
  const [encabezado, ...filas] = (datos.values ?? []) as string[][];
  if (!encabezado) return [];
  return filas.map((f) => Object.fromEntries(encabezado.map((col, i) => [col, f[i] ?? ""])));
}
