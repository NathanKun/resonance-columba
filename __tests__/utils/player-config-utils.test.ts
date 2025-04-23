import { INITIAL_PLAYER_CONFIG, isValidPlayerConfig, mergePlayerConfigs } from "@/utils/player-config-utils";
import { nanoid } from "nanoid";
import { expect, test } from "vitest";

test("isValidPlayerConfig", () => {
  expect(isValidPlayerConfig(null)).toBe(false);
  expect(isValidPlayerConfig(undefined)).toBe(false);
  expect(isValidPlayerConfig({})).toBe(false);
  expect(isValidPlayerConfig({ hello: "world" })).toBe(false);

  expect(isValidPlayerConfig(INITIAL_PLAYER_CONFIG)).toBe(true);
  expect(isValidPlayerConfig(validConfig1)).toBe(true);

  for (const config of invalidConfigs) {
    expect(isValidPlayerConfig(config)).toBe(false);
  }
});

test("mergePlayerConfigs", () => {
  expect(mergePlayerConfigs(null)).toEqual(INITIAL_PLAYER_CONFIG);
  expect(mergePlayerConfigs(undefined)).toEqual(INITIAL_PLAYER_CONFIG);
  expect(mergePlayerConfigs({})).toEqual(INITIAL_PLAYER_CONFIG);
  expect(mergePlayerConfigs(INITIAL_PLAYER_CONFIG)).toEqual(INITIAL_PLAYER_CONFIG);

  expect(mergePlayerConfigs(validConfig1)).toEqual(validConfig1);

  // test valid after merge
  for (const key of Object.keys(validConfig1)) {
    const copy: any = { ...validConfig1 };
    delete copy[key];
    const merged: any = mergePlayerConfigs(copy);
    expect(isValidPlayerConfig(merged)).toBe(true);

    if (typeof merged[key] === "object") {
      for (const subKey of Object.keys(merged[key])) {
        const copy2: any = { ...validConfig1 };
        copy2[key] = { ...copy2[key] };
        delete copy2[key][subKey];
        const merged2: any = mergePlayerConfigs(copy2);
        expect(isValidPlayerConfig(merged2)).toBe(true);
      }
    }
  }

  // test data merged correctly
  let merged = mergePlayerConfigs({ roles: { 叶珏: { resonance: 6 } } });
  expect(merged.roles.叶珏.resonance).toBe(6);

  merged = mergePlayerConfigs({ maxLot: 1000 });
  expect(merged.maxLot).toBe(1000);

  merged = mergePlayerConfigs({ bargain: { raisePercent: 20 } });
  expect(merged.bargain.raisePercent).toBe(20);

  merged = mergePlayerConfigs({ nanoid: "--2O4IjyEqACb9ZA3LFYS" });
  expect(merged.nanoid).toBe("--2O4IjyEqACb9ZA3LFYS");
});

const validConfig1 = {
  maxLot: 600,
  tradeLevel: 50,
  bargain: {
    bargainPercent: 10,
    raisePercent: 10,
    bargainFatigue: 1,
    raiseFatigue: 3,
    disabled: false,
  },
  prestige: {
    修格里城: 13,
    曼德矿场: 13,
    澄明数据中心: 11,
    七号自由港: 14,
    阿妮塔发射中心: 16,
    海角城: 6,
    铁山城: 6,
    贡露城: 5,
    岚心城: 4,
    塔图站: 1,
    雪金城: 2,
  },
  roles: {
    叶珏: {
      resonance: 5,
    },
    艾略特: {
      resonance: 4,
    },
    甘雅: {
      resonance: 4,
    },
    朱利安: {
      resonance: 4,
    },
  },
  onegraph: {
    maxRestock: 0,
    goAndReturn: true,
    showFatigue: true,
    showProfitPerRestock: true,
    showGeneralProfitIndex: true,
    enableMultiConfig: true,
    displayMode: "table",
  },
  returnBargain: {
    bargainPercent: 20,
    raisePercent: 20,
    bargainFatigue: 97,
    raiseFatigue: 95,
    disabled: true,
  },
  productUnlockStatus: {
    琥珀: true,
    防弹背心: false,
  },
  events: {
    红茶战争: {
      activated: true,
    },
  },
};

const invalidConfigs = [
  {
    maxLot: "data",
  },
  {
    maxLot: -123,
  },
  {
    maxLot: 12345,
  },
  {
    tradeLevel: 0,
  },
  {
    tradeLevel: 100,
  },
  {
    tradeLevel: "20",
  },
  {
    bargain: {
      bargainPercent: 10,
      raisePercent: 10,
      bargainFatigue: 1,
      raiseFatigue: 3,
      data: "hello",
    },
  },
  {
    bargain: {
      bargainPercent: 10,
      raisePercent: 10,
      bargainFatigue: 1,
      raiseFatigue: {
        data: "hello",
      },
    },
  },
  {
    bargain: {
      bargainPercent: 10,
      raisePercent: 10,
      bargainFatigue: 1,
      raiseFatigue: {
        data: "hello",
      },
    },
  },
  {
    bargain: {
      bargainPercent: 101,
    },
  },
  {
    bargain: {
      bargainPercent: 10,
      disabled: 101,
    },
  },
  {
    bargain: {
      disabled: {
        data: "hello",
      },
    },
  },
  {
    returnBargain: {
      disabled: "123",
    },
  },
  {
    returnBargain: {
      bargainPercent: -10,
    },
  },
  {
    returnBargain: {
      raiseFatigue: -10,
    },
  },
  {
    prestige: {
      修格里城: 13,
      曼德矿场: 13,
      澄明数据中心: 11,
      七号自由港: 14,
      data: "hello",
    },
  },
  {
    prestige: {
      修格里城: 21,
    },
  },
  {
    prestige: {
      修格里城: -21,
    },
  },
  {
    prestige: {
      修格里城: 13,
      曼德矿场: 13,
      澄明数据中心: 11,
      七号自由港: "token",
    },
  },
  {
    roles: {
      叶珏: {
        resonance: 5,
        data: "hello",
      },
    },
  },
  {
    roles: {
      叶珏: {
        resonance: 6,
      },
    },
  },
  {
    roles: {
      叶珏: {
        resonance: -6,
      },
    },
  },
  {
    roles: {
      叶珏: {},
    },
  },
  {
    roles: {
      叶珏珏: {
        resonance: 5,
      },
    },
  },
  {
    roles: {
      叶珏: {
        resonance: "token",
      },
    },
  },
  {
    onegraph: {
      maxRestock: 0,
      goAndReturn: true,
      showFatigue: "token",
    },
  },
  {
    onegraph: {
      maxRestock: -1,
      goAndReturn: true,
      showFatigue: true,
    },
  },
  {
    onegraph: {
      maxRestock: 101,
      goAndReturn: true,
      showFatigue: true,
    },
  },
  {
    onegraph: {
      showFatigue: true,
      showProfitPerRestock: "true",
    },
  },
  {
    onegraph: {
      maxRestock: 10,
      showProfitPerRestock: {
        data: "hello",
      },
    },
  },
  {
    onegraph: {
      showFatigue: true,
      showGeneralProfitIndex: "true",
    },
  },
  {
    onegraph: {
      maxRestock: 0,
      goAndReturn: true,
      showFatigue: true,
      data: "hello",
    },
  },
  {
    onegraph: {
      maxRestock: 0,
      goAndReturn: true,
      showFatigue: true,
      showProfitPerRestock: true,
      displayMode: "hey",
    },
  },
  {
    onegraph: {
      maxRestock: 0,
      goAndReturn: true,
      showFatigue: true,
      showProfitPerRestock: true,
      displayMode: false,
    },
  },
  {
    onegraph: {
      showProfitPerRestock: true,
      displayMode: 123,
    },
  },
  {
    onegraph: {
      showProfitPerRestock: true,
      displayMode: {
        hello: "world",
      },
    },
  },
  {
    data: "hello",
  },
  {
    nanoid: nanoid() + "a",
  },
  {
    nanoid: nanoid().substring(0, 20),
  },
  {
    nanoid: 233,
  },
  {
    nanoid: {},
  },
  {
    productUnlockStatus: "123",
  },
  {
    productUnlockStatus: {
      琥珀: true,
      防弹背心心: false,
    },
  },
  {
    productUnlockStatus: {
      琥珀: true,
      防弹背心: "qsdqsd",
    },
  },
  {
    productUnlockStatus: {
      琥珀: 0,
    },
  },
  {
    events: {
      战战争争: {
        activated: true,
      },
    },
  },
  {
    events: {
      红茶战争: {
        activated: 1,
      },
    },
  },
  {
    events: {
      红茶战争: {
        hey: "you",
      },
    },
  },
];
