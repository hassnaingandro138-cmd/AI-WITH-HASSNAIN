import type { IncomingMessage, ServerResponse } from "node:http";

const FAST_MODEL = "gemini-3.1-flash-lite";

export default function handler(
  req: IncomingMessage,
  res: ServerResponse
): void {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: "Method not allowed. Use GET." }));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configured = Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  res.end(
    JSON.stringify({
      ok: true,
      configured,
      model: FAST_MODEL,
      status: configured ? "connected" : "missing_key",
    })
  );
}
