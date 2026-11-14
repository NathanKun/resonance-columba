import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { INITIAL_PLAYER_CONFIG } from "@/utils/player-config-utils";
import { calculateBuyLot, calculateExchanges } from "@/utils/route-page-utils";
import { expect, test, vi } from "vitest";

test("calculateBuyLot applies the total buy-more percent and rounds to nearest integer", () => {
  expect(calculateBuyLot(100, 0)).toBe(100);
  expect(calculateBuyLot(100, 60)).toBe(160);
  expect(calculateBuyLot(10, 25)).toBe(13); // 12.5 rounds up
  expect(calculateBuyLot(10, 24)).toBe(12);
  expect(calculateBuyLot(10, 26)).toBe(13);
});

test("calculateExchanges includes global and product investment buy-more percents", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const product = PRODUCTS.find(
    (pdt) =>
      pdt.type !== "Craft" &&
      Object.entries(pdt.buyLot ?? {}).some(([city, lot]) => (lot ?? 0) > 0 && (pdt.buyPrices[city] ?? 0) > 0)
  )!;
  const fromCity = Object.entries(product.buyLot!).find(([, lot]) => (lot ?? 0) > 0)![0] as CityName;
  const toCity = CITIES.find((city) => city !== fromCity)!;
  const baseLot = product.buyLot![fromCity]!;
  const prices: any = {
    [product.name]: {
      buy: { [fromCity]: { price: 100 } },
      sell: { [toCity]: { price: 200 } },
    },
  };

  const baseConfig = {
    ...INITIAL_PLAYER_CONFIG,
    allExchangesBuyMorePercent: 0,
    productsBuyMorePercent: {},
  };
  const boostedConfig = {
    ...baseConfig,
    allExchangesBuyMorePercent: 60,
    productsBuyMorePercent: { [product.name]: 100 },
  };

  const findBuyLot = (config: typeof baseConfig) => {
    const exchange = calculateExchanges(config, [fromCity], [toCity], prices).find(
      (item) => item.product === product.name && item.fromCity === fromCity && item.toCity === toCity
    );
    expect(exchange).toBeDefined();
    return exchange!.buyLot;
  };

  // INITIAL_PLAYER_CONFIG uses prestige level 1, which adds 10%.
  expect(findBuyLot(baseConfig)).toBe(calculateBuyLot(baseLot, 10));
  expect(findBuyLot(boostedConfig)).toBe(calculateBuyLot(baseLot, 10 + 60 + 100));

  warnSpy.mockRestore();
});
