import { CityName } from "@/data/Cities";

export interface Product {
  name: string;
  buyPrices: {
    [city: CityName]: number | null; // buy price for buyable products, reference price for craftable products
  };
  buyLot?: {
    [city: CityName]: number | null; // no buyLot for craftable products
  };
  sellPrices: {
    [city: CityName]: number | null; // base sell price
  };
  craft?: {
    static?: number; // static price
    [pdtName: string]: number | undefined; // dynamic price, componentName => number of components
  };
}

export enum ProductType {
  Normal,
  Special,
}
