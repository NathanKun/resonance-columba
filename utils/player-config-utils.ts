import { CITY_WITH_PRESTIGE } from "@/data/Cities";
import { EVENTS } from "@/data/Event";
import { PRODUCTS } from "@/data/Products";
import { ROLE_RESONANCE_SKILLS } from "@/data/RoleResonanceSkills";
import { PlayerConfig } from "@/interfaces/player-config";

export const isValidPlayerConfig = (config: any) => {
  if (!config) {
    return false;
  }

  if (typeof config !== "object") {
    return false;
  }

  if (Object.keys(config).length === 0) {
    return false;
  }

  if (
    Object.keys(config).filter(
      (key) =>
        ![
          "maxLot",
          "tradeLevel",
          "bargain",
          "returnBargain",
          "prestige",
          "roles",
          "onegraph",
          "nanoid",
          "productUnlockStatus",
          "events",
        ].includes(key)
    ).length > 0
  ) {
    return false;
  }

  if (
    config.maxLot !== undefined &&
    (typeof config.maxLot === "string" || isNaN(config.maxLot) || config.maxLot < 0 || config.maxLot > 5000)
  ) {
    return false;
  }

  if (
    config.tradeLevel !== undefined &&
    (typeof config.tradeLevel === "string" ||
      isNaN(config.tradeLevel) ||
      config.tradeLevel < 1 ||
      config.tradeLevel > 99)
  ) {
    return false;
  }

  if (config.bargain) {
    const bargain = config.bargain;
    if (!isBargainConfig(bargain)) {
      return false;
    }
  }

  if (config.returnBargain) {
    const returnBargain = config.returnBargain;
    if (!isBargainConfig(returnBargain)) {
      return false;
    }
  }

  if (config.prestige) {
    const prestige = config.prestige;
    if (Object.keys(prestige).filter((key) => !CITY_WITH_PRESTIGE.includes(key)).length > 0) {
      return false;
    }

    if (Object.keys(prestige).find((key) => isNaN(prestige[key]) || prestige[key] < 0 || prestige[key] > 20)) {
      return false;
    }
  }

  if (config.roles) {
    const roles = config.roles;
    const allRoleNames = Object.keys(ROLE_RESONANCE_SKILLS);
    if (Object.keys(roles).filter((key) => !allRoleNames.includes(key)).length > 0) {
      return false;
    }

    for (const roleName of Object.keys(roles)) {
      const role = roles[roleName];
      if (Object.keys(role).filter((key) => !["resonance"].includes(key)).length > 0) {
        return false;
      }

      if (isNaN(role.resonance) || role.resonance < 0 || role.resonance > 5) {
        return false;
      }
    }
  }

  if (config.onegraph) {
    const onegraph = config.onegraph;
    if (
      Object.keys(onegraph).filter(
        (key) =>
          ![
            "maxRestock",
            "goAndReturn",
            "showFatigue",
            "showProfitPerRestock",
            "showGeneralProfitIndex",
            "enableMultiConfig",
            "displayMode",
          ].includes(key)
      ).length > 0
    ) {
      return false;
    }

    if (
      onegraph.maxRestock !== undefined &&
      (typeof onegraph.maxRestock === "string" ||
        isNaN(onegraph.maxRestock) ||
        onegraph.maxRestock < 0 ||
        onegraph.maxRestock > 100)
    ) {
      return false;
    }

    if (onegraph.goAndReturn !== undefined && typeof onegraph.goAndReturn !== "boolean") {
      return false;
    }

    if (onegraph.showFatigue !== undefined && typeof onegraph.showFatigue !== "boolean") {
      return false;
    }

    if (onegraph.showProfitPerRestock !== undefined && typeof onegraph.showProfitPerRestock !== "boolean") {
      return false;
    }

    if (onegraph.showGeneralProfitIndex !== undefined && typeof onegraph.showGeneralProfitIndex !== "boolean") {
      return false;
    }

    if (onegraph.enableMultiConfig !== undefined && typeof onegraph.enableMultiConfig !== "boolean") {
      return false;
    }

    if (onegraph.displayMode !== undefined && onegraph.displayMode !== "table" && onegraph.displayMode !== "list") {
      return false;
    }
  }

  if (config.nanoid) {
    if (typeof config.nanoid !== "string") {
      return false;
    }

    if (config.nanoid.length !== 21) {
      return false;
    }
  }

  if (config.productUnlockStatus) {
    if (
      Object.keys(config.productUnlockStatus).filter((key) => typeof config.productUnlockStatus[key] !== "boolean")
        .length > 0
    ) {
      return false;
    }

    const pdtNames = PRODUCTS.map((pdt) => pdt.name);
    if (Object.keys(config.productUnlockStatus).filter((key) => !pdtNames.includes(key)).length > 0) {
      return false;
    }
  }

  if (config.events) {
    if (!isEventConfig(config.events)) {
      return false;
    }
  }

  return true;
};

const isBargainConfig = (bargain: any) => {
  const numKeys = ["bargainPercent", "raisePercent", "bargainFatigue", "raiseFatigue"];
  if (Object.keys(bargain).filter((key) => ![...numKeys, "disabled"].includes(key)).length > 0) {
    return false;
  }

  if (
    Object.keys(bargain)
      .filter((key) => numKeys.includes(key))
      .filter((key) => isNaN(bargain[key]) || bargain[key] < 0 || bargain[key] > 100).length > 0
  ) {
    return false;
  }

  if (typeof bargain.disabled !== "boolean") {
    return false;
  }

  return true;
};

const isEventConfig = (events: any) => {
  const configEventNames = Object.keys(events);
  const allEventNames = EVENTS.map((event) => event.name);
  if (configEventNames.filter((name) => !allEventNames.includes(name)).length > 0) {
    return false;
  }

  for (const eventName of configEventNames) {
    const event = events[eventName];
    if (Object.keys(event).filter((key) => !["activated"].includes(key)).length > 0) {
      return false;
    }

    if (typeof event.activated !== "boolean") {
      return false;
    }
  }

  return true;
};

export const mergePlayerConfigs = (newConfig: any): PlayerConfig => {
  if (!newConfig) {
    return INITIAL_PLAYER_CONFIG;
  }

  return {
    ...INITIAL_PLAYER_CONFIG,
    ...newConfig,
    bargain: { ...INITIAL_PLAYER_CONFIG.bargain, ...newConfig.bargain },
    returnBargain: { ...INITIAL_PLAYER_CONFIG.returnBargain, ...newConfig.returnBargain },
    prestige: { ...INITIAL_PLAYER_CONFIG.prestige, ...newConfig.prestige },
    roles: { ...INITIAL_PLAYER_CONFIG.roles, ...newConfig.roles },
    onegraph: { ...INITIAL_PLAYER_CONFIG.onegraph, ...newConfig.onegraph },
  };
};

export const INITIAL_PLAYER_CONFIG: PlayerConfig = {
  maxLot: 500,
  tradeLevel: 20,
  bargain: {
    bargainPercent: 0,
    raisePercent: 0,
    bargainFatigue: 0,
    raiseFatigue: 0,
    disabled: false,
  },
  returnBargain: {
    bargainPercent: 0,
    raisePercent: 0,
    bargainFatigue: 0,
    raiseFatigue: 0,
    disabled: false,
  },
  prestige: {
    修格里城: 1,
    曼德矿场: 1,
    澄明数据中心: 1,
    七号自由港: 1,
    阿妮塔发射中心: 1,
    海角城: 1,
    铁山城: 1,
    贡露城: 1,
    岚心城: 1,
    塔图站: 1,
    雪金城: 1,
  },
  roles: {},
  onegraph: {
    maxRestock: 5,
    goAndReturn: false,
    showFatigue: false,
    showProfitPerRestock: false,
    showGeneralProfitIndex: false,
    enableMultiConfig: false,
    displayMode: "table",
  },
  productUnlockStatus: {},
  events: {},
};
