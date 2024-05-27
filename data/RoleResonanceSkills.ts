import { ResonanceSkills } from "@/interfaces/role-skill";
import { RESONANCE_SKILLS } from "resonance-data-columba/dist/columbabuild";

export const ROLE_RESONANCE_SKILLS: {
  [role: string]: ResonanceSkills;
} = RESONANCE_SKILLS;
