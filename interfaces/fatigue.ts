import { CityName } from "@/data/Cities";

export interface Fatigue {
  cities: CityName[]; // must be length 2
  fatigue?: number;
}
