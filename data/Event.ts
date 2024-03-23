import { ResonanceSkill } from "@/interfaces/role-skill";

type GameEvent = ResonanceSkill;

export const EVENTS: GameEvent[] = [
  {
    buyMore: {
      product: {
        红茶: 50,
      },
    },
  },
];
