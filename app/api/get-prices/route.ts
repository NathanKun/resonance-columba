import { columbaCol } from "@/firebase/app";
import { GetPricesProducts, LbGetPricesProducts } from "@/interfaces/get-prices";
import { lowBandwidthResponse } from "@/utils/price-api-compressor";
import { convertFirebaseDataToGetPricesData } from "@/utils/price-api-utils";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
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

    return Response.json({ data: lbResponseData });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }); // todo: status code and interface
  }
}
