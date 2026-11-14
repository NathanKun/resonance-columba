import { BargainSummary, simulateBargain } from "@/utils/bargain-utils";
import { expect, test } from "vitest";

test("afterFailedSuccessRate only applies after the immediately previous failed attempt", () => {
  const summary: BargainSummary = {
    bargainRate: 10,
    raiseRate: 10,
    skillBargainCount: 1,
    skillRaiseCount: 0,
    skillBargainRate: 0,
    skillRaiseRate: 0,
    skillBargainSuccessRate: 0,
    skillRaiseSuccessRate: 0,
    skillAfterFailedLessFatigue: 0,
    skillFirstTrySuccessRate: 0,
    skillAfterFailedSuccessRate: 20,
  };

  const result = simulateBargain({}, summary, "修格里城", "bargain", 3);

  // If the bonus incorrectly stays active after a successful retry, this becomes about 0.16362.
  expect(result.expectedRate).toBeCloseTo(0.1761807, 5);
});
