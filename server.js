import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import OpenAI from "openai";

const requiredSettings = ["OPENAI_API_KEY", "OPENAI_MODEL", "CHAT_ACCESS_PASSWORD", "SESSION_SECRET"];
const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);

if (missingSettings.length > 0) {
  console.error(`Missing required environment settings: ${missingSettings.join(", ")}`);
  process.exit(1);
}

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const port = Number(process.env.PORT || 3000);
const maxMessages = 12;
const maxMessageLength = 1_600;
const maxOutputTokens = 300;
const sessionCookieName = "chatbot_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;
const requestWindows = new Map();

app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get("/api/session", (request, response) => {
  response.status(200).json({ authenticated: Boolean(readSession(request)) });
});

app.post("/api/login", (request, response) => {
  if (!allowRequest(`login:${request.ip}`, 5, 15 * 60 * 1_000)) {
    return response.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
  }

  const password = typeof request.body?.password === "string" ? request.body.password : "";
  if (!passwordMatches(password)) {
    return response.status(401).json({ error: "That password is not correct." });
  }

  response.setHeader("Set-Cookie", createSessionCookie());
  return response.status(200).json({ authenticated: true });
});

app.post("/api/logout", (_request, response) => {
  response.setHeader("Set-Cookie", `${sessionCookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`);
  return response.status(204).end();
});

app.post("/api/chat", requireAuthentication, async (request, response) => {
  if (!allowRequest(`chat:${request.ip}`, 30, 60 * 1_000)) {
    return response.status(429).json({ error: "Please wait a moment before sending more messages." });
  }

  const history = cleanHistory(request.body?.history);
  const context = cleanContext(request.body?.context);

  if (!history.length || history.at(-1).role !== "user") {
    return response.status(400).json({ error: "Send a user message to start or continue a chat." });
  }

  try {
    const result = await openai.responses.create({
      model: process.env.OPENAI_MODEL,
      instructions: buildInstructions(context),
      input: history,
      max_output_tokens: maxOutputTokens,
      store: false
    });

    return response.status(200).json({ text: result.output_text });
  } catch (error) {
    console.error("OpenAI request failed", {
      name: error?.name,
      status: error?.status,
      message: error?.message
    });

    return response.status(502).json({
      error: "The chatbot could not answer just now. Please try again."
    });
  }
});

app.listen(port, () => {
  console.log(`Chatbot is running at http://localhost:${port}`);
});

function cleanHistory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-maxMessages)
    .filter((message) => message && ["user", "assistant"].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: typeof message.content === "string" ? message.content.trim().slice(0, maxMessageLength) : ""
    }))
    .filter((message) => message.content.length > 0);
}

function cleanContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const allowed = {
    focus: new Set(["study pressure", "work stress", "relationships or loneliness", "overthinking"]),
    day: new Set(["student", "working professional", "both or between things"]),
    tone: new Set(["calm and gentle", "direct and practical", "reflective"]),
    helpful: new Set(["writing it out", "a small action plan", "grounding", "talking it through"]),
    perspective: new Set(["psychology and science", "philosophy or life wisdom", "faith or spirituality", "practical only"])
  };

  return Object.fromEntries(
    Object.entries(allowed).flatMap(([key, choices]) => choices.has(value[key]) ? [[key, value[key]]] : [])
  );
}

function buildInstructions(context) {
  const contextSummary = Object.entries(context)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");

  return `You are Still, a calm wellbeing companion for adults (18+) in India.
Your role is to support everyday reflection around stress, overwhelm, loneliness, work pressure, or study pressure.
You are not a therapist, doctor, emergency service, or a substitute for professional or human support.

Be warm, clear, and concise. Ask at most one thoughtful question at a time. Prefer one small practical next step over a long plan.
Do not diagnose conditions, assess whether someone has a disorder, recommend medication, give medical advice, promise confidentiality, or claim a person will be safe.
Do not say you are human, watching them, or able to contact emergency services.
Do not claim to speak for God, know fate, or use faith to pressure or shame someone. If faith or spirituality was selected, frame it as an optional perspective: "Some people find this helpful," and keep the person's agency central.
If the person describes immediate danger, an intent to harm themselves or someone else, or being unable to stay safe, respond briefly and compassionately. Tell them to call 112 in India for immediate emergency help, call Tele-MANAS on 14416 for mental-health support, and contact a trusted person nearby. Do not continue ordinary coaching in that response.

The user selected the following optional context for this browser session only: ${contextSummary || "none"}.`;
}

function requireAuthentication(request, response, next) {
  if (!readSession(request)) {
    return response.status(401).json({ error: "Please sign in to use the chatbot." });
  }
  return next();
}

function passwordMatches(password) {
  const suppliedHash = crypto.createHash("sha256").update(password).digest();
  const expectedHash = crypto.createHash("sha256").update(process.env.CHAT_ACCESS_PASSWORD).digest();
  return crypto.timingSafeEqual(suppliedHash, expectedHash);
}

function createSessionCookie() {
  const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + sessionLifetimeSeconds * 1_000 })).toString("base64url");
  const signature = sign(payload);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${sessionCookieName}=${payload}.${signature}; Max-Age=${sessionLifetimeSeconds}; Path=/; HttpOnly; SameSite=Strict${secure}`;
}

function readSession(request) {
  const token = parseCookies(request.headers.cookie)[sessionCookieName];
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !signaturesMatch(signature, sign(payload))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader.split(";").map((pair) => {
      const separator = pair.indexOf("=");
      return separator < 0 ? ["", ""] : [pair.slice(0, separator).trim(), pair.slice(separator + 1).trim()];
    })
  );
}

function sign(value) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("base64url");
}

function signaturesMatch(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function allowRequest(key, limit, windowMs) {
  const now = Date.now();
  const current = requestWindows.get(key)?.filter((timestamp) => timestamp > now - windowMs) || [];
  if (current.length >= limit) return false;
  current.push(now);
  requestWindows.set(key, current);
  return true;
}
