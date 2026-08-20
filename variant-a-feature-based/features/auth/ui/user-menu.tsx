import Link from "next/link";

import { signOutAction } from "../actions/sign-out-action";
import { playerProfilePath, type SessionPlayer } from "../lib/session";

type UserMenuProps = {
  player: SessionPlayer;
};

export function UserMenu({ player }: UserMenuProps) {
  const initial = player.name.trim().slice(0, 1).toUpperCase();

  return (
    <details data-testid="user-menu" className="relative">
      <summary
        aria-label={`Korisnički izbornik: ${player.name}`}
        className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden"
      >
        {initial}
      </summary>

      <div className="absolute right-0 z-10 mt-1 flex w-52 flex-col gap-1 rounded-card border border-border bg-surface p-2 shadow-card">
        <Link
          data-testid="user-menu-profile"
          href={playerProfilePath(player.id)}
          className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-soft hover:text-primary"
        >
          Moj profil
        </Link>

        <form action={signOutAction}>
          <button
            data-testid="sign-out-button"
            type="submit"
            className="inline-flex min-h-11 w-full items-center rounded-control px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-soft hover:text-primary"
          >
            Odjava
          </button>
        </form>
      </div>
    </details>
  );
}
