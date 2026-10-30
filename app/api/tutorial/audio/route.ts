import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import {
  AUDIO_DIR,
  AUDIO_URL_PREFIX,
  audioPathFromUrl,
  canWriteProject,
  forbidden,
  safeName,
} from "@/lib/tutorial/server";

const MAX_BYTES = 20 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/aac": ".aac",
};

/** Salva o áudio de um passo em public/tutorial/audio e devolve a URL. */
export async function POST(request: Request) {
  if (!canWriteProject()) return forbidden();

  const form = await request.formData();
  const file = form.get("file");
  const stepId = String(form.get("stepId") ?? "passo");
  if (!(file instanceof File)) return Response.json({ error: "Envie um arquivo." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Áudio maior que 20 MB." }, { status: 400 });

  const ext = EXTENSIONS[file.type] ?? path.extname(file.name).toLowerCase();
  if (!file.type.startsWith("audio/") || !/^\.[a-z0-9]{2,4}$/.test(ext)) {
    return Response.json({ error: "O arquivo precisa ser um áudio (MP3, WAV, OGG...)." }, { status: 400 });
  }

  // Nome novo a cada envio, para o navegador não tocar uma versão em cache.
  const name = `${safeName(stepId)}-${Date.now().toString(36)}${ext}`;
  await mkdir(AUDIO_DIR, { recursive: true });
  await writeFile(path.join(AUDIO_DIR, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ url: `${AUDIO_URL_PREFIX}${name}` });
}

/** Apaga um áudio que não é mais usado. */
export async function DELETE(request: Request) {
  if (!canWriteProject()) return forbidden();

  const url = new URL(request.url).searchParams.get("url") ?? "";
  const filePath = audioPathFromUrl(url);
  if (!filePath) return Response.json({ error: "Áudio inválido." }, { status: 400 });

  await unlink(filePath).catch(() => {});
  return Response.json({ ok: true });
}
