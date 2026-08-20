import { prisma } from "@/shared/lib/prisma";

export type SelectablePlayer = {
  id: string;
  name: string;
};

export function loadSelectablePlayers(
  reporterId: string,
): Promise<SelectablePlayer[]> {
  return prisma.player.findMany({
    where: { id: { not: reporterId } },
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}
