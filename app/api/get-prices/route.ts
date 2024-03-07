import { columbaCol } from "@/firebase/app";
import { FirestoreProducts } from "@/interfaces/get-prices";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const docRef = columbaCol.doc("products");
    const docSnapshot = await docRef.get();

    return Response.json({ data: docSnapshot.data() as FirestoreProducts });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }); // todo: status code and interface
  }
}
