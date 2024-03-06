import { CityName } from "@/data/Cities";
import { Trend } from "./trend";

export interface FireStoreProductCityPrice {
  trend: Trend;
  variation: number;
  time: {
    _seconds: number;
    _nanoseconds: number;
  };
}

export interface FirestoreProductPrice {
  [city: CityName]: FireStoreProductCityPrice;
}

export interface FirestoreProduct {
  [type: string]: FirestoreProductPrice;
}

export interface FirestoreProducts {
  [pdtName: string]: FirestoreProduct;
}

export interface GetPricesResponse {
  data: FirestoreProducts;
}
