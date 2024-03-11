import { CITY_BELONGS_TO, CityName } from "@/data/Cities";
import { FATIGUES } from "@/data/Fatigue";
import { PRESTIGES } from "@/data/Prestige";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProducts } from "@/interfaces/get-prices";
import { PlayerConfig } from "@/interfaces/player-config";
import { Buy, CityGroupedExchanges, Exchange } from "@/interfaces/route-page";

const getProductsOfCity = (city: CityName) => PRODUCTS.filter((product) => product.buyPrices[city]);

export const calculateExchanges = (
  playerConfig: PlayerConfig,
  fromCities: CityName[],
  toCities: CityName[],
  prices: GetPricesProducts,
  isV2Prices: boolean
) => {
  const exchanges: Exchange[] = [];

  for (const fromCity of fromCities) {
    const availableProducts = getProductsOfCity(fromCity);
    const fromCityMaster = CITY_BELONGS_TO[fromCity] ?? fromCity;
    const buyPrestige = PRESTIGES.find((prestige) => prestige.level === playerConfig.prestige[fromCityMaster]);
    if (!buyPrestige) {
      console.warn(
        `Prestige configurtation not found for ${fromCityMaster} level ${playerConfig.prestige[fromCityMaster]}`
      );
      continue;
    }
    const buys: Buy[] = availableProducts
      // group routes by fromCity and toCity
      .flatMap<Buy>((product) => {
        // not support craftable products yet
        if (product.craft) {
          return [];
        }

        // skip if no buy lot data
        let buyLot = product.buyLot?.[fromCity] ?? 0;
        if (buyLot === 0) {
          console.warn(`Buy lot not found for ${product.name} in ${fromCity}`);
          return [];
        }

        // apply prestige to buy lot
        buyLot = Math.round(buyLot * (1 + buyPrestige.extraBuy));

        // calculate current buy price
        // skip any product that has missing data
        const currentPriceObject = prices[product.name]?.["buy"]?.[fromCity];
        if (!currentPriceObject) {
          console.warn(`Buy price data not found for ${product.name} in ${fromCity}`);
          return [];
        }

        let buyPrice = 0;

        // if v2 prices, use the price directly
        if (isV2Prices && currentPriceObject.price) {
          buyPrice = currentPriceObject.price;
        }
        // if v1 prices, calculate the price with variation and base price
        else {
          const currentVariation = currentPriceObject.variation ?? 0;
          const basePrice = product.buyPrices[fromCity] ?? 0;
          buyPrice = (basePrice * currentVariation) / 100;
        }

        // skip if buy price is 0
        if (buyPrice === 0) {
          console.warn(`Buy price is 0 for ${product.name} in ${fromCity}`);
          return [];
        }

        // apply bargain to buy price
        const bargain = playerConfig.bargain.bargainPercent ?? 0;
        buyPrice = buyPrice * (1 - bargain / 100);

        // apply prestiged tax to buy price
        const tax = buyPrestige.specialTax[fromCity] ?? buyPrestige.generalTax;
        buyPrice = Math.round(buyPrice * (1 + tax));

        return [
          {
            product: product.name,
            buyPrice,
            buyLot,
            fromCity,
          } as Buy,
        ];
      });

    for (const toCity of toCities) {
      if (fromCity === toCity) {
        continue;
      }

      const toCityMaster = CITY_BELONGS_TO[toCity] ?? toCity;
      const sellPrestige = PRESTIGES.find((prestige) => prestige.level === playerConfig.prestige[toCityMaster]);
      if (!sellPrestige) {
        console.warn(
          `Prestige configurtation not found for ${toCityMaster} level ${playerConfig.prestige[toCityMaster]}`
        );
        continue;
      }

      const oneRouteExchanges: Exchange[] = buys.flatMap((buy) => {
        const currentPriceObject = prices[buy.product]?.["sell"]?.[toCity];
        if (!currentPriceObject) {
          console.warn(`Sell price data not found for ${buy.product} in ${toCity}`);
          return [];
        }

        let sellPrice = 0;

        if (isV2Prices && currentPriceObject.price) {
          sellPrice = currentPriceObject.price;
        } else {
          const currentVariation = currentPriceObject.variation ?? 0;
          const basePrice = PRODUCTS.find((product) => product.name === buy.product)?.sellPrices[toCity] ?? 0;
          sellPrice = (basePrice * currentVariation) / 100;
        }

        if (sellPrice === 0) {
          console.warn(`Sell price is 0 for ${buy.product} in ${toCity}`);
          return [];
        }

        // apply raise to sell price
        const raise = playerConfig.bargain.raisePercent ?? 0;
        sellPrice = Math.round(sellPrice * (1 + raise / 100));

        // calculate profit
        let singleProfit = sellPrice - buy.buyPrice;

        // apply prestiged tax to profit
        const tax = sellPrestige.specialTax[toCity] ?? sellPrestige.generalTax;
        singleProfit = Math.round(singleProfit * (1 - tax));

        // lot profit
        const lotProfit = Math.round(singleProfit * buy.buyLot);

        return [
          {
            ...buy,
            sellPrice,
            singleProfit,
            lotProfit,
            toCity,
          },
        ];
      });

      exchanges.push(...oneRouteExchanges);
    }
  }

  return exchanges;
};

export const groupeExchangesByCity = (exchanges: Exchange[]): CityGroupedExchanges => {
  return exchanges.reduce<CityGroupedExchanges>((acc: CityGroupedExchanges, exchange: Exchange) => {
    if (!acc[exchange.fromCity]) {
      acc[exchange.fromCity] = {};
    }

    if (!acc[exchange.fromCity][exchange.toCity]) {
      acc[exchange.fromCity][exchange.toCity] = [];
    }

    acc[exchange.fromCity][exchange.toCity].push({
      ...exchange,
      accumulatedProfit: 0,
      loss: false,
      accumulatedLot: 0,
      restockCount: 0,
      restockAccumulatedProfit: 0,
      restockAccumulatedLot: 0,
    });
    return acc;
  }, {});
};

export const calculateAccumulatedValues = (playerConfig: PlayerConfig, cityGroupedExchanges: CityGroupedExchanges) => {
  // sort each toCity exchanges by single profit, then calculate accumulatedProfit
  for (const fromCity in cityGroupedExchanges) {
    for (const toCity in cityGroupedExchanges[fromCity]) {
      cityGroupedExchanges[fromCity][toCity] = cityGroupedExchanges[fromCity][toCity].sort(
        (a, b) => b.singleProfit - a.singleProfit // reverse sort
      );

      let accProfit = 0;
      let accLot = 0;
      for (let i = 0; i < cityGroupedExchanges[fromCity][toCity].length; i++) {
        const exchange = cityGroupedExchanges[fromCity][toCity][i];

        // not restock calculation
        accProfit += exchange.lotProfit;
        accLot += exchange.buyLot;

        exchange.accumulatedProfit = accProfit;
        exchange.loss = exchange.lotProfit <= 0;
        exchange.accumulatedLot = accLot;

        // restock calculation
        const restockCount = Math.floor(playerConfig.maxLot / exchange.accumulatedLot);
        exchange.restockCount = restockCount;
        exchange.restockAccumulatedProfit = restockCount * exchange.accumulatedProfit;
        exchange.restockAccumulatedLot = restockCount * exchange.accumulatedLot;

        // fatigue calculation
        const fatigue = getRouteFatigue(fromCity, toCity);
        if (fatigue) {
          const bargainFatigue = playerConfig.bargain.bargainFatigue ?? 0;
          const raiseFatigue = playerConfig.bargain.raiseFatigue ?? 0;
          const totalFatigue = fatigue + bargainFatigue + raiseFatigue;
          exchange.fatigue = totalFatigue;
          exchange.profitPerFatigue = Math.round(exchange.restockAccumulatedProfit / totalFatigue);
        }
      }
    }
  }
};

export const getRouteFatigue = (city1: CityName, city2: CityName) => {
  return FATIGUES.find((fatigue) => fatigue.cities.includes(city1) && fatigue.cities.includes(city2))?.fatigue;
};

export const getBestRoutesByNumberOfBuyingProductTypes = (
  fromCities: CityName[],
  nbOfType: number, // number of different kind of product to buy from the same city
  cityGroupedExchanges: CityGroupedExchanges
) => {
  const combinations = [];
  for (const fromCity of fromCities) {
    for (const toCity in cityGroupedExchanges[fromCity]) {
      const exchanges = cityGroupedExchanges[fromCity][toCity];

      if (exchanges.length < nbOfType) {
        continue;
      }

      // take the first nbOfType exchanges
      const choosenExchanges = exchanges.slice(0, nbOfType);

      // skip if start losing
      const loss = choosenExchanges.some((exchange) => exchange.loss);
      if (loss) {
        continue;
      }

      const profitOfCombination = choosenExchanges[choosenExchanges.length - 1].restockAccumulatedProfit;
      const restockCount = choosenExchanges[choosenExchanges.length - 1].restockCount;
      combinations.push({
        fromCity,
        toCity,
        choosenExchanges,
        profitOfCombination,
        restockCount,
      });
    }
  }
  return combinations.sort((a, b) => b.profitOfCombination - a.profitOfCombination);
};
