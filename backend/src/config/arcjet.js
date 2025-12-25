import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import { ENV } from "./env.js";

// initialize Arcjet with security rules
export const aj = arcjet({
  key: ENV.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    // shield protects your app from common attacks e.g. SQL injection, XSS, CSRF attacks
    shield({ mode: "LIVE" }),

    // bot detection - block all bots except search engines
    detectBot({
      mode: ENV.NODE_ENV === "development" ? "DRY_RUN" : "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),

    // rate limiting with token bucket algorithm
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // tokens added per interval
      interval: 10, // interval in seconds (10 seconds)
      capacity: 15, // maximum tokens in bucket
    }),
  ],
});
