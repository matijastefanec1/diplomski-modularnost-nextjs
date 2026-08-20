"use server";

import { signOut } from "@/src/composition-root";

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
