import { CITIES, CITY_BELONGS_TO, CityName } from "@/data/Cities";
import { EVENTS } from "@/data/Event";
import { FATIGUES } from "@/data/Fatigue";
import { PRESTIGES } from "@/data/Prestige";
import { PRODUCTS } from "@/data/Products";
import { ROLE_RESONANCE_SKILLS } from "@/data/RoleResonanceSkills";
import { GetPricesProducts } from "@/interfaces/get-prices";
import {
  PlayerConfig,
  PlayerConfigBargain,
  PlayerConfigPrestige,
  PlayerConfigProductUnlockStatus,
  PlayerConfigRoles,
} from "@/interfaces/player-config";
import { Product } from "@/interfaces/product";
import {
  Buy,
  CityGroupedExchanges,
  CityProductProfitAccumulatedExchange,
  Exchange,
  OnegraphBuyCombination as OnegraphBuy,
  OnegraphBuyCombinationStats,
  OnegraphBuyCombinations,
  OnegraphPriceData,
  OnegraphPriceDataItem,
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
    const availableProducts = getProductsOfCity(fromCity).filter(
      (product) => playerConfig.productUnlockStatus?.[product.name] ?? true
    );
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

        // get role resonance skill buy more percent
        const resonanceSkillBuyMorePercent = getResonanceSkillBuyMorePercent(playerConfig.roles, product, fromCity);

        // get prestige buy more percent
        const prestigeBuyMorePercent = buyPrestige.extraBuy * 100;

        // get game event buy more percent
        const eventBuyMorePercent = getGameEventBuyMorePercent(product, fromCity);

        // sum all buy more percent
        const totalBuyMorePercent = resonanceSkillBuyMorePercent + prestigeBuyMorePercent + eventBuyMorePercent;

        // apply buy more percent to buy lot
        buyLot = Math.round((buyLot * (100 + totalBuyMorePercent)) / 100);

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
        buyPrice = Math.round(buyPrice);

        // get prestiged tax to buy price
        let tax = buyPrestige.specialTax[fromCity] ?? buyPrestige.generalTax;

        // get game event tax variation
        const eventTaxVariation = getGameEventTaxVariation(product, fromCity);

        // sum all tax variation
        tax += eventTaxVariation;

        // don't apply tax to buy price yet, tax should be deducted from profit later

        return [
          {
            product: product.name,
            buyPrice,
            buyLot,
            fromCity,
            buyTaxRate: tax,
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

        // get prestiged tax to profit
        const sellTaxRate = sellPrestige.specialTax[toCity] ?? sellPrestige.generalTax;

        // deduct sell tax, it applies to (sell price - buy price before buy tax)
        singleProfit -= singleProfit * sellTaxRate;

        // deduct buy tax from profit
        singleProfit -= buy.buyPrice * buy.buyTaxRate;

        // lot profit
        const lotProfit = Math.round(singleProfit * buy.buyLot);

        // round after all calculation
        singleProfit = Math.round(singleProfit);

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

      let profitOfCombination = choosenExchanges.at(-1)!.restockAccumulatedProfit;
      const restockCount = choosenExchanges.at(-1)!.restockCount;

      // fill the remaining cargo with the next best exchanges
      // first, find the remaining cargo size
      const usedLot = choosenExchanges.at(-1)!.restockAccumulatedLot;
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
        profitOfCombination += addedProfit;
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

export const calculateOneGraphBuyCombinations = (
  prices: GetPricesProducts,
  maxLot: number,
  bargain: PlayerConfigBargain,
  prestige: PlayerConfigPrestige,
  roles: PlayerConfigRoles,
  productUnlockStatus: PlayerConfigProductUnlockStatus
): OnegraphBuyCombinations => {
  // skip if Server side rendering
  if (typeof window === "undefined") {
    return {};
  }

  // skip if no price data
  if (!prices || Object.keys(prices).length === 0) {
    return {};
  }

  const start = performance.now();

  const { bargainPercent, raisePercent, bargainFatigue, raiseFatigue, disabled: barginDisabled } = bargain;

  const pricesData: OnegraphPriceData = {};
  for (const fromCity of CITIES) {
    const fromCityMaster = CITY_BELONGS_TO[fromCity] ?? fromCity;
    const buyPrestige = PRESTIGES.find((p) => p.level === prestige[fromCityMaster]);
    if (!buyPrestige) {
      console.warn(`Prestige configurtation not found for ${fromCityMaster} level ${prestige[fromCityMaster]}`);
      continue;
    }

    const availableProducts = getProductsOfCity(fromCity)
      // exclude products that are not unlocked,
      // by default all products are unlocked, in productUnlockStatus the product should be set to false if the product is not unlocked
      .filter((product) => productUnlockStatus?.[product.name] ?? true);

    for (const toCity of CITIES) {
      if (fromCity === toCity) {
        continue;
      }

      // calculate buy price and buy lot
      let pdtPrices: OnegraphPriceDataItem[] = availableProducts.flatMap((product) => {
        if (product.type === "Craft") {
          return [];
        }

        const name = product.name;
        const priceData = prices[name];

        // guard
        let buyPrice = priceData?.["buy"]?.[fromCity]?.price ?? 0;

        if (buyPrice === 0) {
          console.warn(`No buy price data for ${name} in ${fromCity}`);
          return [];
        }

        let buyLot = product.buyLot?.[fromCity] ?? 0;
        if (buyLot === 0) {
          console.warn(`Buy lot not found for ${name} in ${fromCity}`);
          return [];
        }

        // apply bargain to buy price
        const bargain = barginDisabled ? 0 : bargainPercent ?? 0;
        buyPrice = buyPrice * (1 - bargain / 100);

        // get prestiged tax to buy price
        let tax = buyPrestige.specialTax[fromCity] ?? buyPrestige.generalTax;

        // get game event tax variation
        const eventTaxVariation = getGameEventTaxVariation(product, fromCity);

        // sum all tax variation
        tax += eventTaxVariation;

        // don't apply tax to buy price yet, tax should be deducted from profit later

        // get role resonance skill buy more percent
        const resonanceSkillBuyMorePercent = getResonanceSkillBuyMorePercent(roles, product, fromCity);

        // get prestige buy more percent
        const prestigeBuyMorePercent = buyPrestige.extraBuy * 100;

        // get game event buy more percent
        const eventBuyMorePercent = getGameEventBuyMorePercent(product, fromCity);

        // sum all buy more percent
        const totalBuyMorePercent = resonanceSkillBuyMorePercent + prestigeBuyMorePercent + eventBuyMorePercent;

        // apply buy more percent to buy lot
        buyLot = Math.round((buyLot * (100 + totalBuyMorePercent)) / 100);

        return [
          {
            name,
            product,
            priceData,
            buyPrice,
            buyLot,
            sellPrice: -1,
            singleProfit: -1,
            buyTaxRate: tax,
          },
        ];
      }, []);

      const toCityMaster = CITY_BELONGS_TO[toCity] ?? toCity;
      const sellPrestige = PRESTIGES.find((p) => p.level === prestige[toCityMaster]);
      if (!sellPrestige) {
        console.warn(`Prestige configurtation not found for ${toCityMaster} level ${prestige[toCityMaster]}`);
        continue;
      }

      // calculate sell price and songle profit
      pdtPrices = pdtPrices
        .flatMap((it) => {
          const { priceData, buyPrice } = it;
          let sellPrice = priceData?.["sell"]?.[toCity]?.price ?? 0;

          if (sellPrice === 0) {
            console.warn(`No sell price data for ${it.name} in ${toCity}`);
            return [];
          }

          // apply raise to sell price
          const raise = barginDisabled ? 0 : raisePercent ?? 0;
          sellPrice = Math.round(sellPrice * (1 + raise / 100));

          // calculate profit
          let singleProfit = sellPrice - buyPrice;

          // get prestiged tax
          const sellTaxRate = sellPrestige.specialTax[toCity] ?? sellPrestige.generalTax;

          // deduct sell tax, it applies to (sell price - buy price before buy tax)
          singleProfit -= singleProfit * sellTaxRate;

          // deduct buy tax from profit
          singleProfit -= buyPrice * it.buyTaxRate;

          // round
          singleProfit = Math.round(singleProfit);

          // skip if loss
          if (singleProfit <= 0) {
            return [];
          }

          return [
            {
              ...it,
              sellPrice,
              singleProfit,
            },
          ];
        }, [])
        // sort by single profit
        .sort((a, b) => b.singleProfit - a.singleProfit);

      pricesData[fromCity] = pricesData[fromCity] ?? {};
      pricesData[fromCity][toCity] = pdtPrices;
    }
  }

  // calculate all restock possibilities, from 0-50, go and return
  const buyCombinations: OnegraphBuyCombinations = {};
  for (const fromCity in pricesData) {
    for (const toCity in pricesData[fromCity]) {
      const priceData: OnegraphPriceDataItem[] = pricesData[fromCity][toCity]; // sorted

      for (let restock = 0; restock <= 50; restock++) {
        // start buying from the most profitable product, until maxLot is reached
        let usedLot = 0;
        let productIndex = 0;
        const buyCombination: OnegraphBuy[] = [];
        while (usedLot < maxLot && productIndex < priceData.length) {
          const pdt = priceData[productIndex];
          const avaiableLot = pdt.buyLot * (restock + 1);
          const buyLot = Math.min(maxLot - usedLot, avaiableLot);
          usedLot += buyLot;
          buyCombination.push({
            buyLot,
            name: pdt.name,
            profit: pdt.singleProfit * buyLot,
          });
          productIndex++;
        }

        buyCombinations[fromCity] = buyCombinations[fromCity] ?? {};
        buyCombinations[fromCity][toCity] = buyCombinations[fromCity][toCity] ?? {};

        const totalProfit = buyCombination.reduce((acc, it) => acc + it.profit, 0);
        let fatigue = getRouteFatigue(fromCity, toCity) ?? 0;
        if (!barginDisabled) {
          fatigue += bargainFatigue + raiseFatigue;
        }

        // if current profit equals the profit of the last restock, then it is wasting restock
        let lastNotWastingRestock = restock;
        const wastingRestock = restock > 0 && totalProfit === buyCombinations[fromCity][toCity][restock - 1]?.profit;
        if (wastingRestock) {
          // find the last not wasting restock
          const lastCombination = buyCombinations[fromCity][toCity][restock - 1];
          if (lastCombination.lastNotWastingRestock === restock - 1) {
            // this means the last restock is not wasting
            lastNotWastingRestock = restock - 1; // so for the current restock count, restock - 1 is the last not wasting restock
          } else {
            // if the last restock is wasting, then the last not wasting restock is the same as the last one
            lastNotWastingRestock = lastCombination.lastNotWastingRestock;
          }
        }

        // calculate the profit per restock
        // (currentProfit - zeroRestockProfit) / restock
        const zeroRestockProfit = buyCombinations[fromCity][toCity][0]?.profit ?? 0;
        const profitPerRestock = restock > 0 ? Math.round((totalProfit - zeroRestockProfit) / restock) : 0;

        buyCombinations[fromCity][toCity][restock] = {
          combinations: buyCombination,
          profit: totalProfit,
          restock,
          fatigue,
          profitPerFatigue: Math.round(totalProfit / fatigue),
          profitPerRestock,
          usedLot,
          lastNotWastingRestock,
        };
      }
    }
  }

  console.debug("calculateOneGraphBuyCombinations", performance.now() - start);

  return buyCombinations;
};

export const getOneGraphRecommendation = (
  restock: number,
  goAndReturn: boolean,
  fromCity: CityName,
  toCity: CityName,
  buyCombinationsGo: OnegraphBuyCombinations,
  buyCombinationsRt?: OnegraphBuyCombinations
): OnegraphBuyCombinationStats[] => {
  // if simple go, the return the one with the request restock
  if (!goAndReturn) {
    const reco = buyCombinationsGo[fromCity]?.[toCity]?.[restock];
    if (!reco) {
      return [];
    }
    return [reco];
  }

  // if go and return, then find the best combination of go and return
  // given restock number is the total restock number for both go and return
  let results: OnegraphBuyCombinationStats[] = [];
  let maxProfit = 0;
  for (let goRestock = 0; goRestock <= restock; goRestock++) {
    const returnRestock = restock - goRestock;
    const goStats = buyCombinationsGo[fromCity]?.[toCity]?.[goRestock];
    if (!goStats) {
      continue;
    }
    const returnStats = buyCombinationsRt![toCity]?.[fromCity]?.[returnRestock];
    if (!returnStats) {
      continue;
    }
    const totalProfit = goStats?.profit + returnStats?.profit;

    if (totalProfit > maxProfit) {
      maxProfit = totalProfit;
      results = [
        { ...goStats, restock: goRestock },
        { ...returnStats, restock: returnRestock },
      ];
    }
  }

  return results;
};

const getResonanceSkillBuyMorePercent = (roles: PlayerConfigRoles, product: Product, fromCity: CityName) => {
  // get role resonance skill buy more percent
  let resonanceSkillBuyMorePercent = 0;
  for (const roleName in roles) {
    // player's role's data
    const playerRole = roles[roleName];
    const level = playerRole.resonance;
    if (level === 0) {
      continue;
    }

    // get resonance skill for this role and level
    const rollResonances = ROLE_RESONANCE_SKILLS[roleName];
    const skill = rollResonances?.[level];
    if (!skill) {
      console.warn(`Resonance skill not found for ${roleName} level ${level}`);
      continue;
    }

    // get buy more percent for this product and city
    const buyMore = skill.buyMore;
    const currentProductBuyMorePercent = buyMore?.product?.[product.name] ?? 0;
    resonanceSkillBuyMorePercent += currentProductBuyMorePercent;

    const currentCityBuyMorePercent = product.type === "Special" ? buyMore?.city?.[fromCity] ?? 0 : 0;
    resonanceSkillBuyMorePercent += currentCityBuyMorePercent;
  }

  return resonanceSkillBuyMorePercent;
};

const getGameEventBuyMorePercent = (product: Product, fromCity: CityName) => {
  let eventBuyMorePercent = 0;
  for (const event of EVENTS) {
    const currentProductBuyMorePercent = event.buyMore?.product?.[product.name] ?? 0;
    eventBuyMorePercent += currentProductBuyMorePercent;

    const currentCityBuyMorePercent = product.type === "Special" ? event.buyMore?.city?.[fromCity] ?? 0 : 0;
    eventBuyMorePercent += currentCityBuyMorePercent;
  }
  return eventBuyMorePercent;
};

const getGameEventTaxVariation = (product: Product, fromCity: CityName) => {
  let eventTaxVariation = 0;
  for (const event of EVENTS) {
    const currentProductTaxVariation = event.taxVariation?.product?.[product.name] ?? 0;
    eventTaxVariation += currentProductTaxVariation;

    const currentCityTaxVariation = product.type === "Special" ? event.taxVariation?.city?.[fromCity] ?? 0 : 0;
    eventTaxVariation += currentCityTaxVariation;
  }
  return eventTaxVariation;
};
