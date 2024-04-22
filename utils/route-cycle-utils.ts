import { CITIES, CITY_BELONGS_TO, CityName } from "@/data/Cities";
import { findFatigue } from "@/data/Fatigue";
import { PRESTIGES } from "@/data/Prestige";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProducts } from "@/interfaces/get-prices";
import { PlayerConfigPrestige, PlayerConfigRoles } from "@/interfaces/player-config";
import { Product } from "@/interfaces/product";
import {
  calculateGeneralProfitIndex,
  getGameEventBuyMorePercent,
  getGameEventTaxVariation,
  getResonanceSkillBuyMorePercent,
} from "./route-page-utils";

export const calculateRouteCycle = (
  prices: GetPricesProducts,
  maxLot: number,
  playerConfigRoles: PlayerConfigRoles,
  playerConfigPrestige: PlayerConfigPrestige
) => {
  const start = performance.now();

  const CITIY_NUM = CITIES.length;
  const MAX_RESTOCK = 3; // try to restock up to this on a same city
  const RESTOCK_THRESHOLD = 80000; // if a restock can make profit more than this, do it

  // 问题描述：
  // 有 CITIY_NUM 个城市，一个含有 PRODUCT_NUM 件商品的列表，一个容量为 CAPACITY 的货车。
  // 任意两个城市之间均可达，并存在疲劳 FATIGUE[i][j]。
  // 商品列表列出了第i个商品在第ji个城市的：可买入数量 PRODUCT_LOTS[i][j]、购入价 PRODUCT_BUY_PRICES[i][j]、卖出价 PRODUCT_SELL_PRICES[i][j]。
  // 找到这样的一个顶点和一条路径与买卖行动列表，使得移动总疲劳小于 MAX_FATIGUE 时，总利润 profit 最大，并且（总利润 profit /总疲劳 fatigue）最大。
  // 额外的约束条件：货车每次到站时，必须卖出所有商品并尽可能买入商品。

  // 预先计算每两个城市之间可以买卖的商品利润总额，PROFIT[i][j]表示从i城市买入到j城市卖出的总利润
  // PROFIT = np.zeros((CITIY_NUM, CITIY_NUM), dtype=int)
  const PROFIT: {
    [fromCity: CityName]: {
      [toCity: CityName]: {
        profit: number;
        restock: number;
      };
    };
  } = {};
  const BUYS: {
    [fromCity: CityName]: {
      [toCity: CityName]: {
        [restock: number]: [Product, number][];
      };
    };
  } = {}; // 从i城市买入到j城市卖出的商品列表和数量

  for (const fromCity of CITIES) {
    const fromCityMaster = CITY_BELONGS_TO[fromCity] ?? fromCity;
    const buyPrestige = PRESTIGES.find((prestige) => prestige.level === playerConfigPrestige[fromCityMaster]);
    if (!buyPrestige) {
      console.warn(
        `Prestige configurtation not found for ${fromCityMaster} level ${playerConfigPrestige[fromCityMaster]}`
      );
      continue;
    }

    BUYS[fromCity] = {};
    for (const toCity of CITIES) {
      BUYS[fromCity][toCity] = [];
      if (fromCity === toCity) {
        continue;
      }
      let profits: [Product, number][] = [];
      for (const product of PRODUCTS) {
        const toCityMaster = CITY_BELONGS_TO[toCity] ?? toCity;
        const sellPrestige = PRESTIGES.find((prestige) => prestige.level === playerConfigPrestige[toCityMaster]);
        if (!sellPrestige) {
          console.warn(
            `Prestige configurtation not found for ${toCityMaster} level ${playerConfigPrestige[toCityMaster]}`
          );
          continue;
        }

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

          // get prestiged tax to buy price
          let buyTax = buyPrestige.specialTax[fromCityMaster] ?? buyPrestige.generalTax;

          // get game event buy tax variation
          const eventTaxVariation = getGameEventTaxVariation(product, fromCity);

          // sum all buy tax variation
          buyTax += eventTaxVariation;

          // get prestiged sell tax to profit
          const sellTaxRate = sellPrestige.specialTax[toCityMaster] ?? sellPrestige.generalTax;

          let s_profit = sellPrice - buyPrice;
          s_profit -= s_profit * sellTaxRate; // Tax when selling
          s_profit -= buyPrice * buyTax; // Cost when buying

          profits.push([product, s_profit]);
        }
      }

      profits.sort((a, b) => b[1] - a[1]); // Sort in descending order

      // console.log(fromCity, toCity, profits);

      const doBuy = (buysCombination: [Product, number][], restock: number) => {
        let profit = 0;
        let cap = maxLot;
        for (let [product, pdtProfit] of profits) {
          if (pdtProfit > 0) {
            // get role resonance skill buy more percent
            const resonanceSkillBuyMorePercent = getResonanceSkillBuyMorePercent(playerConfigRoles, product, fromCity);

            // get prestige buy more percent
            const prestigeBuyMorePercent = buyPrestige.extraBuy * 100;

            // get game event buy more percent
            const eventBuyMorePercent = getGameEventBuyMorePercent(product, fromCity);

            // sum all buy more percent
            const totalBuyMorePercent = resonanceSkillBuyMorePercent + prestigeBuyMorePercent + eventBuyMorePercent;

            const buyLot = Math.min(
              cap,
              Math.round((product.buyLot![fromCity]! * (restock + 1) * (100 + totalBuyMorePercent)) / 100)
            );

            profit += pdtProfit * buyLot;
            cap -= buyLot;
            buysCombination.push([product, buyLot]);
            if (cap === 0) {
              break;
            }
          }
        }

        return profit;
      };

      let lastProfit = 0;
      let lastProfitRestock = 0;
      for (let restock = 0; restock < MAX_RESTOCK + 1; restock++) {
        const buyCombinations: [Product, number][] = [];
        const profit = doBuy(buyCombinations, restock);
        BUYS[fromCity][toCity][restock] = buyCombinations;

        // if profit is greater than last profit + restockThreshold, continue to next restock,
        // otherwise, stop, use last profit
        if (restock > 0 && profit - lastProfit <= RESTOCK_THRESHOLD) {
          break;
        }
        lastProfit = profit;
        lastProfitRestock = restock;
      }

      const fromCityData = PROFIT[fromCity] ?? {};
      fromCityData[toCity] = {
        profit: lastProfit,
        restock: lastProfitRestock,
      };
      PROFIT[fromCity] = fromCityData;
    }
  }

  // console.log("PROFIT", PROFIT);
  // console.log("BUYS", BUYS);

  // # 计算每单位疲劳的利润
  const PROFIT_PER_FATIGUE: {
    [fromCity: CityName]: {
      [toCity: CityName]: number;
    };
  } = {};

  for (const fromCity of CITIES) {
    for (const toCity of CITIES) {
      if (fromCity === toCity) {
        continue;
      }
      if (PROFIT[fromCity]?.[toCity] === undefined) {
        continue;
      }

      const fatigue = findFatigue(fromCity, toCity, playerConfigRoles);
      if (fatigue <= 0) {
        continue;
      }

      const profitPerDistance = PROFIT[fromCity][toCity].profit / fatigue;
      const fromCityData = PROFIT_PER_FATIGUE[fromCity] ?? {};
      fromCityData[toCity] = profitPerDistance;
      PROFIT_PER_FATIGUE[fromCity] = fromCityData;
    }
  }

  // console.log("PROFIT_PER_DISTANCE", PROFIT_PER_DISTANCE);

  // # 找到最大单次利润，理论上界
  let profitUpperBound = Math.max(...Object.values(PROFIT_PER_FATIGUE).map((v) => Math.max(...Object.values(v))));
  let profitLowerBound = 0;
  // console.log("profitUpperBound", profitUpperBound);

  const bellmanFord = (WEIGHT: number[][], search: number): [number[], number, number, number] | null => {
    let fatigue: number[] = Array(CITIY_NUM).fill(0);
    let predecessor: number[] = Array(CITIY_NUM).fill(-1);
    fatigue[0] = 0;
    // relax edges repeatedly
    for (let _ = 0; _ < CITIY_NUM - 1; _++) {
      for (let u = 0; u < CITIY_NUM; u++) {
        for (let v = 0; v < CITIY_NUM; v++) {
          if (fatigue[u] + WEIGHT[u][v] < fatigue[v]) {
            fatigue[v] = fatigue[u] + WEIGHT[u][v];
            predecessor[v] = u;
          }
        }
      }
    }

    // console.log(fatigue, predecessor);

    // check for negative-weight cycles
    for (let u = 0; u < CITIY_NUM; u++) {
      for (let v = 0; v < CITIY_NUM; v++) {
        if (u !== v && fatigue[u] + WEIGHT[u][v] < fatigue[v]) {
          let cycle: number[] = [];
          // trace back the cycle
          for (let _ = 0; _ < CITIY_NUM; _++) {
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

          // Calculate total profit of the cycle
          let cycle_profit = 0;
          for (let i = 0; i < cycle.length - 1; i++) {
            cycle_profit += PROFIT[CITIES[cycle[i]]]?.[CITIES[cycle[i + 1]]]?.profit ?? 0;
          }
          cycle_profit += PROFIT[CITIES[cycle[cycle.length - 1]]]?.[CITIES[cycle[0]]]?.profit ?? 0;

          // Calculate total fatigue of the cycle
          let cycle_fatigue = 0;
          for (let i = 0; i < cycle.length - 1; i++) {
            cycle_fatigue += findFatigue(CITIES[cycle[i]], CITIES[cycle[i + 1]], playerConfigRoles);
          }
          cycle_fatigue += findFatigue(CITIES[cycle[cycle.length - 1]], CITIES[cycle[0]], playerConfigRoles);

          // Calculate total profit/total fatigue of the cycle
          let cycle_profit_per_fatigue = cycle_profit / cycle_fatigue;

          if (cycle_profit_per_fatigue >= search) {
            return [cycle, cycle_profit, cycle_fatigue, cycle_profit_per_fatigue];
          }
        }
      }
    }
    return null;
  };

  // 二分查找最大利润 r
  const EPS = 1;
  let cycleResult: [number[], number, number, number] | null = null;
  while (profitUpperBound - profitLowerBound > EPS) {
    let search = (profitUpperBound + profitLowerBound) / 2;

    // 构造新图
    // 新图的权重为 w = r * d - p
    // 问题转化为求负权环
    let WEIGHT: number[][] = Array(CITIY_NUM)
      .fill(0)
      .map(() => Array(CITIY_NUM).fill(0));
    for (let i = 0; i < CITIY_NUM; i++) {
      for (let j = 0; j < CITIY_NUM; j++) {
        WEIGHT[i][j] =
          search * findFatigue(CITIES[i], CITIES[j], playerConfigRoles) - (PROFIT[CITIES[i]]?.[CITIES[j]]?.profit ?? 0);
      }
    }

    // console.log(WEIGHT, search);

    // 快速检查是否不存在负权
    if (!WEIGHT.some((row) => row.some((v) => v < 0))) {
      profitUpperBound = search;
      continue;
    }

    // Bellman-Ford算法求解负权环
    const res = bellmanFord(WEIGHT, search);
    if (res) {
      profitLowerBound = search;
      cycleResult = res;
    } else {
      profitUpperBound = search;
    }
  }

  // if (cycleResult) {
  //   console.log("基于以下参数搜索：");
  //   console.log(`容量: ${CAPACITY}`);
  //   console.log("最佳环路", cycleResult![0].map((i) => CITIES[i]).join("->"));
  //   console.log(`总利润: ${cycleResult![1]}, 总疲劳: ${cycleResult![2]}, 单位利润: ${cycleResult![3]}`);
  //   console.log(
  //     "各程利润",
  //     cycleResult![0].map(
  //       (i, idx) => PROFIT[CITIES[i]]?.[CITIES[cycleResult![0][(idx + 1) % cycleResult![0].length]]] ?? 0
  //     )
  //   );
  //   console.log(
  //     "购买列表",
  //     cycleResult![0]
  //       .map((i, idx) => {
  //         const fromCity = CITIES[i];
  //         const toCity = CITIES[cycleResult![0][(idx + 1) % cycleResult![0].length]];
  //         const restock = PROFIT[fromCity][toCity].restock;
  //         return BUYS[fromCity][toCity][restock].map(([product, lot]) => `${product.name} ${lot}`).join(", ");
  //       })
  //       .join("->")
  //   );
  // } else {
  //   console.log("无解");
  // }

  console.debug("Route Cycle Calculation Time:", performance.now() - start);

  // construct result data for display
  const cycle = cycleResult
    ? cycleResult[0].map((i, idx) => {
        const fromCity = CITIES[i];
        const toCity = CITIES[cycleResult![0][(idx + 1) % cycleResult![0].length]];
        const restock = PROFIT[fromCity][toCity].restock;
        return {
          fromCity,
          toCity,
          restock,
          profit: PROFIT[fromCity][toCity].profit,
          fatigue: findFatigue(fromCity, toCity, playerConfigRoles),
          profitPerFatigue: PROFIT_PER_FATIGUE[fromCity][toCity],
          buys: BUYS[fromCity][toCity][restock].map(([product, lot]) => ({
            product: product.name,
            lot,
          })),
        };
      })
    : [];

  return {
    cycle,
    totalProfit: cycleResult?.[1] ?? 0,
    totalFatigue: cycleResult?.[2] ?? 0,
    profitPerFatigue: cycleResult?.[3] ?? 0,
    generalProfitIndex: calculateGeneralProfitIndex(
      cycleResult?.[1] ?? 0,
      cycleResult?.[2] ?? 0,
      cycle.reduce((acc, cycleIt) => acc + cycleIt.restock, 0)
    ),
  };
};
