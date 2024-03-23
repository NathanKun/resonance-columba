import { CITIES } from "@/data/Cities";
import { ROLE_RESONANCE_SKILLS } from "@/data/RoleResonanceSkills";

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
      (key) => !["maxLot", "bargain", "returnBargain", "prestige", "roles", "onegraph"].includes(key)
    ).length > 0
  ) {
    return false;
  }

  if (config.maxLot && (isNaN(config.maxLot) || config.maxLot < 0 || config.maxLot > 5000)) {
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
    if (Object.keys(prestige).filter((key) => !CITIES.includes(key)).length > 0) {
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
    if (Object.keys(onegraph).filter((key) => !["maxRestock", "goAndReturn", "showFatigue"].includes(key)).length > 0) {
      return false;
    }

    if (isNaN(onegraph.maxRestock) || onegraph.maxRestock < 0 || onegraph.maxRestock > 100) {
      return false;
    }

    if (typeof onegraph.goAndReturn !== "boolean") {
      return false;
    }

    if (typeof onegraph.showFatigue !== "boolean") {
      return false;
    }
  }

  return true;
};

const isBargainConfig = (bargain: any) => {
  if (
    Object.keys(bargain).filter(
      (key) => !["bargainPercent", "raisePercent", "bargainFatigue", "raiseFatigue"].includes(key)
    ).length > 0
  ) {
    return false;
  }

  if (Object.keys(bargain).filter((key) => isNaN(bargain[key]) || bargain[key] < 0 || bargain[key] > 100).length > 0) {
    return false;
  }

  return true;
};
