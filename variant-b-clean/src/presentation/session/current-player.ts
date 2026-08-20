import { redirect } from "next/navigation";

import { auth } from "@/src/composition-root";

import { playerProfilePath } from "../routes";
import type { SessionPlayer } from "./session-player";

export async function getCurrentPlayer(): Promise<SessionPlayer | null> {
  const session = await auth();
  const id = session?.user?.id;
  const name = session?.user?.name;

  if (!id || !name) {
    return null;
  }

  return { id, name };
}

export async function requireCurrentPlayer(
  callbackUrl: string,
): Promise<SessionPlayer> {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return player;
}

export async function redirectIfSignedIn(): Promise<void> {
  const player = await getCurrentPlayer();

  if (player) {
    redirect(playerProfilePath(player.id));
  }
}
