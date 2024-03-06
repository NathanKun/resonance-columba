export const trends = ["up", "down"] as const;
export type Trend = (typeof trends)[number];
