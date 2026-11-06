// Transcripción de notas de voz con la API de OpenAI (Claude no recibe audio).
import { envOpcional } from "./env.ts";

/** Devuelve el texto de la nota de voz, o null si no hay clave de OpenAI configurada. */
export async function transcribir(audio: Blob, tipo: string): Promise<string | null> {
  const clave = envOpcional("OPENAI_API_KEY");
  if (!clave) return null;
  const extension = tipo.includes("mpeg") ? "mp3" : tipo.includes("mp4") ? "m4a" : "ogg";
  const form = new FormData();
  form.append("file", new File([audio], `nota.${extension}`, { type: tipo }));
  form.append("model", "whisper-1");
  form.append("language", "es");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Transcripción falló ${r.status}: ${await r.text()}`);
  const { text } = await r.json();
  return String(text ?? "").trim();
}
