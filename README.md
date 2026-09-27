# My private Azure chatbot — V1

## V1 outcome

A private web chatbot that you can reach through an Azure URL at any time. The browser sends messages to this Node.js server; only the server calls OpenAI. Your API key is never sent to the browser.

## Architecture

```text
Browser → Node/Express server → OpenAI Responses API
                 ↑
         Azure Key Vault / App Service settings (production)
```

## What is included now

- Plain browser chat UI
- `POST /api/chat` server endpoint
- Recent in-browser conversation context (last 12 messages)
- Private password login with a signed, HttpOnly seven-day cookie
- Basic limits for password attempts and chat requests
- Request-size protection and friendly errors
- `GET /health` endpoint for Azure

## Not included yet

- Azure deployment and Key Vault configuration
- Permanent chat history or database
- Streaming responses, uploads, voice, tools, or multi-user accounts

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env` and add your real OpenAI API key locally.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

Never commit `.env` or paste its key into the browser.

## Required environment settings

| Name | Local use | Azure production use |
| --- | --- | --- |
| `OPENAI_API_KEY` | `.env` | Key Vault secret reference |
| `OPENAI_MODEL` | `.env` | App Service setting |
| `CHAT_ACCESS_PASSWORD` | `.env` | Key Vault secret reference |
| `SESSION_SECRET` | `.env` | Key Vault secret reference |
| `PORT` | `.env` (optional) | supplied by App Service |

## Next phase

Set the two new secrets locally, test the password gate, then deploy to Azure App Service with Always On and Azure Key Vault.
