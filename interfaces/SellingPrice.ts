export interface SellingPrice {
  product: string;
  sellingCity: string;
  trend: Trend;
  variation: number; // percentage
  sellingPrice: number;
  time: string;
}

export const trends = ["up", "down"] as const;
export type Trend = (typeof trends)[number];
