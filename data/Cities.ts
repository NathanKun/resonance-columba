import {
  CITIES as CITIES_IMPORT,
  CITY_ATTACH_LIST,
  CITY_WITH_PRESTIGE as CITY_WITH_PRESTIGE_IMPORT,
} from "resonance-data-columba/dist/columbabuild";

export type CityName = (typeof CITIES_IMPORT)[number];
export const CITIES: CityName[] = CITIES_IMPORT;

const cityAttachList: { [key: CityName]: CityName } = CITY_ATTACH_LIST;
export const CITY_BELONGS_TO = cityAttachList;

export const CITY_WITH_PRESTIGE: CityName[] = CITY_WITH_PRESTIGE_IMPORT;
