import { CityName } from "@/data/Cities";
import { db } from "@/firebase/app";
import { Trend } from "@/interfaces/SellingPrice";
import { FieldValue } from "firebase-admin/firestore";

interface SetPriceFirestoreRequest {
  [propPath: string]: {
    variation?: number;
    trend?: Trend;
    time: FieldValue;
  };
}

export type ExchangeType = "buy" | "sell";

export interface SetPriceRequest {
  product: string;
  city: CityName;
  type: ExchangeType;
  variation?: number;
  trend?: Trend;
}

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
