# Azure Chatbot

A small FastAPI chat application using an Azure OpenAI deployment and a browser-based client.

## Local setup

1. Create and activate a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and set your Azure OpenAI values.

4. Start the server:

   ```powershell
   uvicorn app.main:app --reload
   ```

5. Open http://localhost:8000.

## Docker

```powershell
docker build -t azure-chatbot .
docker run --env-file .env -p 8000:8000 azure-chatbot
```

The API exposes `POST /api/chat` and `GET /health`.
