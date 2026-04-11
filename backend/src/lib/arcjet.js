import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";
import { ENV } from "./env.js";

// If ARCJET_KEY is not configured (e.g. in local dev / test environments),
// export a no-op instance so the middleware passes through without crashing.
if (!ENV.ARCJET_KEY) {
  console.warn(
    "⚠️  ARCJET_KEY is not set — Arcjet rate limiting / bot protection is disabled."
  );
}

const aj = ENV.ARCJET_KEY
  ? arcjet({
      key: ENV.ARCJET_KEY,
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({
          mode: "LIVE",
          allow: [
            "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc.
          ],
        }),
        slidingWindow({
          mode: "LIVE",
          max: 100,
          interval: 60,
        }),
      ],
    })
  : // Minimal no-op object that satisfies the middleware contract
    {
      protect: async () => ({
        isDenied: () => false,
        results: [],
      }),
    };

export default aj;
