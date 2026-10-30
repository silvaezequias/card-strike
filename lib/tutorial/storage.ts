import { DEFAULT_TUTORIAL } from "./default-script";
import { TutorialScript } from "./types";

/* ═══════════════════════════════════════════════
   ROTEIRO DO TUTORIAL NO PROJETO
   O roteiro fica em public/tutorial/script.json e os
   áudios em public/tutorial/audio — entram no commit e
   valem no jogo publicado. O editor grava por rotas de
   API que só funcionam com `npm run dev`.
   ═══════════════════════════════════════════════ */

const SCRIPT_URL = "/tutorial/script.json";

const isScript = (data: unknown): data is TutorialScript =>
  !!data && (data as TutorialScript).version === 1 && Array.isArray((data as TutorialScript).steps);

/** Lê o roteiro do projeto; sem arquivo, usa o roteiro padrão do código. */
export const loadScript = async (): Promise<TutorialScript> => {
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (isScript(data)) return data;
    }
  } catch {
    // Sem rede ou arquivo inválido: cai no padrão.
  }
  return structuredClone(DEFAULT_TUTORIAL);
};

const failure = async (res: Response) => {
  const body = await res.json().catch(() => null);
  return new Error(body?.error ?? `Falha ao salvar (${res.status}).`);
};

/** true quando o servidor aceita gravar no projeto (npm run dev). */
export const canEditProject = async () => {
  try {
    const res = await fetch("/api/tutorial/script", { cache: "no-store" });
    return res.ok && (await res.json()).editable === true;
  } catch {
    return false;
  }
};

export const saveScript = async (script: TutorialScript) => {
  const res = await fetch("/api/tutorial/script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(script),
  });
  if (!res.ok) throw await failure(res);
};

/** Envia o áudio de um passo e devolve a URL pública do arquivo salvo. */
export const uploadAudio = async (stepId: string, file: File): Promise<string> => {
  const form = new FormData();
  form.append("stepId", stepId);
  form.append("file", file);
  const res = await fetch("/api/tutorial/audio", { method: "POST", body: form });
  if (!res.ok) throw await failure(res);
  return (await res.json()).url as string;
};

export const deleteAudio = async (url: string) => {
  const res = await fetch(`/api/tutorial/audio?url=${encodeURIComponent(url)}`, { method: "DELETE" });
  if (!res.ok) throw await failure(res);
};

export const defaultScript = (): TutorialScript => structuredClone(DEFAULT_TUTORIAL);
