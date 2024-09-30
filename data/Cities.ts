import { CITY_ATTACH_LIST } from "resonance-data-columba/dist/columbabuild";

const cityList = [
  "修格里城",
  "铁盟哨站",
  "七号自由港",
  "澄明数据中心",
  "阿妮塔战备工厂",
  "阿妮塔能源研究所",
  "荒原站",
  "曼德矿场",
  "淘金乐园",
  "阿妮塔发射中心",
  "海角城",
  "云岫桥基地",
];

export type CityName = (typeof cityList)[number];
export const CITIES: CityName[] = cityList;

const cityAttachList: { [key: CityName]: CityName } = CITY_ATTACH_LIST;
export const CITY_BELONGS_TO = cityAttachList;
