import { getColumbaCol, isFirebaseConfigured } from "@/firebase/app";
import { GetPricesProducts, LbGetPricesProducts } from "@/interfaces/get-prices";
import { lowBandwidthResponse } from "@/utils/price-api-compressor";
import { convertFirebaseDataToGetPricesData } from "@/utils/price-api-utils";

export const dynamic = "force-dynamic";
export const revalidate = 90;

const UPSTREAM_PRICE_API = "https://www.resonance-columba.com/api/get-prices";
const UPSTREAM_HOST = new URL(UPSTREAM_PRICE_API).hostname.replace(/^www\./i, "");

let cache: LbGetPricesProducts | null = null;
let cacheTime = 0;

const isSameHostAsUpstream = (request: Request) => {
  const requestHost = new URL(request.url).hostname.replace(/^www\./i, "");
  return requestHost === UPSTREAM_HOST;
};

const fetchUpstreamPrices = async (): Promise<LbGetPricesProducts | null> => {
  try {
    const response = await fetch(UPSTREAM_PRICE_API, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`upstream returned ${response.status}`);
    }

    const json = await response.json();
    if (!json?.data) {
      throw new Error("upstream response has no data");
    }

    return json.data as LbGetPricesProducts;
  } catch (error) {
    console.error("Failed to fetch upstream prices", error);
    return null;
  }
};

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

export async function GET(request: Request) {
  if (cache && Date.now() - cacheTime < revalidate * 1000) {
    console.log("Returning cached data cached at " + cacheTime);
    return buildResponse(cache);
  }

  try {
    console.log("Fetching data");

    let lbResponseData: LbGetPricesProducts;

    if (!isFirebaseConfigured) {
      if (isSameHostAsUpstream(request)) {
        console.error("Firebase is not configured; refusing to fall back to the same host");
        return Response.json({ error: "firebase is not configured" }, { status: 503 });
      }

      console.warn("Firebase is not configured; falling back to upstream price data");
      const upstreamData = await fetchUpstreamPrices();
      if (!upstreamData) {
        throw new Error("no data source available");
      }
      lbResponseData = upstreamData;
    } else {
      const docRef = getColumbaCol().doc("productsV2");
      const docSnapshot = await docRef.get();
      const data = docSnapshot.data();
      if (!data) {
        throw new Error("no data");
      }

      const responseData: GetPricesProducts = convertFirebaseDataToGetPricesData(data);
      lbResponseData = lowBandwidthResponse(responseData);
    }

    cache = lbResponseData;
    cacheTime = Date.now();
    console.log("Cached at " + cacheTime);

    // return Response.json({ data: lbResponseData });
    return buildResponse(lbResponseData);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }, { status: 500 }); // todo: interface
  }
}
