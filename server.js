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
const maxMessageLength = 4_000;
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

  if (!history.length || history.at(-1).role !== "user") {
    return response.status(400).json({ error: "Send a user message to start or continue a chat." });
  }

  try {
    const result = await openai.responses.create({
      model: process.env.OPENAI_MODEL,
      instructions: "You are a helpful, clear chatbot. Be concise unless the user asks for detail.",
      input: history,
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
