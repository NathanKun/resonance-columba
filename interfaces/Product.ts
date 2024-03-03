import { CityName } from "@/data/Cities";

export interface Product {
  city: string;
  name: string;
  price: number;
  type: ProductType;
  prices: {
    [key: CityName]: number | null;
  };
}

export enum ProductType {
  Normal,
  Special,
}
