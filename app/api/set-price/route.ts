import { db } from "@/firebase/app";
import { SetPriceFirestoreRequest, SetPriceRequest } from "@/interfaces/set-price";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { product, city, variation, trend, type }: SetPriceRequest = await request.json();

    if (!product || !city || (!variation && !trend) || (type !== "buy" && type !== "sell")) {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }

    const docRef = db.collection("columba").doc("products");

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
