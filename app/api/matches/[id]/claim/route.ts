import { claimAbandon } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Oponente sumido há mais de 60 s: cobra a vitória por W.O. */
export const POST = route<{ id: string }>(async ({ params }) => {
  await claimAbandon(await requireUser(), params.id);
});
