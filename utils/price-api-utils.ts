import { CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import {
  FireStoreProductCityPrice,
  FirestoreProducts,
  GetPricesProduct,
  GetPricesProductCityPrice,
  GetPricesProductPrice,
  GetPricesProducts,
} from "@/interfaces/get-prices";

export const convertFirebaseDataToGetPricesData = (data: FirestoreProducts): GetPricesProducts => {
  const responseData: GetPricesProducts = {};
  for (const pdtName in data) {
    const pdt = data[pdtName];
    const pdtData: GetPricesProduct = {};
    for (const type in pdt) {
      const typeData: GetPricesProductPrice = {};
      for (const city in pdt[type]) {
        const cityData: FireStoreProductCityPrice = pdt[type][city];
        let price = cityData.price;
        // no price in data, calculate it with base price and variation
        if (!price) {
          price = calculatePrice(pdtName, city as CityName, type as "buy" | "sell", cityData.variation) ?? undefined;
        }

        typeData[city] = {
          trend: cityData.trend,
          variation: cityData.variation,
          time: cityData.time._seconds,
          price,
        } as GetPricesProductCityPrice;
      }
      pdtData[type] = typeData;
    }
    responseData[pdtName] = pdtData;
  }

  return responseData;
};

const calculatePrice = (pdtName: string, city: CityName, type: "buy" | "sell", variation: number): number | null => {
  const pdtInfo = PRODUCTS.find((p) => p.name === pdtName);
  let basePrice: number | null = 0;
  if (pdtInfo) {
    if (type === "buy") {
      basePrice = pdtInfo.buyPrices[city];
    } else {
      basePrice = pdtInfo.sellPrices[city];
    }
  }
  if (basePrice) {
    return Math.round((basePrice * variation) / 100);
  }
  return null;
};
