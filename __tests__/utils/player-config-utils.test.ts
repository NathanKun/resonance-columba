import { INITIAL_PLAYER_CONFIG } from "@/hooks/usePlayerConfig";
import { isValidPlayerConfig } from "@/utils/player-config-utils";
import { expect, test } from "vitest";

test("isValidPlayerConfig", () => {
  expect(isValidPlayerConfig(null)).toBe(false);
  expect(isValidPlayerConfig(undefined)).toBe(false);
  expect(isValidPlayerConfig({})).toBe(false);
  expect(isValidPlayerConfig({ hello: "world" })).toBe(false);

  expect(isValidPlayerConfig(INITIAL_PLAYER_CONFIG)).toBe(true);
  expect(isValidPlayerConfig(config1)).toBe(true);

  for (const config of invalidConfigs) {
    expect(isValidPlayerConfig(config)).toBe(false);
  }
});

const config1 = {
  maxLot: 500,
  bargain: {
    bargainPercent: 10,
    raisePercent: 10,
    bargainFatigue: 1,
    raiseFatigue: 3,
  },
  prestige: {
    修格里城: 13,
    曼德矿场: 13,
    澄明数据中心: 11,
    七号自由港: 14,
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
  },
  returnBargain: {
    bargainPercent: 20,
    raisePercent: 20,
    bargainFatigue: 97,
    raiseFatigue: 95,
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
      maxRestock: 0,
      goAndReturn: true,
      showFatigue: true,
      data: "hello",
    },
  },
  {
    data: "hello",
  },
];
