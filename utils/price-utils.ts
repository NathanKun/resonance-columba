import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProduct, GetPricesProducts } from "@/interfaces/get-prices";
import { ProductRow } from "@/interfaces/prices-table";
import { Product } from "@/interfaces/product";

export const isCraftableProduct = (pdtName: string) => {
  const craft = PRODUCTS.find((pdt) => pdt.name === pdtName)?.craft;
  return craft ? true : false;
};

export const highestProfitCity = (row: ProductRow) => {
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
    return Math.round(realTimeSellPrice * 1.04 - realTimeBuyPrice * 0.92);
  }

  let profit = 0;
  const productPrices: GetPricesProduct = prices[product.name];

  // for a buyable (non craftable) product
  if (!product.craft) {
    // a product can be bought from multiple cities, so we need to find the city with the highest profit,
    // but this will also make the calculate profit unclear which city it is from
    for (const buyCity of Object.keys(product.buyPrices)) {
      let productBuyPrice = product.buyPrices[buyCity] ?? 0;
      const buyVariation = productPrices.buy?.[buyCity]?.variation ?? 0;
      productBuyPrice = Math.round((productBuyPrice * buyVariation) / 100) * 0.92; // estimated buy price

      let productSellPrice = product.sellPrices[currentColumnCity] ?? 0;
      const sellVariation = productPrices.sell?.[currentColumnCity]?.variation ?? 0;
      productSellPrice = Math.round((productSellPrice * sellVariation) / 100) * 1.04; // estimated sell price

      const cityProfit = Math.round(productSellPrice - productBuyPrice);
      profit = Math.max(profit, cityProfit);
    }
  }
  // a craftable product but with static price
  else if (product.craft.static) {
    const productBuyPrice = product.craft.static;
    let productSellPrice = product.sellPrices[currentColumnCity] ?? 0;

    const sellVariation = productPrices.sell?.[currentColumnCity]?.variation ?? 0;
    productSellPrice = Math.round((productSellPrice * sellVariation) / 100) * 1.04; // estimated sell price

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
      materialBuyPrice = Math.round((materialBuyPrice * materialBuyVariation) / 100) * 0.92; // estimated buy price

      productCraftPrice += materialBuyPrice * materialQuantity;
    }

    if (productCraftPrice === 0) {
      profit = 0;
    } else {
      let productSellPrice = product.sellPrices[currentColumnCity] ?? 0;
      const sellVariation = productPrices.sell?.[currentColumnCity]?.variation ?? 0;
      productSellPrice = Math.round((productSellPrice * sellVariation) / 100) * 1.04; // estimated sell price

      profit = Math.round(productSellPrice - productCraftPrice);
    }
  }

  return profit;
};
