import { findFatigue } from "@/data/Fatigue";
import { CITY_FATIGUES } from "resonance-data-columba/dist/columbabuild";
import { expect, test } from "vitest";

const route = CITY_FATIGUES.find((fatigue) => (fatigue.fatigue ?? 0) > 1)!;
const routeFatigue = route.fatigue!;

test("findFatigue applies driveLessFatigue from selected roles", () => {
  const [fromCity, toCity] = route.cities;

  expect(findFatigue(fromCity, toCity, {})).toBe(routeFatigue);
  expect(findFatigue(fromCity, toCity, { 波克士: { resonance: 1 } })).toBe(routeFatigue - 1);
  expect(findFatigue(fromCity, toCity, { 波克士: { resonance: 4 } })).toBe(routeFatigue);
});
