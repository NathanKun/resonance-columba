import { CITIES, CITY_BELONGS_TO, CityName } from "@/data/Cities";
import { FATIGUES } from "@/data/Fatigue";
import { PRESTIGES } from "@/data/Prestige";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProducts } from "@/interfaces/get-prices";
import { PlayerConfig } from "@/interfaces/player-config";
import {
  Buy,
  CityGroupedExchanges,
  CityProductProfitAccumulatedExchange,
  Exchange,
  NoRestockRoutes,
  OnegraphRecommendations,
} from "@/interfaces/route-page";

const getProductsOfCity = (city: CityName) => PRODUCTS.filter((product) => product.buyPrices[city]);

export const calculateExchanges = (
  playerConfig: PlayerConfig,
  fromCities: CityName[],
  toCities: CityName[],
  prices: GetPricesProducts
) => {
  const exchanges: Exchange[] = [];

  // skip if Server side rendering
  if (typeof window === "undefined") {
    return exchanges;
  }

  // skip if no price data
  if (!prices || Object.keys(prices).length === 0) {
    return exchanges;
  }

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
          console.warn(`Buy price data not found for ${product.name} in ${fromCity}`, prices);
          return [];
        }

        let buyPrice = 0;

        // if has price property use it directly
        if (currentPriceObject.price) {
          buyPrice = currentPriceObject.price;
        }
        // else, calculate the price with variation and base price
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
        // skip if this product is buyable in this toCity
        if (PRODUCTS.find((product) => product.name === buy.product)?.buyPrices[toCity]) {
          return [];
        }

        if (!currentPriceObject) {
          console.warn(`Sell price data not found for ${buy.product} in ${toCity}`, prices);
          return [];
        }

        let sellPrice = 0;

        if (currentPriceObject.price) {
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
        const restockCount = Math.max(0, Math.floor(playerConfig.maxLot / exchange.accumulatedLot) - 1);
        exchange.restockCount = restockCount;
        exchange.restockAccumulatedProfit = (restockCount + 1) * exchange.accumulatedProfit;
        exchange.restockAccumulatedLot = (restockCount + 1) * exchange.accumulatedLot;

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
  fromCity: CityName,
  nbOfType: number, // number of different kind of product to buy from the same city
  cityGroupedExchanges: CityGroupedExchanges,
  playerConfig: PlayerConfig
) => {
  const fromCities = fromCity === "any" ? CITIES : [fromCity];

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

      let profitOfCombination = choosenExchanges[choosenExchanges.length - 1].restockAccumulatedProfit;
      const restockCount = choosenExchanges[choosenExchanges.length - 1].restockCount;

      // fill the remaining cargo with the next best exchanges
      // first, find the remaining cargo size
      const usedLot = choosenExchanges[choosenExchanges.length - 1].restockAccumulatedLot;
      const remainingLot = playerConfig.maxLot - usedLot;

      // check if there is a next profitable exchange
      if (exchanges.length > nbOfType) {
        const nextExchange = exchanges[nbOfType];
        // next exchange is losing, no more profitable exchanges, break
        if (nextExchange.loss) {
          break;
        }

        const availableProducts = nextExchange.buyLot * (restockCount + 1);
        const addedLot = Math.min(remainingLot, availableProducts);
        const addedProfit = addedLot * nextExchange.singleProfit;

        const newAccExchange: CityProductProfitAccumulatedExchange = {
          ...nextExchange,
          accumulatedProfit: addedProfit,
          accumulatedLot: addedLot,
          restockCount: -1,
          restockAccumulatedProfit: -1,
          restockAccumulatedLot: -1,
          isForFillCargo: true,
        };

        choosenExchanges.push(newAccExchange);
      }

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

export const getNoRestockRoutes = (
  cityGroupedExchanges: CityGroupedExchanges,
  playerConfig: PlayerConfig
): NoRestockRoutes => {
  const maxLot = playerConfig.maxLot;
  const results: NoRestockRoutes = {};
  for (const fromCity in cityGroupedExchanges) {
    for (const toCity in cityGroupedExchanges[fromCity]) {
      if (fromCity === toCity) {
        continue;
      }

      let profit = 0;
      let totalLot = 0;
      let products = [];

      const allExchanges = cityGroupedExchanges[fromCity][toCity];
      const profitableExchanges = allExchanges.filter((exchange) => !exchange.loss);
      for (const exchange of profitableExchanges) {
        let shouldBuyLot = maxLot > exchange.buyLot + totalLot ? exchange.buyLot : maxLot - totalLot;
        let pdtProfit = shouldBuyLot * exchange.singleProfit;
        profit += pdtProfit;
        totalLot += shouldBuyLot;
        products.push(exchange.product);

        if (totalLot >= maxLot) {
          break;
        }
      }

      // fatigue calculation
      const routeFatigue = getRouteFatigue(fromCity, toCity);
      let fatigue = 0;
      if (routeFatigue) {
        const bargainFatigue = playerConfig.bargain.bargainFatigue ?? 0;
        const raiseFatigue = playerConfig.bargain.raiseFatigue ?? 0;
        fatigue = routeFatigue + bargainFatigue + raiseFatigue;
      }

      const cityResult = { fromCity, toCity, profit, products, fatigue, totalLot };
      results[fromCity] = results[fromCity] ?? {};
      results[fromCity][toCity] = cityResult;
    }
  }

  return results;
};

export const calculateOneGraphRecommendations = (
  cityGroupedExchangesAllTargetCities: CityGroupedExchanges,
  playerConfig: PlayerConfig,
  onegraphMaxRestock: number
) => {
  const results: OnegraphRecommendations = {};
  const onegraphNoRestockRoutes: NoRestockRoutes = getNoRestockRoutes(
    cityGroupedExchangesAllTargetCities,
    playerConfig
  );

  const findOneGraphExchanges = (
    fromCity: CityName,
    toCity: CityName
  ): CityProductProfitAccumulatedExchange[] | undefined => {
    const exchanges = cityGroupedExchangesAllTargetCities[fromCity][toCity];

    // find the most profitable exchanges which are just under maxRestock,
    // the combination from the first to the choosenExchangeIndex
    // is the best combination for maxRestock wanted

    // if no exchanges, skip
    if (exchanges.length === 0) {
      return undefined;
    }

    let choosenExchangeIndex = null;
    for (let i = exchanges.length - 1; i >= 0; i--) {
      if (exchanges[i].loss) {
        continue;
      }
      if (exchanges[i].restockCount <= onegraphMaxRestock) {
        choosenExchangeIndex = i;
      } else {
        break;
      }
    }

    // if no exchanges are under maxRestock, skip
    if (choosenExchangeIndex === null) {
      return undefined;
    }

    const recomendationExchanges = exchanges.slice(0, choosenExchangeIndex + 1);
    const lastExchange = recomendationExchanges.at(-1)!; // there must be at least one exchange at this point

    // find if there is a next profitable exchange which can be used to fill the cargo,
    // assuming using the next product can fill the remaining cargo, otherwise there will still be some cargo left,
    // ideally should do a loop here to make sure all cargo is filled, but maybe next time :)
    const nextExchange = exchanges[choosenExchangeIndex + 1];
    if (nextExchange && !nextExchange.loss) {
      const usedLot = lastExchange.restockAccumulatedLot;
      const remainingLot = playerConfig.maxLot - usedLot;
      const filledLot = Math.min(remainingLot, nextExchange.buyLot);
      const fillStockProfit = nextExchange.singleProfit * filledLot;
      const restockAccumulatedProfit = lastExchange.restockAccumulatedProfit + fillStockProfit;
      recomendationExchanges.push({
        ...nextExchange,
        accumulatedProfit: fillStockProfit, // profit generated by filling the cargo
        accumulatedLot: filledLot, // lot used to fill the cargo
        restockCount: lastExchange.restockCount, // restock count is the same as the last exchange
        restockAccumulatedProfit: restockAccumulatedProfit, // profit generated by exchanges plus filling the cargo
        restockAccumulatedLot: usedLot + filledLot, // lot used by exchanges plus filling the cargo
        isForFillCargo: true,
      });
    }

    return recomendationExchanges;
  };

  for (const fromCity in cityGroupedExchangesAllTargetCities) {
    for (const toCity in cityGroupedExchangesAllTargetCities[fromCity]) {
      if (!results[fromCity]) {
        results[fromCity] = {};
      }

      const goNoRestockRoute = onegraphNoRestockRoutes[fromCity]?.[toCity];
      const goExchanges = findOneGraphExchanges(fromCity, toCity);
      const goProfit = goExchanges?.at(-1)?.restockAccumulatedProfit ?? goNoRestockRoute?.profit;
      const goFatigue = goExchanges?.at(-1)?.fatigue ?? 0;

      const returnNoRestockRoute = onegraphNoRestockRoutes[toCity]?.[fromCity];
      const returnExchanges = findOneGraphExchanges(toCity, fromCity);
      const returnProfit = returnExchanges?.at(-1)?.restockAccumulatedProfit ?? returnNoRestockRoute?.profit;
      const returnFatigue = returnExchanges?.at(-1)?.fatigue ?? 0;

      const totalProfit = (goProfit ?? 0) + (returnProfit ?? 0);
      const totalFatigue = goFatigue + returnFatigue;

      results[fromCity][toCity] = {
        goReco: {
          exchanges: goExchanges,
          noRestockRoute: goNoRestockRoute,
          profit: goProfit,
          fatigue: goFatigue,
          profitPerFatigue: goFatigue > 0 ? Math.round(goProfit / goFatigue) : 0,
        },
        returnReco: {
          exchanges: returnExchanges,
          noRestockRoute: returnNoRestockRoute,
          profit: returnProfit,
          fatigue: returnFatigue,
          profitPerFatigue: returnFatigue > 0 ? Math.round(returnProfit / returnFatigue) : 0,
        },
        totalProfit,
        totalFatigue,
        totalProfitPerFatigue: totalFatigue > 0 ? Math.round(totalProfit / totalFatigue) : 0,
      };
    }
  }

  return results;
};
