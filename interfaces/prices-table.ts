import { CityName } from "@/data/Cities";

export interface ProductRowCityPrice {
  variation: number;
  trend: string; // up arrow, down arrow, or empty
  timeDiff: string; // e.g. 5分钟前
  singleProfit: number;
  price: number;
}

export interface ProductRow {
  sourceCity: CityName;
  buyableCities: CityName[];
  productName: string;
  source?: ProductRowCityPrice;
  targetCity: {
    [key: CityName]: ProductRowCityPrice;
  };
  craftable: boolean;
}

export interface SelectedCities {
  sourceCities: CityName[];
  targetCities: CityName[];
}

export interface PricesTableHiddenProducts {
  [city: CityName]: String[];
}
