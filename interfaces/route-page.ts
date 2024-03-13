import { CityName } from "@/data/Cities";
import { PlayerConfig } from "./player-config";

export interface Buy {
  fromCity: CityName;
  product: string;
  buyPrice: number;
  buyLot: number;
}

export interface Exchange extends Buy {
  toCity: CityName;
  sellPrice: number;
  singleProfit: number;
  lotProfit: number;
}

export interface CityProductProfitAccumulatedExchange extends Exchange {
  // not restock
  accumulatedProfit: number;
  loss: boolean; // true if acculated a 0 or negative profit
  accumulatedLot: number;

  // restock
  restockCount: number;
  restockAccumulatedProfit: number;
  restockAccumulatedLot: number;

  // fatigue
  fatigue?: number;
  profitPerFatigue?: number;

  isForFillCargo?: boolean;
}

export interface CityGroupedExchanges {
  [fromCity: CityName]: {
    [toCity: CityName]: CityProductProfitAccumulatedExchange[];
  };
}

export interface OnegraphRecommendations {
  [fromCity: string]: {
    [toCity: string]: OnegraphCityRecommendation;
  };
}

export interface OnegraphCityRecommendation {
  goExchanges: CityProductProfitAccumulatedExchange[];
  returnExchanges?: CityProductProfitAccumulatedExchange[];
}
export interface OneGraphRouteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: OneGraphRouteDialogData;
}

export interface OneGraphRouteDialogData {
  fromCity: string;
  toCity: string;
  onegraphData: OnegraphCityRecommendation;
  playerConfig: PlayerConfig;
}
