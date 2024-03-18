import { CityName } from "@/data/Cities";

export interface PlayerConfig {
  maxLot: number;

  bargain: {
    bargainPercent: number;
    raisePercent: number;
    bargainFatigue: number;
    raiseFatigue: number;
  };

  prestige: {
    [cityName: CityName]: number;
  };

  roles: {
    [roleName: string]: {
      resonance: number;
    };
  };

  onegraph: {
    maxRestock: number;
    goAndReturn: boolean;
    showFatigue: boolean;
  };
}
