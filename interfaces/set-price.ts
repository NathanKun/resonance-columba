import { CityName } from "@/data/Cities";
import { FieldValue } from "firebase-admin/firestore";
import { Trend } from "./trend";

export type ExchangeType = "buy" | "sell";

export interface SetPriceItem {
  variation?: number;
  trend?: Trend;
  time: FieldValue;
}

export interface SetPriceHistoryItem extends SetPriceItem {
  ip?: string;
}

export interface SetPriceFirestoreRequest {
  [propPath: string]: any;
}

export interface SetPriceRequest {
  product: string;
  city: CityName;
  type: ExchangeType;
  variation?: number;
  trend?: Trend;
}
