import { CityName } from "@/data/Cities";

export interface RoleSkill {
  buyMore: {
    products: string[];
    cities: {
      [key: CityName]: {};
    };
  };
}
