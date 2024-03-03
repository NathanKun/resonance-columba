export interface SellingPrice {
  product: string;
  sellingCity: string;
  trend: Trend;
  variation: number; // percentage
  sellingPrice: number;
  time: string;
}

const trend = ["up", "down"];
export type Trend = (typeof trend)[number];
