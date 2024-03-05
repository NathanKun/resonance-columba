import { columbaCol } from "@/firebase/app";
import { SetPriceFirestoreRequest, SetPriceHistoryItem, SetPriceRequest } from "@/interfaces/set-price";
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
    const setPriceData: SetPriceFirestoreRequest = {
      [setPricePath]: setPriceItem,
    };
    await productsDocRef.update(setPriceData);

    // fetch updated data
    const docSnapshot = await productsDocRef.get();
    const returnData = docSnapshot.data();

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
    return Response.json({ data: returnData });
  } catch (e) {
    console.log(e);
    return Response.json({ error: "failed to load data" }, { status: 500 });
  }
}
