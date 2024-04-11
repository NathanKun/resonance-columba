import { CityName } from "@/data/Cities";

export interface Product {
  name: string;
  buyPrices: {
    [city: CityName]: number | null; // buy price for buyable products, 99999 for craft only products
  };
  buyLot?: {
    [city: CityName]: number | null; // no buyLot for craft only products
  };
  sellPrices: {
    [city: CityName]: number | null; // base sell price
  };
  craft?: {
    [pdtName: string]: number | undefined; // dynamic price, componentName => number of components
  };
  type: ProductType;
}

export const ProductTypes = ["Normal", "Special", "Craft"] as const;
export type ProductType = (typeof ProductTypes)[number];

export interface ProductUnlockConditions {
  [cityName: CityName]: {
    [pdtName: string]: {
      invest: number;
    };
  };
}
