import { listSelectablePlayers } from "@/src/composition-root";

export type SelectablePlayer = {
  id: string;
  name: string;
};

export function loadSelectablePlayers(
  reporterId: string,
): Promise<SelectablePlayer[]> {
  return listSelectablePlayers.execute(reporterId);
}
