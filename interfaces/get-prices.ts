import { CityName } from "@/data/Cities";
import { Trend } from "./trend";

export interface FirestoreProductPrice {
  [key: CityName]: {
    trend: Trend;
    variation: number;
    time: {
      _seconds: number;
      _nanoseconds: number;
    };
  };
}

export interface FirestoreProduct {
  [type: string]: FirestoreProductPrice;
}

export interface FirestoreProducts {
  [key: string]: FirestoreProduct;
}

export interface GetPricesResponse {
  data: FirestoreProducts;
}
