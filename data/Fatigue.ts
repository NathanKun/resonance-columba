import { ROLE_RESONANCE_SKILLS } from "@/data/RoleResonanceSkills";
import { Fatigue } from "@/interfaces/fatigue";
import { PlayerConfigRoles } from "@/interfaces/player-config";
import { CITY_FATIGUES } from "resonance-data-columba/dist/columbabuild";

const FATIGUES: Fatigue[] = CITY_FATIGUES;

export const findFatigue = (fromCity: string, toCity: string, playerConfigRoles: PlayerConfigRoles): number => {
  let fatigue = FATIGUES.find((f) => f.cities.includes(fromCity) && f.cities.includes(toCity))?.fatigue ?? 0;
  if (fatigue === 0) {
    return fatigue;
  }

  // sum driveLessFatigue from all selected role resonance skills
  let fatigueReduction = 0;
  for (const roleName in playerConfigRoles) {
    const resonanceLevel = playerConfigRoles[roleName].resonance;
    if (resonanceLevel === 0) {
      continue;
    }

    const roleSkills = ROLE_RESONANCE_SKILLS[roleName];
    const skill = roleSkills?.[resonanceLevel];
    fatigueReduction += skill?.other?.driveLessFatigue ?? 0;
  }

  return Math.max(0, fatigue - fatigueReduction);
};
