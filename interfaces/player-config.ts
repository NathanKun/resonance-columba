import { CityName } from "@/data/Cities";

export interface PlayerConfig {
  maxLot: number;
  bargain: PlayerConfigBargain;
  prestige: PlayerConfigPrestige;
  roles: PlayerConfigRoles;
  onegraph: PlayerConfigOnegraph;
}

export interface PlayerConfigBargain {
  bargainPercent: number;
  raisePercent: number;
  bargainFatigue: number;
  raiseFatigue: number;
}

export interface PlayerConfigPrestige {
  [cityName: CityName]: number;
}

export interface PlayerConfigRoles {
  [roleName: string]: {
    resonance: number;
  };
}

export interface PlayerConfigOnegraph {
  maxRestock: number;
  goAndReturn: boolean;
  showFatigue: boolean;
}
