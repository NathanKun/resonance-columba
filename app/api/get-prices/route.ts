import { columbaCol } from "@/firebase/app";
import { GetPricesProducts, LbGetPricesProducts } from "@/interfaces/get-prices";
import { lowBandwidthResponse } from "@/utils/price-api-compressor";
import { convertFirebaseDataToGetPricesData } from "@/utils/price-api-utils";

export const dynamic = "force-dynamic";
export const revalidate = 90;

let cache: LbGetPricesProducts | null = null;
let cacheTime = 0;

const buildResponse = (data: LbGetPricesProducts) => {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-max-age=${revalidate}`,
      "CDN-Cache-Control": `public, s-max-age=${revalidate}, stale-while-revalidate=0`,
      "Vercel-CDN-Cache-Control": `public, s-max-age=${revalidate}, stale-while-revalidate=0`,
    },
  });
};

export async function GET() {
  if (cache && Date.now() - cacheTime < revalidate * 1000) {
    console.log("Returning cached data cached at " + cacheTime);
    return buildResponse(cache);
  }

  try {
    console.log("Fetching data");

    const docRef = columbaCol.doc("productsV2");
    const docSnapshot = await docRef.get();
    const data = docSnapshot.data();
    if (!data) {
      throw new Error("no data");
    }

    const responseData: GetPricesProducts = convertFirebaseDataToGetPricesData(data);

    const lbResponseData: LbGetPricesProducts = lowBandwidthResponse(responseData);

    cache = lbResponseData;
    cacheTime = Date.now();
    console.log("Cached at " + cacheTime);

    // return Response.json({ data: lbResponseData });
    return buildResponse(lbResponseData);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }); // todo: status code and interface
  }
}
