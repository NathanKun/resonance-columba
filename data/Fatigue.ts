import { Fatigue } from "@/interfaces/fatigue";

/*
;阿妮塔战备工厂;阿妮塔能源研究所;七号自由港;澄明数据中心;修格里城;铁盟哨站;荒原站;曼德矿场;淘金乐园
阿妮塔战备工厂;;;;;;;;;
阿妮塔能源研究所;;;;;;;;;
七号自由港;;23;;;;;;;
澄明数据中心;;28;24;;;;;;
修格里城;;31;26;23;;;;;
铁盟哨站;;34;30;23;23;;;;
荒原站;;38;33;26;23;23;;;
曼德矿场;;39;34;27;26;23;23;;
淘金乐园;;44;39;32;26;23;24;23;

*/
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
  { cities: ["曼德矿场", "修格里城"], fatigue: 26 },
  { cities: ["曼德矿场", "铁盟哨站"], fatigue: 23 },
  { cities: ["曼德矿场", "荒原站"], fatigue: 23 },
  { cities: ["淘金乐园", "阿妮塔能源研究所"], fatigue: 44 },
  { cities: ["淘金乐园", "七号自由港"], fatigue: 39 },
  { cities: ["淘金乐园", "澄明数据中心"], fatigue: 32 },
  { cities: ["淘金乐园", "修格里城"], fatigue: 26 },
  { cities: ["淘金乐园", "铁盟哨站"], fatigue: 23 },
  { cities: ["淘金乐园", "荒原站"], fatigue: 24 },
  { cities: ["淘金乐园", "曼德矿场"], fatigue: 23 },
];
