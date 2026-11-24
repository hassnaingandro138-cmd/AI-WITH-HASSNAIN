import type { IncomingMessage, ServerResponse } from "node:http";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export const config = {
  maxDuration: 60,
};

const FAST_MODEL = "gemini-3.1-flash-lite";
const SMART_MODEL = "gemini-4-hydrogen";

const PERSONALITY_PROMPTS: Record<string, string> = {
  balanced:
    "Be warm, intelligent, well-structured, and naturally conversational.",
  coding:
    "Act as a senior software engineer. Write clean code with concise explanations and best practices.",
  tutor:
    "Act as a patient study tutor. Break down concepts step-by-step with clear analogies.",
  creative:
    "Be expressive, imaginative, and articulate in stories, brainstorms, and prose.",
  concise:
    "Be direct, crisp, and focused. Deliver accurate answers with minimal fluff.",
};

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: unknown;
  personalityPreset?: unknown;
  customInstructions?: unknown;
  responseSpeed?: unknown;
}

export interface NodeApiRequest extends IncomingMessage {
  body?: unknown;
}

let cachedGeminiClient: { key: string; client: GoogleGenAI } | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (cachedGeminiClient && cachedGeminiClient.key === apiKey) {
    return cachedGeminiClient.client;
  }
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  cachedGeminiClient = { key: apiKey, client };
  return client;
}

// Pre-warm SDK client instance on cold start
getGeminiClient();

function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: NodeApiRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return null;
      }
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const maxBytes = 1024 * 1024;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > maxBytes) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) {
    return null;
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildSystemInstruction(
  presetKey: string,
  customInstructions: string
): string {
  const presetPrompt =
    PERSONALITY_PROMPTS[presetKey] ?? PERSONALITY_PROMPTS.balanced;

  const now = new Date();
  const currentDateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentIsoDate = now.toISOString().split("T")[0];

  const baseInstruction = [
    "You are HASSNAIN AI, an intelligent, helpful, and natural AI assistant.",
    `Current real-world date & time: Today is ${currentDateStr} (${currentIsoDate}). Always use this exact current date as the reference for any questions about today, tomorrow, yesterday, dates, or time.`,
    "Multilingual capability: Automatically detect the user's language in their latest message and respond fluently in the exact same language and script:",
    "- If the user writes in English, reply in English.",
    "- If the user writes in Urdu script (اردو), reply naturally in proper Urdu script (اردو).",
    "- If the user writes in Roman Urdu (Urdu written with English/Latin letters, e.g., 'kya haal hai', 'mujhe code samjhao'), reply naturally in clear Roman Urdu.",
    "- If the user mixes languages (e.g., English technical terms in Roman Urdu), mirror that natural bilingual style.",
    "Formatting: Use clean Markdown formatting (headings, lists, tables, and fenced code blocks with language identifiers) whenever it improves readability.",
    `Style & Personality: ${presetPrompt}`,
  ];

  if (customInstructions.trim().length > 0) {
    baseInstruction.push(
      `Additional user preference for assistant behavior: ${customInstructions.trim()}`
    );
  }

  return baseInstruction.join("\n\n");
}

function extractSafeUpstreamMessage(rawMessage: string): string {
  const trimmed = rawMessage.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { message?: string };
      message?: string;
    };
    const inner = parsed?.error?.message ?? parsed?.message;
    if (typeof inner === "string" && inner.trim()) {
      try {
        const nested = JSON.parse(inner) as {
          error?: { message?: string };
        };
        if (typeof nested?.error?.message === "string") {
          return nested.error.message.trim();
        }
      } catch {
        return inner.trim();
      }
      return inner.trim();
    }
  } catch {
    // Plain text error
  }

  return trimmed;
}

function parseFriendlyError(err: unknown): { status: number; message: string } {
  const rawMessage =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const extracted = extractSafeUpstreamMessage(rawMessage);
  const lower = (extracted || rawMessage).toLowerCase();
  const explicitStatus =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : undefined;

  if (
    explicitStatus === 401 ||
    explicitStatus === 403 ||
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("permission_denied") ||
    lower.includes("403") ||
    lower.includes("401")
  ) {
    return {
      status: explicitStatus === 401 ? 401 : 403,
      message:
        "Gemini API authentication failed. Please verify that GEMINI_API_KEY is valid in your server environment variables.",
    };
  }

  if (
    explicitStatus === 429 ||
    lower.includes("resource_exhausted") ||
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return {
      status: 429,
      message:
        "Rate limit reached on the Gemini API free tier (429). Please wait a moment and try again.",
    };
  }

  if (
    explicitStatus === 404 ||
    lower.includes("not_found") ||
    lower.includes("404")
  ) {
    return {
      status: 404,
      message:
        "Requested Gemini AI model was not found or is temporarily unavailable.",
    };
  }

  if (
    lower.includes("fetch failed") ||
    lower.includes("enotfound") ||
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("network")
  ) {
    const causeMsg =
      err instanceof Error && "cause" in err && err.cause instanceof Error
        ? err.cause.message
        : "";
    return {
      status: 503,
      message: causeMsg
        ? `Network error reaching Gemini AI services (${causeMsg}). Please try again.`
        : "Network error reaching Gemini AI services. Please check your connection and try again.",
    };
  }

  if (
    explicitStatus === 503 ||
    lower.includes("unavailable") ||
    lower.includes("overloaded")
  ) {
    return {
      status: 503,
      message:
        extracted && extracted.length < 220 && !extracted.includes("AIza")
          ? extracted
          : "Gemini AI service is temporarily overloaded (503). Please try again in a moment.",
    };
  }

  return {
    status: explicitStatus && explicitStatus >= 400 ? explicitStatus : 500,
    message:
      extracted && extracted.length < 220 && !extracted.includes("AIza")
        ? extracted
        : "Unable to generate a response right now. Please try again.",
  };
}

function validateChatPayload(body: ChatRequestBody | null): {
  valid: boolean;
  error?: string;
  messages?: ChatMessageInput[];
  preset?: string;
  customInstructions?: string;
  responseSpeed?: "fast" | "smart";
} {
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return {
      valid: false,
      error: "Please enter a message before sending.",
    };
  }

  if (body.messages.length > 100) {
    return {
      valid: false,
      error: "Conversation context exceeded maximum length (100 messages).",
    };
  }

  const sanitizedMessages: ChatMessageInput[] = [];
  for (const item of body.messages) {
    if (!item || typeof item !== "object") {
      return { valid: false, error: "Invalid message format." };
    }
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;

    if (role !== "user" && role !== "assistant") {
      return { valid: false, error: "Invalid message role." };
    }
    if (typeof content !== "string") {
      return { valid: false, error: "Message content must be text." };
    }
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: "Messages cannot be empty." };
    }
    if (trimmed.length > 32000) {
      return {
        valid: false,
        error: "Message is too long. Please shorten it under 32,000 characters.",
      };
    }
    sanitizedMessages.push({ role, content: trimmed });
  }

  if (sanitizedMessages[sanitizedMessages.length - 1]?.role !== "user") {
    return {
      valid: false,
      error: "The latest message in the conversation must be from the user.",
    };
  }

  const preset =
    typeof body.personalityPreset === "string" &&
    Object.prototype.hasOwnProperty.call(
      PERSONALITY_PROMPTS,
      body.personalityPreset
    )
      ? body.personalityPreset
      : "balanced";

  const customInstructions =
    typeof body.customInstructions === "string"
      ? body.customInstructions.slice(0, 1000)
      : "";

  const responseSpeed = body.responseSpeed === "smart" ? "smart" : "fast";

  return {
    valid: true,
    messages: sanitizedMessages,
    preset,
    customInstructions,
    responseSpeed,
  };
}

export default async function handler(
  req: NodeApiRequest,
  res: ServerResponse
): Promise<void> {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed. Use POST." });
    return;
  }

  let parsedBody: unknown;
  try {
    parsedBody = await readJsonBody(req);
  } catch (err) {
    if (err instanceof Error && err.message === "PAYLOAD_TOO_LARGE") {
      sendJson(res, 413, { error: "Request payload exceeds 1MB limit." });
      return;
    }
    sendJson(res, 400, { error: "Invalid JSON request body." });
    return;
  }

  const validation = validateChatPayload(
    (parsedBody && typeof parsedBody === "object"
      ? parsedBody
      : null) as ChatRequestBody | null
  );

  if (!validation.valid || !validation.messages) {
    sendJson(res, 400, { error: validation.error ?? "Invalid request." });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.warn("[HASSNAIN AI /api/chat] GEMINI_API_KEY is not configured.");
    sendJson(res, 503, {
      error:
        "Gemini API key is not configured on the server. Please set GEMINI_API_KEY in your deployment environment variables.",
    });
    return;
  }

  const abortController = new AbortController();
  let clientDisconnected = false;

  res.on("close", () => {
    if (!res.writableFinished) {
      clientDisconnected = true;
      abortController.abort();
    }
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Content-Encoding", "none");
  res.setHeader("X-Accel-Buffering", "no");

  const flushable = res as ServerResponse & { flushHeaders?: () => void };
  flushable.flushHeaders?.();
  if (!clientDisconnected && !res.writableEnded) {
    res.write(": ok\n\n");
  }

  const sendEvent = (payload: Record<string, unknown>) => {
    if (!clientDisconnected && !res.writableEnded) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  };

  try {
    const useSmartMode = validation.responseSpeed === "smart";
    const recentMessages = validation.messages.slice(useSmartMode ? -24 : -14);
    const contents = recentMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const systemInstruction = buildSystemInstruction(
      validation.preset ?? "balanced",
      validation.customInstructions ?? ""
    );

    const attemptPlan = useSmartMode
      ? [
          { model: SMART_MODEL, thinking: ThinkingLevel.LOW },
          { model: FAST_MODEL, thinking: ThinkingLevel.MINIMAL },
        ]
      : [
          { model: FAST_MODEL, thinking: ThinkingLevel.MINIMAL },
          { model: SMART_MODEL, thinking: ThinkingLevel.LOW },
        ];

    let streamedAnyChunk = false;

    for (let i = 0; i < attemptPlan.length; i++) {
      const target = attemptPlan[i];
      const attemptAbort = new AbortController();
      const onParentAbort = () => attemptAbort.abort();
      abortController.signal.addEventListener("abort", onParentAbort, {
        once: true,
      });

      const firstChunkTimeoutMs =
        target.model === SMART_MODEL ? 20000 : 15000;
      let receivedFirstChunk = false;
      const timeoutHandle = setTimeout(() => {
        if (!receivedFirstChunk) {
          attemptAbort.abort();
        }
      }, firstChunkTimeoutMs);

      try {
        const stream = await ai.models.generateContentStream({
          model: target.model,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: target.thinking,
            },
            abortSignal: attemptAbort.signal,
          },
        });

        for await (const chunk of stream) {
          if (clientDisconnected) {
            break;
          }
          const chunkText = chunk.text;
          if (chunkText) {
            if (!receivedFirstChunk) {
              receivedFirstChunk = true;
              clearTimeout(timeoutHandle);
            }
            streamedAnyChunk = true;
            sendEvent({ type: "delta", text: chunkText });
          }
        }

        clearTimeout(timeoutHandle);
        abortController.signal.removeEventListener("abort", onParentAbort);

        if (streamedAnyChunk || clientDisconnected) {
          break;
        }

        if (i < attemptPlan.length - 1) {
          continue;
        }
      } catch (attemptErr) {
        clearTimeout(timeoutHandle);
        abortController.signal.removeEventListener("abort", onParentAbort);

        if (clientDisconnected) {
          return;
        }

        const timedOutBeforeFirstChunk =
          attemptAbort.signal.aborted && !abortController.signal.aborted;
        const parsed = parseFriendlyError(attemptErr);
        const isRetryable =
          timedOutBeforeFirstChunk ||
          parsed.status === 500 ||
          parsed.status === 503 ||
          parsed.status === 429;

        if (i < attemptPlan.length - 1 && !streamedAnyChunk && isRetryable) {
          await new Promise((resolve) =>
            setTimeout(resolve, i === 0 ? 350 : 750)
          );
          continue;
        }

        if (timedOutBeforeFirstChunk) {
          throw new Error(
            "Gemini AI response timed out due to high demand. Please try again."
          );
        }
        throw attemptErr;
      }
    }

    if (!clientDisconnected) {
      if (!streamedAnyChunk) {
        sendEvent({
          type: "error",
          status: 503,
          error:
            "Gemini AI did not return any text for this request. Please try again.",
        });
      } else {
        sendEvent({ type: "done" });
      }
      res.end();
    }
  } catch (err) {
    if (clientDisconnected) {
      return;
    }
    const friendly = parseFriendlyError(err);
    console.warn("[HASSNAIN AI /api/chat] Handled upstream response:", {
      status: friendly.status,
      message: friendly.message,
    });
    sendEvent({
      type: "error",
      status: friendly.status,
      error: friendly.message,
    });
    res.end();
  }
}
