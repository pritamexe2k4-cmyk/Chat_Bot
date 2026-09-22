# Chat_Bot

Small **FastAPI** chat app backed by **Azure OpenAI**, with a browser UI.

## Why

Minimal, owned chat stack: typed request body, short conversation history, Azure deployment config via env — useful as a clean Azure OpenAI + FastAPI reference.

## Stack

- Python · FastAPI · Uvicorn
- Azure OpenAI (`openai` Azure client)
- Static HTML UI (`app/static`)
- Docker (optional)

## Run

```bash
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set AZURE_OPENAI_* values
uvicorn app.main:app --reload
```

Open http://localhost:8000.

**API:** `POST /api/chat` · `GET /health`

### Docker

```bash
docker build -t azure-chatbot .
docker run --env-file .env -p 8000:8000 azure-chatbot
```

## Status

Working local/Docker chat client against a configured Azure OpenAI deployment. Not a multi-tenant product.
