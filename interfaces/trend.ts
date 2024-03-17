export const trends = ["up", "down"] as const;
export type Trend = (typeof trends)[number];
export type LbTrend = 1 | 0;
