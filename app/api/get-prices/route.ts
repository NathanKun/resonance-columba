import { columbaCol } from "@/firebase/app";
import { GetPricesProducts, LbGetPricesProducts } from "@/interfaces/get-prices";
import { lowBandwidthResponse } from "@/utils/price-api-compressor";
import { convertFirebaseDataToGetPricesData } from "@/utils/price-api-utils";

export const dynamic = "force-static";
export const revalidate = 60;

let cache: LbGetPricesProducts | null = null;
let cacheTime = 0;

export async function GET(request: Request) {
  if (cache && Date.now() - cacheTime < revalidate * 1000) {
    console.log("Returning cached data cached at " + cacheTime);
    return Response.json({ data: cache });
  }

  try {
    console.log("Fetching data");

    const docRef = columbaCol.doc("products");
    const docSnapshot = await docRef.get();
    const data = docSnapshot.data();
    if (!data) {
      throw new Error("no data");
    }

    //这应该能临时清除单晶硅和蕾丝连衣裙数据
    data["法兰绒"]["buy"] = {};

    const responseData: GetPricesProducts = convertFirebaseDataToGetPricesData(data);

    const lbResponseData: LbGetPricesProducts = lowBandwidthResponse(responseData);

    cache = lbResponseData;
    cacheTime = Date.now();
    console.log("Cached at " + cacheTime);

    return Response.json({ data: lbResponseData });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }); // todo: status code and interface
  }
}
