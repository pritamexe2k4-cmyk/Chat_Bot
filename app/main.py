import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import AzureOpenAI
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
load_dotenv()

app = FastAPI(title="Azure Chatbot")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    history: list[dict[str, str]] = Field(default_factory=list)


def get_client() -> AzureOpenAI:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")

    if not endpoint or not api_key:
        raise HTTPException(
            status_code=500,
            detail="Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.",
        )

    return AzureOpenAI(
        api_key=api_key,
        api_version=api_version,
        azure_endpoint=endpoint,
    )


@app.get("/")
def index() -> FileResponse:
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        raise HTTPException(status_code=500, detail="AZURE_OPENAI_DEPLOYMENT is not configured.")

    messages = [{"role": "system", "content": os.getenv(
        "SYSTEM_PROMPT", "You are a helpful, concise assistant."
    )}]
    messages.extend(
        {
            "role": item["role"],
            "content": item["content"],
        }
        for item in request.history[-20:]
        if item.get("role") in {"user", "assistant"} and item.get("content")
    )
    messages.append({"role": "user", "content": request.message})

    try:
        response = get_client().chat.completions.create(
            model=deployment,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Azure OpenAI request failed: {error}") from error

    answer = response.choices[0].message.content
    return {"reply": answer or "I could not generate a response."}
