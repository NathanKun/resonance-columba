import { columbaCol } from "@/firebase/app";
import {
  FireStoreProductCityPrice,
  GetPricesProduct,
  GetPricesProductCityPrice,
  GetPricesProductPrice,
  GetPricesProducts,
} from "@/interfaces/get-prices";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const docRef = columbaCol.doc("products");
    const docSnapshot = await docRef.get();
    const data = docSnapshot.data();
    if (!data) {
      throw new Error("no data");
    }

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
          } as GetPricesProductCityPrice;
        }
        pdtData[type] = typeData;
      }
      responseData[pdtName] = pdtData;
    }

    return Response.json({ data: responseData });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }); // todo: status code and interface
  }
}
