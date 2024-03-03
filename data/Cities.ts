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
];

export type CityName = (typeof cityList)[number];
export const cities: CityName[] = cityList;
