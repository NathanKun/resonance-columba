import { CityName } from "@/data/Cities";
import { db } from "@/firebase/app";
import { Trend } from "@/interfaces/SellingPrice";

export interface FirestoreProductPrice {
  [key: CityName]: {
    trend: Trend;
    variation: number;
    time: {
      _seconds: number;
      _nanoseconds: number;
    };
  };
}

export interface FirestoreProduct {
  [type: string]: FirestoreProductPrice;
}

export interface FirestoreProducts {
  [key: string]: FirestoreProduct;
}

export interface GetPricesResponse {
  data: FirestoreProducts;
}

export const revalidate = 60;

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
