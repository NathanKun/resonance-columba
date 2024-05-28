import { CityName } from "@/data/Cities";

export interface FormulaProduce {
  product: string;
  num: number;
}

export interface PriceItem {
  price: number;
  city: CityName;
  variation: number;
}

export interface PriceItemCache {
  [product: string]: PriceItem;
}
