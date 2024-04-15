import { CityName } from "@/data/Cities";

export interface PlayerConfig {
  maxLot: number;
  bargain: PlayerConfigBargain;
  returnBargain: PlayerConfigBargain;
  prestige: PlayerConfigPrestige;
  roles: PlayerConfigRoles;
  onegraph: PlayerConfigOnegraph;
  productUnlockStatus: PlayerConfigProductUnlockStatus;
  nanoid?: string;
}

export interface PlayerConfigBargain {
  bargainPercent: number;
  raisePercent: number;
  bargainFatigue: number;
  raiseFatigue: number;
  disabled: boolean;
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
  showFatigue: boolean; // actually is showProfitPerFatigue
  /**
   * @deprecated
   */
  showProfitPerRestock: boolean;
  showGeneralProfitIndex: boolean;
  displayMode: "table" | "list";
}

export interface PlayerConfigProductUnlockStatus {
  [pdtName: string]: boolean; // false is not unlocked yet, by default all products are unlocked, this should be set to false if the product is not unlocked
}
