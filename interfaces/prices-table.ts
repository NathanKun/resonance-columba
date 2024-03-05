import { CityName } from "@/data/Cities";

export interface ProductPrice {
  variation: number;
  trend: string; // up arrow, down arrow, or empty
  timeDiffInMin: string; // e.g. 5分钟前
  singleProfit: number;
  lotProfit: number;
}

export interface ProductRow {
  sourceCity: CityName;
  buyableCities: CityName[];
  productName: string;
  source?: ProductPrice;
  targetCity: {
    [key: CityName]: ProductPrice;
  };
  craftable: boolean;
}

export interface SelectedCities {
  sourceCities: CityName[];
  targetCities: CityName[];
}
