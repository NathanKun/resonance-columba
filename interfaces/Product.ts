import { CityName } from "@/data/Cities";

export interface Product {
  name: string;
  buyPrices: {
    [key: CityName]: number | null;
  };
  buyLot?: {
    [key: CityName]: number | null;
  };
  sellPrices: {
    [key: CityName]: number | null;
  };
}

export enum ProductType {
  Normal,
  Special,
}
