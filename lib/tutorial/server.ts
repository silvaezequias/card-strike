import path from "node:path";

/* ═══════════════════════════════════════════════
   GRAVAÇÃO DO TUTORIAL NO PROJETO (só no servidor)
   O editor grava em public/tutorial, que é servido
   como arquivo estático e entra no commit. Só funciona
   com `npm run dev`: em produção o disco é somente
   leitura e as rotas respondem 403.
   ═══════════════════════════════════════════════ */

export const TUTORIAL_DIR = path.join(process.cwd(), "public", "tutorial");
export const SCRIPT_FILE = path.join(TUTORIAL_DIR, "script.json");
export const AUDIO_DIR = path.join(TUTORIAL_DIR, "audio");
export const AUDIO_URL_PREFIX = "/tutorial/audio/";

export const canWriteProject = () => process.env.NODE_ENV === "development";

export const forbidden = () =>
  Response.json(
    { error: "O editor só salva no projeto rodando localmente (npm run dev)." },
    { status: 403 },
  );

/** Converte a URL pública de um áudio no caminho do arquivo, sem sair da pasta. */
export const audioPathFromUrl = (url: string) => {
  if (!url.startsWith(AUDIO_URL_PREFIX)) return null;
  const name = path.basename(url.slice(AUDIO_URL_PREFIX.length));
  if (!name || name !== url.slice(AUDIO_URL_PREFIX.length)) return null;
  return path.join(AUDIO_DIR, name);
};

/** Nome de arquivo seguro: só letras, números, hífen e ponto. */
export const safeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "audio";
