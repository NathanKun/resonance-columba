import { CityName } from "@/data/Cities";
import { db } from "@/firebase/app";
import { Trend } from "@/interfaces/SellingPrice";

export interface FirestoreProducts {
  [key: string]: {
    [key: CityName]: {
      trend: Trend;
      variation: number;
      time: {
        _seconds: number;
        _nanoseconds: number;
      };
    };
  };
}

export interface GetPricesResponse {
  data: FirestoreProducts;
}

export async function GET(request: Request) {
  try {
    const docRef = db.collection("columba").doc("products");
    const docSnapshot = await docRef.get();

    return Response.json({ data: docSnapshot.data() as FirestoreProducts });
  } catch (e) {
    console.log(e);
    return Response.json({ error: "failed to load data" }); // todo: status code and interface
  }
}
