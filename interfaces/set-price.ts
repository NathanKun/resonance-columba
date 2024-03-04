import { CityName } from "@/data/Cities";
import { FieldValue } from "firebase-admin/firestore";
import { Trend } from "./SellingPrice";

export type ExchangeType = "buy" | "sell";

export interface SetPriceFirestoreRequest {
  [propPath: string]: {
    variation?: number;
    trend?: Trend;
    time: FieldValue;
  };
}

export interface SetPriceRequest {
  product: string;
  city: CityName;
  type: ExchangeType;
  variation?: number;
  trend?: Trend;
}
