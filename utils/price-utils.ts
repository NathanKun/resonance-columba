import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProduct, GetPricesProducts } from "@/interfaces/get-prices";
import { ProductRow } from "@/interfaces/prices-table";
import { Product } from "@/interfaces/product";

export const isCraftableProduct = (pdtName: string) => {
  const craft = PRODUCTS.find((pdt) => pdt.name === pdtName)?.craft;
  return craft ? true : false;
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
  if (isBuyableCity) {
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
  if (!product.craft) {
    let productBuyPrice = product.buyPrices[sourceCity] ?? 0;
    const buyVariation = productPrices.buy?.[sourceCity]?.variation ?? 0;
    productBuyPrice = Math.round((productBuyPrice * buyVariation) / 100); // no bargain buy price

    let productSellPrice = product.sellPrices[currentColumnCity] ?? 0;
    const sellVariation = productPrices.sell?.[currentColumnCity]?.variation ?? 0;
    productSellPrice = Math.round((productSellPrice * sellVariation) / 100); // no bargain sell price

    profit = Math.round(productSellPrice - productBuyPrice);
  }
  // a craftable product but with static price
  else if (product.craft.static) {
    const productBuyPrice = product.craft.static;
    let productSellPrice = product.sellPrices[currentColumnCity] ?? 0;

    const sellVariation = productPrices.sell?.[currentColumnCity]?.variation ?? 0;
    productSellPrice = Math.round((productSellPrice * sellVariation) / 100);

    profit = Math.round(productSellPrice - productBuyPrice);
  }
  // a craftable product with materials
  else if (product.craft && !product.craft.static) {
    const craft = product.craft;
    let productCraftPrice = 0;
    const materials = Object.keys(craft);

    for (const material of materials) {
      const materialQuantity = craft[material]!;
      // I assume the sourceCity of a craftable product is the same as the sourceCity of its materials,
      // otherwise the calculation below will be incorrect
      const materialBuyVariation = prices[material]?.buy?.[sourceCity]?.variation ?? 0;
      let materialBuyPrice = PRODUCTS.find((p) => p.name === material)?.buyPrices?.[sourceCity] ?? 0;
      materialBuyPrice = Math.round((materialBuyPrice * materialBuyVariation) / 100); // no bargain buy price

      productCraftPrice += materialBuyPrice * materialQuantity;
    }

    if (productCraftPrice === 0) {
      profit = 0;
    } else {
      let productSellPrice = product.sellPrices[currentColumnCity] ?? 0;
      const sellVariation = productPrices.sell?.[currentColumnCity]?.variation ?? 0;
      productSellPrice = Math.round((productSellPrice * sellVariation) / 100); // no bargain sell price

      profit = Math.round(productSellPrice - productCraftPrice);
    }
  }

  return profit;
};
