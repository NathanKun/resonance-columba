import { Fatigue } from "@/interfaces/fatigue";
import { PlayerConfigRoles } from "@/interfaces/player-config";

// 200KM内24疲劳，之后每增加20KM增加1疲劳，向上取整
const FATIGUES: Fatigue[] = [
  { cities: ["七号自由港", "阿妮塔能源研究所"], fatigue: 24 },
  { cities: ["澄明数据中心", "阿妮塔能源研究所"], fatigue: 29 },
  { cities: ["澄明数据中心", "七号自由港"], fatigue: 25 },
  { cities: ["修格里城", "阿妮塔能源研究所"], fatigue: 32 },
  { cities: ["修格里城", "七号自由港"], fatigue: 27 },
  { cities: ["修格里城", "澄明数据中心"], fatigue: 24 },
  { cities: ["铁盟哨站", "阿妮塔能源研究所"], fatigue: 35 },
  { cities: ["铁盟哨站", "七号自由港"], fatigue: 31 },
  { cities: ["铁盟哨站", "澄明数据中心"], fatigue: 24 },
  { cities: ["铁盟哨站", "修格里城"], fatigue: 24 },
  { cities: ["荒原站", "阿妮塔能源研究所"], fatigue: 39 },
  { cities: ["荒原站", "七号自由港"], fatigue: 34 },
  { cities: ["荒原站", "澄明数据中心"], fatigue: 27 },
  { cities: ["荒原站", "修格里城"], fatigue: 24 },
  { cities: ["荒原站", "铁盟哨站"], fatigue: 24 },
  { cities: ["曼德矿场", "阿妮塔能源研究所"], fatigue: 40 },
  { cities: ["曼德矿场", "七号自由港"], fatigue: 35 },
  { cities: ["曼德矿场", "澄明数据中心"], fatigue: 28 },
  { cities: ["曼德矿场", "修格里城"], fatigue: 24 },
  { cities: ["曼德矿场", "铁盟哨站"], fatigue: 24 },
  { cities: ["曼德矿场", "荒原站"], fatigue: 24 },
  { cities: ["淘金乐园", "阿妮塔能源研究所"], fatigue: 45 },
  { cities: ["淘金乐园", "七号自由港"], fatigue: 40 },
  { cities: ["淘金乐园", "澄明数据中心"], fatigue: 33 },
  { cities: ["淘金乐园", "修格里城"], fatigue: 27 },
  { cities: ["淘金乐园", "铁盟哨站"], fatigue: 24 },
  { cities: ["淘金乐园", "荒原站"], fatigue: 25 },
  { cities: ["淘金乐园", "曼德矿场"], fatigue: 24 },
  { cities: ["阿妮塔战备工厂", "曼德矿场"], fatigue: 32 },
  { cities: ["阿妮塔战备工厂", "澄明数据中心"], fatigue: 24 },
  { cities: ["阿妮塔战备工厂", "阿妮塔能源研究所"], fatigue: 24 },
  { cities: ["阿妮塔战备工厂", "荒原站"], fatigue: 31 },
  { cities: ["阿妮塔战备工厂", "七号自由港"], fatigue: 24 },
  { cities: ["阿妮塔战备工厂", "淘金乐园"], fatigue: 37 },
  { cities: ["阿妮塔战备工厂", "铁盟哨站"], fatigue: 27 },
  { cities: ["阿妮塔战备工厂", "修格里城"], fatigue: 24 },
  { cities: ["阿妮塔发射中心", "曼德矿场"], fatigue: 45 },
  { cities: ["阿妮塔发射中心", "澄明数据中心"], fatigue: 34 },
  { cities: ["阿妮塔发射中心", "阿妮塔能源研究所"], fatigue: 24 },
  { cities: ["阿妮塔发射中心", "荒原站"], fatigue: 44 },
  { cities: ["阿妮塔发射中心", "七号自由港"], fatigue: 28 },
  { cities: ["阿妮塔发射中心", "淘金乐园"], fatigue: 50 },
  { cities: ["阿妮塔发射中心", "铁盟哨站"], fatigue: 40 },
  { cities: ["阿妮塔发射中心", "修格里城"], fatigue: 37 },
  { cities: ["阿妮塔发射中心", "阿妮塔战备工厂"], fatigue: 27 },
  { cities: ["海角城", "修格里城"], fatigue: 41 },
  { cities: ["海角城", "铁盟哨站"], fatigue: 45 },
  { cities: ["海角城", "七号自由港"], fatigue: 32 },
  { cities: ["海角城", "澄明数据中心"], fatigue: 39 },
  { cities: ["海角城", "阿妮塔战备工厂"], fatigue: 32 },
  { cities: ["海角城", "阿妮塔能源研究所"], fatigue: 24 },
  { cities: ["海角城", "荒原站"], fatigue: 48 },
  { cities: ["海角城", "曼德矿场"], fatigue: 49 },
  { cities: ["海角城", "淘金乐园"], fatigue: 54 },
  { cities: ["海角城", "阿妮塔发射中心"], fatigue: 32 },
  { cities: ["云岫桥基地", "修格里城"], fatigue: 28 },
  { cities: ["云岫桥基地", "铁盟哨站"], fatigue: 25 },
  { cities: ["云岫桥基地", "七号自由港"], fatigue: 41 },
  { cities: ["云岫桥基地", "澄明数据中心"], fatigue: 34 },
  { cities: ["云岫桥基地", "阿妮塔战备工厂"], fatigue: 38 },
  { cities: ["云岫桥基地", "阿妮塔能源研究所"], fatigue: 46 },
  { cities: ["云岫桥基地", "荒原站"], fatigue: 24 },
  { cities: ["云岫桥基地", "曼德矿场"], fatigue: 27 },
  { cities: ["云岫桥基地", "淘金乐园"], fatigue: 32 },
  { cities: ["云岫桥基地", "阿妮塔发射中心"], fatigue: 51 },
  { cities: ["云岫桥基地", "海角城"], fatigue: 55 },
  { cities: ["汇流塔", "修格里城"], fatigue: 45 },
  { cities: ["汇流塔", "铁盟哨站"], fatigue: 48 },
  { cities: ["汇流塔", "七号自由港"], fatigue: 36 },
  { cities: ["汇流塔", "澄明数据中心"], fatigue: 42 },
  { cities: ["汇流塔", "阿妮塔战备工厂"], fatigue: 35 },
  { cities: ["汇流塔", "阿妮塔能源研究所"], fatigue: 28 },
  { cities: ["汇流塔", "荒原站"], fatigue: 52 },
  { cities: ["汇流塔", "曼德矿场"], fatigue: 53 },
  { cities: ["汇流塔", "淘金乐园"], fatigue: 58 },
  { cities: ["汇流塔", "阿妮塔发射中心"], fatigue: 36 },
  { cities: ["汇流塔", "海角城"], fatigue: 24 },
  { cities: ["汇流塔", "云岫桥基地"], fatigue: 59 },

  { cities: ["远星大桥", "修格里城"], fatigue: 42 },
  { cities: ["远星大桥", "铁盟哨站"], fatigue: 48 },
  { cities: ["远星大桥", "七号自由港"], fatigue: 33 },
  { cities: ["远星大桥", "澄明数据中心"], fatigue: 39 },
  { cities: ["远星大桥", "阿妮塔战备工厂"], fatigue: 33 },
  { cities: ["远星大桥", "阿妮塔能源研究所"], fatigue: 25 },
  { cities: ["远星大桥", "荒原站"], fatigue: 49 },
  { cities: ["远星大桥", "曼德矿场"], fatigue: 49 },
  { cities: ["远星大桥", "淘金乐园"], fatigue: 55 },
  { cities: ["远星大桥", "阿妮塔发射中心"], fatigue: 33 },
  { cities: ["远星大桥", "海角城"], fatigue: 25 },
  { cities: ["远星大桥", "云岫桥基地"], fatigue: 56 },
  { cities: ["远星大桥", "汇流塔"], fatigue: 29 },
];

// 200KM内24疲劳，之后每增加20KM增加1疲劳，向上取整
const calculateFatigue = (distance: number): number => {
  if (distance <= 200) {
    return 24;
  }

  return 24 + Math.ceil((distance - 200) / 20);
};

export const findFatigue = (fromCity: string, toCity: string, playerConfigRoles: PlayerConfigRoles): number => {
  let fatigue = FATIGUES.find((f) => f.cities.includes(fromCity) && f.cities.includes(toCity))?.fatigue ?? 0;
  if (fatigue === 0) {
    return fatigue;
  }

  // find if player has resonance level 1 波克士
  if (playerConfigRoles["波克士"]?.resonance === 1) {
    fatigue -= 1;
  }

  return fatigue;
};
