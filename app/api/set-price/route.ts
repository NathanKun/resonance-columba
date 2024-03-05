import { columbaCol } from "@/firebase/app";
import { SetPriceFirestoreRequest, SetPriceRequest } from "@/interfaces/set-price";
import { FieldValue } from "firebase-admin/firestore";
import rateLimit from "../../../utils/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function POST(request: Request) {
  try {
    await limiter.check(300, "CACHE_TOKEN"); // 10 requests per minute
  } catch {
    return Response.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  try {
    const { product, city, variation, trend, type }: SetPriceRequest = await request.json();

    if (!product || !city || (!variation && !trend) || (type !== "buy" && type !== "sell")) {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }

    const docRef = columbaCol.doc("products");

    // Update the timestamp field with the value from the server
    const data: SetPriceFirestoreRequest = {
      [`${product}.${type}.${city}`]: {
        variation,
        trend,
        time: FieldValue.serverTimestamp(),
      },
    };
    await docRef.update(data);

    const docSnapshot = await docRef.get();
    return Response.json({ data: docSnapshot.data() });
  } catch (e) {
    console.log(e);
    return Response.json({ error: "failed to load data" }, { status: 500 });
  }
}
