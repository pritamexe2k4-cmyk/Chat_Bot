const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");
const sendButton = document.querySelector("#send-button");
const newChatButton = document.querySelector("#new-chat");
const status = document.querySelector("#status");
const loginPanel = document.querySelector("#login-panel");
const chatApp = document.querySelector("#chat-app");
const loginForm = document.querySelector("#login-form");
const passwordInput = document.querySelector("#password-input");
const loginStatus = document.querySelector("#login-status");
const logoutButton = document.querySelector("#logout");

let history = [];

void loadSession();

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Unlocking…";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not sign in.");

    passwordInput.value = "";
    showChat();
  } catch (error) {
    loginStatus.textContent = error.message || "Could not sign in.";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content) return;

  const userMessage = { role: "user", content };
  history.push(userMessage);
  addMessage(userMessage);
  input.value = "";
  setBusy(true, "Thinking…");

  try {
    const apiResponse = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history })
    });
    const body = await apiResponse.json();

    if (!apiResponse.ok) throw new Error(body.error || "The request failed.");

    const assistantMessage = { role: "assistant", content: body.text };
    history.push(assistantMessage);
    addMessage(assistantMessage);
    setBusy(false, "");
  } catch (error) {
    setBusy(false, error.message || "The chatbot could not answer. Please try again.");
  }
});

newChatButton.addEventListener("click", () => {
  history = [];
  messages.innerHTML = "";
  addMessage({ role: "assistant", content: "New chat started. What is on your mind?" });
  input.focus();
});

logoutButton.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  history = [];
  showLogin();
});

async function loadSession() {
  try {
    const response = await fetch("/api/session");
    const body = await response.json();
    body.authenticated ? showChat() : showLogin();
  } catch {
    showLogin();
  }
}

function showChat() {
  loginPanel.hidden = true;
  chatApp.hidden = false;
  input.focus();
}

function showLogin() {
  chatApp.hidden = true;
  loginPanel.hidden = false;
  loginStatus.textContent = "";
  passwordInput.focus();
}

function addMessage({ role, content }) {
  const article = document.createElement("article");
  const paragraph = document.createElement("p");
  article.className = `message ${role}`;
  paragraph.textContent = content;
  article.append(paragraph);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
}

function setBusy(isBusy, message) {
  input.disabled = isBusy;
  sendButton.disabled = isBusy;
  status.textContent = message;
  if (!isBusy) input.focus();
}
