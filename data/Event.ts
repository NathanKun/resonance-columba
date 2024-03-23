import { ResonanceSkill } from "@/interfaces/role-skill";

type GameEvent = ResonanceSkill & {
  taxVariation: {
    product?: {
      [key: string]: number; // ex: 红茶: -5 for -5% tax
    };
    city?: {
      [key: string]: number;
    };
  };
};

export const EVENTS: GameEvent[] = [
  {
    buyMore: {
      product: {
        红茶: 50,
      },
    },
    taxVariation: {
      product: {
        红茶: -0.05,
      },
    },
  },
];
