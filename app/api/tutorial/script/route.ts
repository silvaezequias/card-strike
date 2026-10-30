import { mkdir, writeFile } from "node:fs/promises";
import { SCRIPT_FILE, TUTORIAL_DIR, canWriteProject, forbidden } from "@/lib/tutorial/server";
import { TutorialScript } from "@/lib/tutorial/types";

/** Diz ao editor se dá para salvar no projeto (só em desenvolvimento). */
export async function GET() {
  return Response.json({ editable: canWriteProject() });
}

/** Grava o roteiro em public/tutorial/script.json. */
export async function POST(request: Request) {
  if (!canWriteProject()) return forbidden();

  const script = (await request.json()) as TutorialScript;
  if (script?.version !== 1 || !Array.isArray(script.steps)) {
    return Response.json({ error: "Roteiro inválido." }, { status: 400 });
  }

  await mkdir(TUTORIAL_DIR, { recursive: true });
  await writeFile(SCRIPT_FILE, `${JSON.stringify(script, null, 2)}\n`, "utf8");
  return Response.json({ ok: true });
}
