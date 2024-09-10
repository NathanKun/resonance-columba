import { Fatigue } from "@/interfaces/fatigue";
import { PlayerConfigRoles } from "@/interfaces/player-config";

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
  { cities: ["阿妮塔发射中心", "淘金乐园"], fatigue: 49 },
  { cities: ["阿妮塔发射中心", "铁盟哨站"], fatigue: 40 },
  { cities: ["阿妮塔发射中心", "修格里城"], fatigue: 37 },
  { cities: ["阿妮塔发射中心", "阿妮塔战备工厂"], fatigue: 28 },
  { cities: ["海角城", "修格里城"], fatigue: 41 },
  { cities: ["海角城", "铁盟哨站"], fatigue: 45 },
  { cities: ["海角城", "七号自由港"], fatigue: 32 },
  { cities: ["海角城", "澄明数据中心"], fatigue: 39 },
  { cities: ["海角城", "阿妮塔战备工厂"], fatigue: 32 },
  { cities: ["海角城", "阿妮塔能源研究所"], fatigue: 24 },
  { cities: ["海角城", "荒原站"], fatigue: 48 },
  { cities: ["海角城", "曼德矿场"], fatigue: 43 },
  { cities: ["海角城", "淘金乐园"], fatigue: 41 },
  { cities: ["海角城", "阿妮塔发射中心"], fatigue: 32 },
];

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
