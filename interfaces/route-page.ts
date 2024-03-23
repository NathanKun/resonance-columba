import { CityName } from "@/data/Cities";
import { PlayerConfig } from "./player-config";
import { Product } from "./product";

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

export interface OneGraphRouteDialogV2Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: OneGraphRouteDialogDataV2;
}

export interface OneGraphRouteDialogDataV2 {
  stats: OnegraphBuyCombinationTwoWayStats;
  playerConfig: PlayerConfig;
  fromCity: CityName;
  toCity: CityName;
  goBargainDisabled: boolean;
  rtBargainDisabled: boolean;
}

export interface OnegraphPriceData {
  [fromCity: CityName]: {
    [toCity: CityName]: OnegraphPriceDataItem[];
  };
}

export interface OnegraphPriceDataItem {
  name: string;
  product: Product;
  priceData: any;
  buyPrice: number;
  buyLot: number;
  sellPrice: number;
  singleProfit: number;
}

export interface OnegraphBuyCombination {
  buyLot: number;
  name: string;
  profit: number;
}

export interface OnegraphBuyCombinationStats {
  combinations: OnegraphBuyCombination[];
  profit: number;
  restock: number;
  fatigue: number;
  profitPerFatigue: number;
  profitPerRestock: number;
  usedLot: number;
  lastNotWastingRestock: number; // if not wasting, this equals to restock, otherwise it is the last restock count that is not wasting
}

export interface OnegraphBuyCombinations {
  [fromCity: CityName]: {
    [toCity: CityName]: {
      [restock: number]: OnegraphBuyCombinationStats;
    };
  };
}

export interface OnegraphRecommendationsV2 {
  [fromCity: CityName]: {
    [toCity: CityName]: OnegraphBuyCombinationTwoWayStats;
  };
}

export interface OnegraphBuyCombinationTwoWayStats {
  simpleGo: OnegraphBuyCombinationStats;
  goAndReturn: OnegraphBuyCombinationStats[];
}
