import { playerConfigsCol } from "@/firebase/app";
import { isValidPlayerConfig } from "@/utils/player-config-utils";
import { FieldValue } from "firebase-admin/firestore";
import rateLimit from "../../../utils/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 100, // Max 500 users per interval
});

export async function POST(request: Request) {
  // rate limit
  try {
    const ip = getIp(request);
    await limiter.check(10, ip); // 10 requests per minute per ip
    await limiter.check(100, "CACHE_TOKEN"); // 100 requests per minute
  } catch {
    return Response.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  try {
    const { action, config, id } = await request.json();

    // guard
    if (!action) {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }

    if (action !== "set" && action !== "get") {
      return Response.json({ error: "invalid action" }, { status: 400 });
    }

    // set
    if (action === "set") {
      if (!config) {
        return Response.json({ error: "invalid config" }, { status: 400 });
      }

      if (!config.nanoid) {
        return Response.json({ error: "invalid config" }, { status: 400 });
      }

      if (!isValidPlayerConfig(config)) {
        return Response.json({ error: "invalid config" }, { status: 400 });
      }

      // add lastUpdated
      config.lastUpdated = FieldValue.serverTimestamp();

      const docRef = playerConfigsCol.doc(config.nanoid);

      await docRef.set(config, { merge: true });
      return Response.json({ data: true });
    }
    // get
    else {
      const docRef = playerConfigsCol.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return Response.json({ data: null }, { status: 404 });
      }

      const data = doc.data()!;

      // remove timestamps
      delete data.lastUpdated;
      delete data.lastAccessed;

      // set lastAccessed
      await docRef.update({
        lastAccessed: FieldValue.serverTimestamp(),
      });

      // return
      return Response.json({ data });
    }
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }, { status: 500 });
  }
}

const getIp = (request: Request): string => {
  let ipAddress = request.headers.get("x-real-ip");

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!ipAddress && forwardedFor) {
    ipAddress = forwardedFor?.split(",").at(0) ?? "Unknown";
  }

  return ipAddress!;
};
