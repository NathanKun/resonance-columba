import { CityName } from "@/data/Cities";
import { db } from "@/firebase/app";
import { Trend } from "@/interfaces/SellingPrice";
import { FieldValue } from "firebase-admin/firestore";

interface SetPriceFirestoreRequest {
  [product: string]: {
    [city: CityName]: {
      variation: number;
      trend: Trend;
      time: FieldValue;
    };
  };
}

export interface SetPriceRequest {
  product: string;
  city: CityName;
  variation: number;
  trend: Trend;
}

export async function GET(request: Request) {
  try {
    const { product, city, variation, trend }: SetPriceRequest = await request.json();

    const docRef = db.collection("columba").doc("products");

    // Update the timestamp field with the value from the server
    const data: SetPriceFirestoreRequest = {};
    data[product] = {
      [city]: {
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
    return Response.json({ error: "failed to load data" });
  }
}
