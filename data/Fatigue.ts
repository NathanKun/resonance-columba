import { Fatigue } from "@/interfaces/fatigue";

export const FATIGUES: Fatigue[] = [
  { cities: ["七号自由港", "阿妮塔能源研究所"], fatigue: 23 },
  { cities: ["澄明数据中心", "阿妮塔能源研究所"], fatigue: 28 },
  { cities: ["澄明数据中心", "七号自由港"], fatigue: 24 },
  { cities: ["修格里城", "阿妮塔能源研究所"], fatigue: 31 },
  { cities: ["修格里城", "七号自由港"], fatigue: 26 },
  { cities: ["修格里城", "澄明数据中心"], fatigue: 23 },
  { cities: ["铁盟哨站", "阿妮塔能源研究所"], fatigue: 34 },
  { cities: ["铁盟哨站", "七号自由港"], fatigue: 30 },
  { cities: ["铁盟哨站", "澄明数据中心"], fatigue: 23 },
  { cities: ["铁盟哨站", "修格里城"], fatigue: 23 },
  { cities: ["荒原站", "阿妮塔能源研究所"], fatigue: 38 },
  { cities: ["荒原站", "七号自由港"], fatigue: 33 },
  { cities: ["荒原站", "澄明数据中心"], fatigue: 26 },
  { cities: ["荒原站", "修格里城"], fatigue: 23 },
  { cities: ["荒原站", "铁盟哨站"], fatigue: 23 },
  { cities: ["曼德矿场", "阿妮塔能源研究所"], fatigue: 39 },
  { cities: ["曼德矿场", "七号自由港"], fatigue: 34 },
  { cities: ["曼德矿场", "澄明数据中心"], fatigue: 27 },
  { cities: ["曼德矿场", "修格里城"], fatigue: 23 },
  { cities: ["曼德矿场", "铁盟哨站"], fatigue: 23 },
  { cities: ["曼德矿场", "荒原站"], fatigue: 23 },
  { cities: ["淘金乐园", "阿妮塔能源研究所"], fatigue: 44 },
  { cities: ["淘金乐园", "七号自由港"], fatigue: 39 },
  { cities: ["淘金乐园", "澄明数据中心"], fatigue: 32 },
  { cities: ["淘金乐园", "修格里城"], fatigue: 26 },
  { cities: ["淘金乐园", "铁盟哨站"], fatigue: 23 },
  { cities: ["淘金乐园", "荒原站"], fatigue: 24 },
  { cities: ["淘金乐园", "曼德矿场"], fatigue: 23 },
  { cities: ["阿妮塔战备工厂", "曼德矿场"], fatigue: 31 },
  { cities: ["阿妮塔战备工厂", "澄明数据中心"], fatigue: 23 },
  { cities: ["阿妮塔战备工厂", "阿妮塔能源研究所"], fatigue: 23 },
  { cities: ["阿妮塔战备工厂", "荒原站"], fatigue: 30 },
  { cities: ["阿妮塔战备工厂", "七号自由港"], fatigue: 23 },
  { cities: ["阿妮塔战备工厂", "淘金乐园"], fatigue: 36 },
  { cities: ["阿妮塔战备工厂", "铁盟哨站"], fatigue: 26 },
  { cities: ["阿妮塔战备工厂", "修格里城"], fatigue: 23 },
];

export const findFatigue = (fromCity: string, toCity: string): number => {
  const fatigue = FATIGUES.find((f) => f.cities.includes(fromCity) && f.cities.includes(toCity))?.fatigue ?? 0;
  return fatigue;
};
