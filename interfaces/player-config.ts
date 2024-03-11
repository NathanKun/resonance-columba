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
}