import { columbaCol } from "@/firebase/app";
import { GetPricesProducts, LbGetPricesProducts } from "@/interfaces/get-prices";
import { SetPriceFirestoreRequest, SetPriceHistoryItem, SetPriceRequest } from "@/interfaces/set-price";
import { lowBandwidthResponse } from "@/utils/price-api-compressor";
import { convertFirebaseDataToGetPricesData } from "@/utils/price-api-utils";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import rateLimit from "../../../utils/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

const getIp = (request: Request): string => {
  let ipAddress = request.headers.get("x-real-ip");

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!ipAddress && forwardedFor) {
    ipAddress = forwardedFor?.split(",").at(0) ?? "Unknown";
  }

  return ipAddress!;
};

export async function POST(request: Request) {
  // rate limit
  try {
    await limiter.check(300, "CACHE_TOKEN"); // 10 requests per minute
  } catch {
    return Response.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  try {
    // validate request
    const { product, city, variation, trend, type }: SetPriceRequest = await request.json();

    if (!product || !city || (!variation && !trend) || (type !== "buy" && type !== "sell")) {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }

    // update products doc
    const productsDocRef = columbaCol.doc("products");

    const setPricePath = `${product}.${type}.${city}`;
    const setPriceItem: SetPriceHistoryItem = {
      variation,
      trend,
      time: FieldValue.serverTimestamp(), // Update the timestamp field with the value from the server
      ip: getIp(request),
    };
    const setPriceData: any = {};
    for (const key of Object.keys(setPriceItem)) {
      setPriceData[`${setPricePath}.${key}` as keyof typeof setPriceData] =
        setPriceItem[key as keyof SetPriceHistoryItem];
    }

    await productsDocRef.update(setPriceData as SetPriceFirestoreRequest);

    // fetch updated data
    const docSnapshot = await productsDocRef.get();
    const newFirebaseData = docSnapshot.data()!;

    // before retuning the data, update the historical data
    const historiesDocRef = columbaCol.doc("histories");
    const setHistoryData = {
      [setPricePath]: FieldValue.arrayUnion({
        ...setPriceItem,
        time: Timestamp.now(), // FieldValue.serverTimestamp() not supported in arrayUnion
      }),
    };
    await historiesDocRef.update(setHistoryData);

    // return updated data
    const responseData: GetPricesProducts = convertFirebaseDataToGetPricesData(newFirebaseData);

    const lbResponseData: LbGetPricesProducts = lowBandwidthResponse(responseData);

    return Response.json({ data: lbResponseData });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }, { status: 500 });
  }
}
