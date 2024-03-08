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
        typeData[city] = {
          trend: cityData.trend,
          variation: cityData.variation,
          time: cityData.time._seconds,
          price: cityData.price,
        } as GetPricesProductCityPrice;
      }
      pdtData[type] = typeData;
    }
    responseData[pdtName] = pdtData;
  }

  return responseData;
};
