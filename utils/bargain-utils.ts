// bargain  / raise system
// 1. bargain / raise times
//    base times: 2
//    city prestige level 2, 5, 9 increase 1 bargain times
//    city prestige level 3, 6, 10 increase 1 raise times
//    role resonance skill bargain.bargainCount increase bargain times by it's value
//    role resonance skill bargain.raiseCount increase raise times by it's value
// 2. bargain / raise success rate
//    base success rate: 67%
//    each city prestige level increase 0.5% success rate
//    each successful bargain / raise decrease 10% success rate
//    role resonance skill bargain.firstTrySuccessRate can increase success rate by it's value, it will be deactivated after first successful bargain
//    role resonance skill bargain.afterFailedSuccessRate can increase success rate by it's value, it is activated after any failed bargain, until next successful bargain
//    role resonance skill bargain.firstTrySuccessRate and bargain.afterFailedSuccessRate can be activated at the same time
// 3. bargain / raise raise rate
//    base bargain rate is 3%
//    base raise rate is 2%
//    each trade level increase 0.1% bargain / raise rate
//    role resonance skill bargain.bargainRate can increase bargain rate by it's value
//    role resonance skill bargain.raiseRate can increase raise rate by it's value
// 4. bargain / raise fatigue
//    base bargain / raise try consume 8 fatigue
//    role resonance skill bargain.afterFailedLessFatigue can decrease fatigue consume after failed bargain by it's value

import { CITY_BELONGS_TO, CityName } from "@/data/Cities";
import { ROLE_RESONANCE_SKILLS } from "@/data/RoleResonanceSkills";
import { PlayerConfigPrestige, PlayerConfigRoles } from "@/interfaces/player-config";

type BargainType = "bargain" | "raise";

export interface BargainSummary {
  bargainRate: number;
  raiseRate: number;
  skillBargainCount: number;
  skillRaiseCount: number;
  skillBargainRate: number;
  skillRaiseRate: number;
  skillBargainSuccessRate: number;
  skillRaiseSuccessRate: number;
  skillAfterFailedLessFatigue: number;
  skillFirstTrySuccessRate: number;
  skillAfterFailedSuccessRate: number;
}

export const simulateBargain = (
  prestige: PlayerConfigPrestige,
  bargainSummary: BargainSummary,
  city: CityName,
  type: BargainType,
  maxTriesParam: number
): {
  expectedRate: number;
  expectedFatigue: number;
} => {
  if (maxTriesParam <= 0) {
    return {
      expectedRate: 0,
      expectedFatigue: 0,
    };
  }

  const {
    bargainRate,
    raiseRate,
    skillBargainCount,
    skillRaiseCount,
    skillBargainSuccessRate,
    skillRaiseSuccessRate,
    skillFirstTrySuccessRate: firstTrySuccessRate,
    skillAfterFailedLessFatigue: fatigueReduceOnFailed,
    skillAfterFailedSuccessRate: afterFailedSuccessRate,
  } = bargainSummary;

  const maxTimes = Math.min(
    getBargainMaxTimes(skillBargainCount, skillRaiseCount, prestige, city, type),
    maxTriesParam,
    10
  ); // force max 10 tries, otherwise it will be too slow

  const bargainRatePerTry = type === "bargain" ? bargainRate : raiseRate;

  const successFatigue = 8;
  const failedFatigue = successFatigue - fatigueReduceOnFailed;

  const prestigeLevel = prestige[CITY_BELONGS_TO[city] ?? city] ?? 0;

  // make bargain stop when the success rate is more than 20%
  const maxSuccessTimes = Math.ceil(20 / bargainRatePerTry);

  // all possible bargain success & failed combinations
  const generateCombinations = (
    n: number,
    current: boolean[] = [],
    combinations: boolean[][] = [],
    successCount: number = 0
  ): boolean[][] => {
    if (current.length === n || successCount === maxSuccessTimes) {
      combinations.push(current);
    } else {
      generateCombinations(n, [...current, true], combinations, successCount + 1); // success
      generateCombinations(n, [...current, false], combinations, successCount); // failure
    }
    return combinations;
  };

  let bargainResults: boolean[][] = generateCombinations(maxTimes, [], []);
  for (let i = 0; i < bargainResults.length; i++) {
    const combination = bargainResults[i];
    let successTimes = 0;
    let index = 0;
    for (const success of combination) {
      if (success) {
        successTimes++;
        if (successTimes === maxSuccessTimes) {
          bargainResults[i] = combination.slice(0, index + 1);
          break;
        }
      }
      index++;
    }
  }

  // remove duplicated combinations
  bargainResults = bargainResults.filter((combination, index) => {
    const combinationStr = combination.join("");
    return bargainResults.findIndex((c) => c.join("") === combinationStr) === index;
  });

  // calculate probability, bargain rate and fatigue for each combination
  const combinations: {
    bargainResult: boolean[];
    rate: number;
    fatigue: number;
    probability: number;
  }[] = bargainResults.map((bargainResult) => {
    let combinationProbability = 1;
    for (let i = 0; i < bargainResult.length; i++) {
      let successRate = 67;

      // add prestige success rate
      successRate += prestigeLevel * 0.5;

      // add role resonance skill success rate
      successRate += type === "bargain" ? skillBargainSuccessRate : skillRaiseSuccessRate;

      // check if can apply firstTrySuccessRate by finding any successful bargain before
      const previousSuccess = bargainResult.slice(0, i).find((success) => success);
      if (!previousSuccess) {
        successRate += firstTrySuccessRate;
      }

      // check if can apply afterFailedSuccessRate by finding if last bargain failed
      const previousFailed = bargainResult.slice(0, i).find((success) => !success);
      if (previousFailed) {
        successRate += afterFailedSuccessRate;
      }

      // each previous successful bargain decrease 10% success rate
      const previousSuccesses = bargainResult.slice(0, i).filter((success) => success);
      successRate -= previousSuccesses.length * 10;

      const success = bargainResult[i];

      if (success) {
        combinationProbability *= successRate / 100;
      } else {
        combinationProbability *= (100 - successRate) / 100;
      }
    }

    const rate = Math.min(20, bargainResult.filter((success) => success).length * bargainRatePerTry);

    const fatigue =
      bargainResult.filter((success) => !success).length * failedFatigue +
      bargainResult.filter((success) => success).length * successFatigue;

    return {
      bargainResult,
      rate,
      fatigue,
      probability: combinationProbability,
    };
  });

  // const totalProbability = combinations.reduce((sum, combination) => sum + combination.probability, 0);
  // console.info("totalProbability", totalProbability); // should be 1

  const expectedRate =
    combinations.reduce((sum, combination) => sum + combination.rate * combination.probability, 0) / 100;
  const expectedFatigue = combinations.reduce(
    (sum, combination) => sum + combination.fatigue * combination.probability,
    0
  );

  return {
    expectedRate,
    expectedFatigue,
  };
};

export const getBargainSummary = (roles: PlayerConfigRoles, tradeLevel: number): BargainSummary => {
  const skillBargainCount = sumRolesBargainSkillValue(roles, "bargainCount");
  const skillRaiseCount = sumRolesBargainSkillValue(roles, "raiseCount");
  const skillBargainRate = sumRolesBargainSkillValue(roles, "bargainRate");
  const skillRaiseRate = sumRolesBargainSkillValue(roles, "raiseRate");
  const skillBargainSuccessRate = sumRolesBargainSkillValue(roles, "bargainSuccessRate");
  const skillRaiseSuccessRate = sumRolesBargainSkillValue(roles, "raiseSuccessRate");
  const skillAfterFailedLessFatigue = sumRolesBargainSkillValue(roles, "afterFailedLessFatigue");
  const skillFirstTrySuccessRate = sumRolesBargainSkillValue(roles, "firstTrySuccessRate");
  const skillAfterFailedSuccessRate = sumRolesBargainSkillValue(roles, "afterFailedSuccessRate");

  const bargainRate = getBargainRate(skillBargainRate, skillRaiseRate, tradeLevel, "bargain");
  const raiseRate = getBargainRate(skillBargainRate, skillRaiseRate, tradeLevel, "raise");

  return {
    bargainRate,
    raiseRate,
    skillBargainCount,
    skillRaiseCount,
    skillBargainRate,
    skillRaiseRate,
    skillBargainSuccessRate,
    skillRaiseSuccessRate,
    skillAfterFailedLessFatigue,
    skillFirstTrySuccessRate,
    skillAfterFailedSuccessRate,
  };
};

const getBargainMaxTimes = (
  skillBargainCount: number,
  skillRaiseCount: number,
  prestige: PlayerConfigPrestige,
  city: CityName,
  type: BargainType
) => {
  // base times
  let times = 2;

  // prestige level
  const masterCity = CITY_BELONGS_TO[city] ?? city;
  const prestigeLevel = prestige[masterCity] ?? 0;

  if (type === "bargain") {
    const levels = [2, 5, 9];
    times += levels.filter((level) => prestigeLevel >= level).length;
  } else {
    const levels = [3, 6, 10];
    times += levels.filter((level) => prestigeLevel >= level).length;
  }

  // role resonance skill
  times += type === "bargain" ? skillBargainCount : skillRaiseCount;

  return times;
};

const getBargainRate = (skillBargainRate: number, skillRaiseRate: number, tradeLevel: number, type: BargainType) => {
  // base rate
  let rate = type === "bargain" ? 3 : 2;

  // trade level
  rate += tradeLevel * 0.1;

  // role resonance skill
  rate += type === "bargain" ? skillBargainRate : skillRaiseRate;

  return rate;
};

const sumRolesBargainSkillValue = (roles: PlayerConfigRoles, skillName: string) => {
  let value = 0;
  for (const roleName in roles) {
    // player's role's resonance level
    const roleResonanceLevel = roles[roleName].resonance;
    if (roleResonanceLevel === 0) {
      continue;
    }

    // get the role's resonance skill definition
    const roleDef = ROLE_RESONANCE_SKILLS[roleName];
    const resonanceDef = roleDef[roleResonanceLevel];
    const bargainDef = resonanceDef.bargain;
    if (!bargainDef) {
      continue;
    }

    // check if this role has the skill
    value += bargainDef[skillName as keyof typeof bargainDef] ?? 0;
  }
  return value;
};
