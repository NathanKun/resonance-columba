import { CityName } from "@/data/Cities";

export interface PrestigeConfig {
  level: number;
  generalTax: number;
  specialTax: {
    [cityName: CityName]: number;
  };
  extraBuy: number;
}
