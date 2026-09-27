import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const requiredSettings = ["OPENAI_API_KEY", "OPENAI_MODEL"];
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

app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.post("/api/chat", async (request, response) => {
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

