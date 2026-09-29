const app = document.querySelector("#app");
const loginPanel = document.querySelector("#login-panel");
const loginForm = document.querySelector("#login-form");
const passwordInput = document.querySelector("#password-input");
const loginStatus = document.querySelector("#login-status");
const contextForm = document.querySelector("#context-form");
const skipContextButton = document.querySelector("#skip-context");
const chatForm = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");
const sendButton = document.querySelector("#send-button");
const status = document.querySelector("#status");

const views = Object.fromEntries([...document.querySelectorAll(".view")].map((view) => [view.id, view]));
const maxSessionMessages = 12;
let history = [];
let context = {};

void loadSession();

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Unlocking...";
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not sign in.");
    passwordInput.value = "";
    showApp();
    showView("context-view");
  } catch (error) {
    loginStatus.textContent = error.message || "Could not sign in.";
  }
});

contextForm.addEventListener("submit", (event) => {
  event.preventDefault();
  context = readContext();
  showView("home-view");
});

skipContextButton.addEventListener("click", () => {
  context = {};
  contextForm.reset();
  showView("home-view");
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => openAction(button.dataset.action));
});
document.querySelectorAll("[data-back-home]").forEach((button) => button.addEventListener("click", () => showView("home-view")));
document.querySelector("#urgent-help").addEventListener("click", () => showView("urgent-view"));
document.querySelector("#brand-home").addEventListener("click", () => showView("home-view"));
document.querySelector("#edit-context").addEventListener("click", () => showView("context-view"));
document.querySelector("#logout").addEventListener("click", logout);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content) return;
  if (history.filter((message) => message.role === "user").length >= maxSessionMessages) {
    status.textContent = "This session has reached its message limit. Start a new private session later.";
    return;
  }

  const userMessage = { role: "user", content };
  history.push(userMessage);
  addMessage(userMessage);
  input.value = "";
  setBusy(true, "Thinking...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, context })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "The request failed.");
    const assistantMessage = { role: "assistant", content: body.text || "I am sorry, I could not form a response just now." };
    history.push(assistantMessage);
    addMessage(assistantMessage);
    setBusy(false, "");
  } catch (error) {
    setBusy(false, error.message || "The chatbot could not answer. Please try again.");
  }
});

async function loadSession() {
  try {
    const response = await fetch("/api/session");
    const body = await response.json();
    if (body.authenticated) {
      showApp();
      showView("context-view");
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function readContext() {
  const formData = new FormData(contextForm);
  return Object.fromEntries(["focus", "day", "tone", "helpful", "perspective"].flatMap((key) => {
    const value = formData.get(key);
    return value ? [[key, value]] : [];
  }));
}

function openAction(action) {
  if (action === "reset") return showView("reset-view");
  showView("chat-view");
  if (!history.length) {
    const opening = action === "write"
      ? "Write without editing yourself. I will read it with you when you are ready."
      : "What feels most present for you right now?";
    addMessage({ role: "assistant", content: opening });
  }
  input.focus();
}

function showView(id) {
  Object.values(views).forEach((view) => { view.hidden = view.id !== id; });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showApp() {
  loginPanel.hidden = true;
  app.hidden = false;
}

function showLogin() {
  app.hidden = true;
  loginPanel.hidden = false;
  loginStatus.textContent = "";
  passwordInput.focus();
}

async function logout() {
  await fetch("/api/logout", { method: "POST" });
  history = [];
  context = {};
  contextForm.reset();
  messages.replaceChildren();
  showLogin();
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
