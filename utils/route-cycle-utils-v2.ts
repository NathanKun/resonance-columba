import { CITIES, CITY_BELONGS_TO, CityName } from "@/data/Cities";
import { findFatigue } from "@/data/Fatigue";
import { PRESTIGES } from "@/data/Prestige";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProducts } from "@/interfaces/get-prices";
import {
  PlayerConfigEvents,
  PlayerConfigPrestige,
  PlayerConfigProductUnlockStatus,
  PlayerConfigRoles,
} from "@/interfaces/player-config";
import { Product } from "@/interfaces/product";
import { BargainSummary, simulateBargain } from "./bargain-utils";
import {
  GENERAL_PROFIT_INDEX_RESTOCK_FATIGUE_CONSTANT,
  calculateGeneralProfitIndex,
  getGameEventBuyMorePercent,
  getGameEventTaxVariation,
  getResonanceSkillBuyMorePercent,
  getResonanceSkillTaxCutPercent,
} from "./route-page-utils";

interface Buy {
  pdtName: string;
  lot: number;
}

interface GraphItem {
  weight: number;

  restock: number;
  bargainCount: number;
  raiseCount: number;
  bargainExpectedRate: number;
  raiseExpectedRate: number;

  routeFatigue: number;
  bargainTotalFagigue: number;
  raiseTotalFatigue: number;
  totalFatigue: number;

  profit: number;
  profitPerFatigue: number;
  generalProfitIndex: number;

  buys: Buy[];
}

interface Graph {
  [fromCity: CityName]: {
    [toCity: CityName]: GraphItem;
  };
}

interface SingleProductBuyPossibility {
  bargainCount: number;
  raiseCount: number;
  profit: number;
}

interface Route {
  fromCity: CityName;
  toCity: CityName;
  graphItem: GraphItem;
}

interface FindRouteFunctions {
  calculateUpperbound: () => number;
  calculateWeight: (search: number, it: GraphItem) => number;
}

interface RouteCycleInputs {
  maxBargainCount: number;
  maxRaiseCount: number;
  maxRestockCount: number;
}

export const calculateRouteCycleV2 = (
  prices: GetPricesProducts,
  maxLot: number,
  roles: PlayerConfigRoles,
  prestige: PlayerConfigPrestige,
  productUnlockStatus: PlayerConfigProductUnlockStatus,
  playerConfigEvents: PlayerConfigEvents,
  bargainSummery: BargainSummary,
  routeCycleInputs: RouteCycleInputs
) => {
  const start = performance.now();

  const { maxBargainCount, maxRaiseCount, maxRestockCount } = routeCycleInputs;

  const graph: Graph = {};

  for (const fromCity of CITIES) {
    const fromCityMaster = CITY_BELONGS_TO[fromCity] ?? fromCity;
    const buyPrestige = PRESTIGES.find((p) => p.level === prestige[fromCityMaster]);
    if (!buyPrestige) {
      console.warn(`Prestige configurtation not found for ${fromCityMaster} level ${prestige[fromCityMaster]}`);
      continue;
    }

    // get resonance skill tax cut percent of this city
    const resonanceSkillTaxCutPercent = getResonanceSkillTaxCutPercent(roles, fromCity);

    const availableProducts = PRODUCTS.filter((product) => product.buyPrices[fromCity])
      // exclude products that are not unlocked,
      // by default all products are unlocked, in productUnlockStatus the product should be set to false if the product is not unlocked
      .filter((product) => productUnlockStatus?.[product.name] ?? true);

    for (const toCity of CITIES) {
      if (fromCity === toCity) {
        continue;
      }

      const toCityMaster = CITY_BELONGS_TO[toCity] ?? toCity;
      const sellPrestige = PRESTIGES.find((p) => p.level === prestige[toCityMaster]);
      if (!sellPrestige) {
        console.warn(`Prestige configurtation not found for ${toCityMaster} level ${prestige[toCityMaster]}`);
        continue;
      }

      // calculate bargain expected rate & fatigue
      const bargainResults = [...Array(maxBargainCount + 1).keys()].map((bargainCount) =>
        simulateBargain(prestige, bargainSummery, fromCity, "bargain", bargainCount)
      );
      const raiseResults = [...Array(maxRaiseCount + 1).keys()].map((raiseCount) =>
        simulateBargain(prestige, bargainSummery, toCity, "raise", raiseCount)
      );

      // get profit for each product
      const productsBuyPossibilities: {
        [pdtName: string]: SingleProductBuyPossibility[];
      } = {};
      for (const product of availableProducts) {
        const pdtName = product.name;
        if (product.buyLot?.[fromCity] ?? 0 > 0) {
          const buyPrice = prices[pdtName]?.buy[fromCity]?.price ?? 0;
          if (buyPrice <= 0) {
            continue;
          }

          const sellPrice = prices[pdtName]?.sell[toCity]?.price ?? 0;
          if (sellPrice <= 0) {
            continue;
          }

          // calculate single product profit, with all bargain & raise possibilities
          const buyPosibilities: SingleProductBuyPossibility[] = [];

          for (let bargainCount = 0; bargainCount <= maxBargainCount; bargainCount++) {
            for (let raiseCount = 0; raiseCount <= maxRaiseCount; raiseCount++) {
              // get prestiged tax to buy price
              let buyTaxRate = buyPrestige.specialTax[fromCityMaster] ?? buyPrestige.generalTax;

              // get game event buy tax variation
              const eventTaxVariation = getGameEventTaxVariation(product, fromCity, playerConfigEvents);

              // sum all buy tax variation
              buyTaxRate += eventTaxVariation + resonanceSkillTaxCutPercent;

              // get prestiged sell tax to profit
              let sellTaxRate = sellPrestige.specialTax[toCityMaster] ?? sellPrestige.generalTax;

              // sum all sell tax variation
              sellTaxRate += resonanceSkillTaxCutPercent;

              // calculate bargain rate
              let bargainRate = bargainResults[bargainCount].expectedRate;
              bargainRate = 1 - Math.min(bargainRate, 0.2);

              // apply bargain to buy price
              const bargainedBuyPrice = buyPrice * bargainRate;

              // calculate raise rate
              let raiseRate = raiseResults[raiseCount].expectedRate;
              raiseRate = 1 + Math.min(raiseRate, 0.2);

              // apply raise to sell price
              const raisedSellPrice = sellPrice * raiseRate;

              let singleProfit = raisedSellPrice - bargainedBuyPrice;
              singleProfit -= singleProfit * sellTaxRate; // Tax when selling
              singleProfit -= buyPrice * buyTaxRate; // Cost when buying

              buyPosibilities.push({
                bargainCount,
                raiseCount,
                profit: singleProfit,
              });
            }
          }

          productsBuyPossibilities[pdtName] = buyPosibilities;
        }
      }

      const doBuy = (
        restock: number,
        bargainCount: number,
        raiseCount: number
      ): {
        buys: Buy[];
        profit: number;
      } => {
        const productsBuyPossibility: { product: Product; buy: SingleProductBuyPossibility }[] = [];
        for (const pdtName in productsBuyPossibilities) {
          const product = PRODUCTS.find((p) => p.name === pdtName)!;
          const buy = productsBuyPossibilities[pdtName].find(
            (p) => p.bargainCount === bargainCount && p.raiseCount === raiseCount
          );
          const pdtProfit = buy?.profit ?? 0;

          if (pdtProfit <= 0) {
            continue;
          }

          productsBuyPossibility.push({ product, buy: buy! });
        }

        productsBuyPossibility.sort((a, b) => b.buy.profit - a.buy.profit);

        let profit = 0;
        let cap = maxLot;
        const buys: Buy[] = [];
        for (const productBuyPossibility of productsBuyPossibility) {
          const { product, buy } = productBuyPossibility;
          const { profit: pdtProfit } = buy;

          // get role resonance skill buy more percent
          const resonanceSkillBuyMorePercent = getResonanceSkillBuyMorePercent(roles, product, fromCity);

          // get prestige buy more percent
          const prestigeBuyMorePercent = buyPrestige.extraBuy * 100;

          // get game event buy more percent
          const eventBuyMorePercent = getGameEventBuyMorePercent(product, fromCity, playerConfigEvents);

          // sum all buy more percent
          const totalBuyMorePercent = resonanceSkillBuyMorePercent + prestigeBuyMorePercent + eventBuyMorePercent;

          const buyLot = Math.min(
            cap,
            Math.round((product.buyLot![fromCity]! * (100 + totalBuyMorePercent)) / 100) * (restock + 1)
          );

          profit += pdtProfit * buyLot;
          cap -= buyLot;
          buys.push({
            pdtName: product.name,
            lot: buyLot,
          });
          if (cap === 0) {
            break;
          }
        }

        return { profit: Math.round(profit), buys };
      };

      // run the doBuy function for each restock, bargain, raise count combination
      const routeFatigue = findFatigue(fromCity, toCity, roles);
      const possibleGraphItems: GraphItem[] = [];
      for (let restock = 0; restock <= maxRestockCount; restock++) {
        for (let bargainCount = 0; bargainCount <= maxBargainCount; bargainCount++) {
          for (let raiseCount = 0; raiseCount <= maxRaiseCount; raiseCount++) {
            const { profit, buys } = doBuy(restock, bargainCount, raiseCount);
            // const bargainTotalFagigue = bargainCount * bargainOnceFatigue;
            // const raiseTotalFatigue = raiseCount * raiseOnceFatigue;
            const bargainTotalFagigue = bargainResults[bargainCount].expectedFatigue;
            const raiseTotalFatigue = raiseResults[raiseCount].expectedFatigue;
            const bargainExpectedRate = bargainResults[bargainCount].expectedRate;
            const raiseExpectedRate = raiseResults[raiseCount].expectedRate;
            const totalFatigue = routeFatigue + bargainTotalFagigue + raiseTotalFatigue;
            const profitPerFatigue = totalFatigue > 0 ? Math.round(profit / totalFatigue) : 0;
            const generalProfitIndex =
              totalFatigue > 0 ? calculateGeneralProfitIndex(profit, totalFatigue, restock) : 0;

            possibleGraphItems.push({
              restock,
              bargainCount,
              raiseCount,
              bargainExpectedRate,
              raiseExpectedRate,
              routeFatigue,
              bargainTotalFagigue,
              raiseTotalFatigue,
              totalFatigue,
              profit,
              profitPerFatigue,
              generalProfitIndex,
              buys,
              weight: -1,
            });
          }
        }
      }

      // sort the general profit index
      possibleGraphItems.sort((a, b) => b.generalProfitIndex - a.generalProfitIndex);

      // get the best one
      const bestGraphItem = possibleGraphItems[0];

      graph[fromCity] = graph[fromCity] ?? {};
      graph[fromCity][toCity] = bestGraphItem;
    }
  }

  // const byProfit: FindRouteFunctions = {
  //   // graph item weight w = search * totalFatigue - profit
  //   calculateUpperbound: () => {
  //     let upperbound = 0;
  //     for (const fromCity of CITIES) {
  //       for (const toCity of CITIES) {
  //         if (fromCity === toCity) {
  //           continue;
  //         }
  //         const graphItem = graph[fromCity]?.[toCity] ?? 0;
  //         upperbound = Math.max(upperbound, graphItem.profitPerFatigue);
  //       }
  //     }

  //     return upperbound;
  //   },
  //   calculateWeight: (search, it) => {
  //     return search * it.totalFatigue - it.profit;
  //   },
  // };

  const byGeneralProfitIndex: FindRouteFunctions = {
    calculateUpperbound: () => {
      let upperbound = 0;
      for (const fromCity of CITIES) {
        for (const toCity of CITIES) {
          if (fromCity === toCity) {
            continue;
          }
          const graphItem = graph[fromCity]?.[toCity] ?? 0;
          upperbound = Math.max(upperbound, graphItem.generalProfitIndex);
        }
      }

      return upperbound;
    },
    calculateWeight: (search, it) => {
      return search * (it.totalFatigue + it.restock * GENERAL_PROFIT_INDEX_RESTOCK_FATIGUE_CONSTANT) - it.profit;
    },
  };

  const findRoutes = (indexDef: FindRouteFunctions) => {
    // find upperbound
    let upperbound = indexDef.calculateUpperbound();
    let lowerbound = 0;

    // binary search best profit
    const EPS = 1;
    let cycleResult = null;
    while (upperbound - lowerbound > EPS) {
      let search = (upperbound + lowerbound) / 2;

      // update graph
      // search for a negative cycle
      let hasNegativeWeight = false;
      for (const fromCity of CITIES) {
        for (const toCity of CITIES) {
          if (fromCity === toCity) {
            continue;
          }
          const it = graph[fromCity][toCity];
          it.weight = indexDef.calculateWeight(search, it);
          if (it.weight < 0) {
            hasNegativeWeight = true;
          }
        }
      }

      // quick check if no any negative weight in graph
      if (!hasNegativeWeight) {
        upperbound = search;
        continue;
      }

      // bellman-ford search for negative cycle
      const bellmanFord = () => {
        const CITY_NUM = CITIES.length;
        let fatigue: number[] = Array(CITY_NUM).fill(0);
        let predecessor: number[] = Array(CITY_NUM).fill(-1);
        fatigue[0] = 0;

        // relax edges repeatedly
        for (let _ = 0; _ < CITY_NUM - 1; _++) {
          for (let u = 0; u < CITY_NUM; u++) {
            const uCity = CITIES[u];
            for (let v = 0; v < CITY_NUM; v++) {
              const vCity = CITIES[v];
              const weight = graph[uCity]?.[vCity]?.weight ?? 0;
              if (fatigue[u] + weight < fatigue[v]) {
                fatigue[v] = fatigue[u] + weight;
                predecessor[v] = u;
              }
            }
          }
        }

        // check for negative-weight cycles
        for (let u = 0; u < CITY_NUM; u++) {
          const uCity = CITIES[u];
          for (let v = 0; v < CITY_NUM; v++) {
            const vCity = CITIES[v];
            const weight = graph[uCity]?.[vCity]?.weight ?? 0;
            if (u !== v && fatigue[u] + weight < fatigue[v]) {
              let cycle: number[] = [];
              // trace back the cycle
              for (let _ = 0; _ < CITY_NUM; _++) {
                v = predecessor[v];
              }
              let cycle_vertex = v;
              while (true) {
                cycle.push(cycle_vertex);
                cycle_vertex = predecessor[cycle_vertex];
                if (cycle_vertex === v || cycle_vertex === -1) {
                  break;
                }
              }
              cycle.reverse();

              return cycle;
            }
          }
        }
        return null;
      };
      const result = bellmanFord(); // return a list oc CITIES index representing all cities in the cycle
      if (result) {
        lowerbound = search;
        cycleResult = result;
      } else {
        upperbound = search;
      }
    }

    const routes: Route[] = [];
    if (cycleResult) {
      for (let i = 0; i < cycleResult.length; i++) {
        const fromCity = CITIES[cycleResult[i]];
        const toCity = CITIES[cycleResult[(i + 1) % cycleResult.length]];
        const graphItem = graph[fromCity][toCity];
        routes.push({
          fromCity,
          toCity,
          graphItem,
        });
      }
    }

    console.debug(routes);

    const totalProfit = Math.round(routes.reduce((acc, route) => acc + route.graphItem.profit, 0));
    const totalFatigue = routes.reduce((acc, route) => acc + route.graphItem.totalFatigue, 0);
    const totalRestock = routes.reduce((acc, route) => acc + route.graphItem.restock, 0);
    const totalBargain = routes.reduce((acc, route) => acc + route.graphItem.bargainCount, 0);
    const totalRaise = routes.reduce((acc, route) => acc + route.graphItem.raiseCount, 0);
    const profitPerFatigue = Math.round(totalProfit / totalFatigue);
    const generalProfitIndex = calculateGeneralProfitIndex(totalProfit, totalFatigue, totalRestock);

    console.debug(
      `Total profit: ${totalProfit}, Total fatigue: ${totalFatigue}, Total restock: ${totalRestock}, Total bargain: ${totalBargain}, Total raise: ${totalRaise}`
    );
    console.debug(`profitPerFatigue: ${profitPerFatigue}, generalProfitIndex: ${generalProfitIndex}`);
    return routes;
  };

  // findRoutes(profitIndex);

  const results = findRoutes(byGeneralProfitIndex);

  console.debug(`Calculate route cycle took ${performance.now() - start}ms`);

  return results;
};
