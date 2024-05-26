import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProduct, GetPricesProducts } from "@/interfaces/get-prices";
import { ProductRow } from "@/interfaces/prices-table";
import { Product } from "@/interfaces/product";

export const isCraftOnlyProduct = (pdtName: string) => {
  return PRODUCTS.find((pdt) => pdt.name === pdtName)?.type === "Craft";
};

export const highestProfitCity = (row: ProductRow): CityName => {
  const highestProfitCity = CITIES.reduce((a, b) =>
    (row.targetCity[a]?.singleProfit ?? 0) > (row.targetCity[b]?.singleProfit ?? 0) ? a : b
  );
  return highestProfitCity;
};

export const calculateProfit = (
  product: Product,
  currentColumnCity: CityName,
  sourceCity: CityName,
  isBuyableCity: boolean,
  prices: GetPricesProducts
) => {
  // not calculating profit of products in thier buyable city, except for craftable products
  if (isBuyableCity && product.type !== "Craft") {
    return 0;
  }

  // check if product price in prices object has the price property
  const realTimeSellPrice = prices[product.name]?.["sell"]?.[currentColumnCity]?.price;
  const realTimeBuyPrice = prices[product.name]?.["buy"]?.[sourceCity]?.price;
  if (realTimeSellPrice && realTimeBuyPrice) {
    return Math.round(realTimeSellPrice - realTimeBuyPrice); // no bargain profit
  }

  let profit = 0;
  const productPrices: GetPricesProduct = prices[product.name];

  // for a buyable (non craftable) product
  if (product.type !== "Craft") {
    const productBuyPrice = productPrices.buy?.[sourceCity]?.price ?? 0;
    const productSellPrice = productPrices.sell?.[currentColumnCity]?.price ?? 0;

    profit = Math.round(productSellPrice - productBuyPrice);
  }
  // a craftable product with materials
  else if (product.type === "Craft" && product.craft) {
    const craft = product.craft;
    let productCraftPrice = 0;
    const materials = Object.keys(craft);
    for (const material of materials) {
      const materialQuantity = craft[material]!;

      const materialBuy = prices[material]?.buy;
      if (!materialBuy) {
        continue;
      }

      const materialBuyableCities = Object.keys(materialBuy);
      const materialBuyableCity = materialBuyableCities[0];
      if (!materialBuyableCity) {
        continue;
      }

      const materialBuyPrice = materialBuy[materialBuyableCity]?.price ?? 0;
      productCraftPrice += materialBuyPrice * materialQuantity;
    }

    if (productCraftPrice === 0) {
      profit = 0;
    } else {
      const productSellPrice = productPrices.sell?.[currentColumnCity]?.price ?? 0;
      profit = Math.round(productSellPrice - productCraftPrice);
    }
  }

  return profit;
};
