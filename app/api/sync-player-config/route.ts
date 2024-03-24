import { playerConfigsCol } from "@/firebase/app";
import { isValidPlayerConfig } from "@/utils/player-config-utils";
import rateLimit from "../../../utils/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function POST(request: Request) {
  // rate limit
  try {
    await limiter.check(300, "CACHE_TOKEN");
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

      const docRef = playerConfigsCol.doc(config.nanoid);
      await docRef.set(config);
      return Response.json({ data: true });
    }
    // get
    else {
      const playerConfigsDocRef = playerConfigsCol.doc(id);
      const doc = await playerConfigsDocRef.get();
      if (!doc.exists) {
        return Response.json({ data: null }, { status: 404 });
      }
      const data = doc.data();
      return Response.json({ data });
    }
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed to load data" }, { status: 500 });
  }
}
