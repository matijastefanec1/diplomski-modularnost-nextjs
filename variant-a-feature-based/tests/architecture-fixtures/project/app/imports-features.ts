import { matchesRule } from "../features/matches";
import { playersRule } from "../features/players";

export const validFeatureComposition = [playersRule, matchesRule];