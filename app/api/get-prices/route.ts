import { columbaCol } from "@/firebase/app";
import { GetPricesProducts } from "@/interfaces/get-prices";
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

    const responseData: GetPricesProducts = convertFirebaseDataToGetPricesData(data);

    return Response.json({ data: responseData });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }); // todo: status code and interface
  }
}
