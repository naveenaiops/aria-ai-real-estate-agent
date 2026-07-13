const chatButton = document.getElementById("chat-button");
const chatWindow = document.getElementById("chat-window");
const chatBackdrop = document.getElementById("chat-backdrop");
const closeButton = document.getElementById("close-chat");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBody = document.getElementById("chat-body");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const quickActions = document.getElementById("quick-actions");

const ASSISTANT_NAME = CONFIG.assistant || "Aria AI";
const CLOSE_DURATION = 300;
let isSending = false;

let sessionId = localStorage.getItem("sessionId");

if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
}

const BOT_RESPONSES = {
  "I'm looking for homes in my area":
    "Great! Share your preferred city or neighborhood, budget range, and bedroom count — I'll surface matching listings right away.",
  "What's the estimated price for a property?":
    "I can provide a market estimate. Tell me the property address or area, plus bedrooms and square footage, and I'll share a price range based on recent comps.",
  "I'd like to schedule a property visit":
    "Happy to arrange a viewing. Which property are you interested in, and what days or times work best for you?",
  "I'd like to speak with a real estate agent":
    "I'll connect you with a licensed agent from our team. Would you prefer a call, video chat, or in-person consultation?",
};

const HOME_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

function focusInput() {
  requestAnimationFrame(() => {
    chatInput.focus();
  });
}

function openChat() {
  chatWindow.classList.remove("is-closing");
  chatWindow.classList.add("is-open");
  chatWindow.setAttribute("aria-hidden", "false");
  chatBackdrop.classList.add("is-visible");
  chatBackdrop.setAttribute("aria-hidden", "false");
  chatButton.classList.add("is-active");
  chatButton.setAttribute("aria-expanded", "true");
  chatButton.setAttribute("aria-label", "Close property chat");
  focusInput();
}

function closeChat() {
  chatWindow.classList.add("is-closing");
  chatWindow.classList.remove("is-open");
  chatBackdrop.classList.remove("is-visible");
  chatBackdrop.setAttribute("aria-hidden", "true");
  chatButton.classList.remove("is-active");
  chatButton.setAttribute("aria-expanded", "false");
  chatButton.setAttribute("aria-label", "Open property chat");

  setTimeout(() => {
    chatWindow.classList.remove("is-closing");
    chatWindow.setAttribute("aria-hidden", "true");
  }, CLOSE_DURATION);
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatBody.scrollTop = chatBody.scrollHeight;
  });
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function updateSendButton() {
  const hasText = chatInput.value.trim().length > 0;
  sendButton.disabled = !hasText || isSending;
}

function hideQuickActions() {
  quickActions.classList.add("is-hidden");
}

function showTypingIndicator() {
  typingIndicator.hidden = false;
  typingIndicator.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    typingIndicator.classList.add("is-visible");
  });
  scrollToBottom();
}

function hideTypingIndicator() {
  typingIndicator.classList.remove("is-visible");
  typingIndicator.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    typingIndicator.hidden = true;
  }, 250);
}

function createBotAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "message__avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = HOME_ICON;
  return avatar;
}

function getBotReply(userMessage) {
  return (
    BOT_RESPONSES[userMessage] ||
    "I'm here to help with listings, valuations, viewings, and agent referrals. Tell me more about what you're looking for in your next property."
  );
}

function appendMessage(text, type) {
  const article = document.createElement("article");
  article.className = `message message--${type}`;

  if (type === "bot") {
    const row = document.createElement("div");
    row.className = "message__row";

    const content = document.createElement("div");
    content.className = "message__content";

    const sender = document.createElement("span");
    sender.className = "message__sender";
    sender.textContent = ASSISTANT_NAME;

    const bubble = document.createElement("div");
    bubble.className = "message__bubble";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    bubble.appendChild(paragraph);

    const time = document.createElement("time");
    time.className = "message__time";
    const now = new Date();
    time.dateTime = now.toISOString();
    time.textContent = formatTime(now);

    content.appendChild(sender);
    content.appendChild(bubble);
    content.appendChild(time);
    row.appendChild(createBotAvatar());
    row.appendChild(content);
    article.appendChild(row);
  } else {
    const content = document.createElement("div");
    content.className = "message__content";

    const bubble = document.createElement("div");
    bubble.className = "message__bubble";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    bubble.appendChild(paragraph);

    const time = document.createElement("time");
    time.className = "message__time";
    const now = new Date();
    time.dateTime = now.toISOString();
    time.textContent = formatTime(now);

    content.appendChild(bubble);
    content.appendChild(time);
    article.appendChild(content);
  }

  chatBody.insertBefore(article, typingIndicator);
  requestAnimationFrame(() => {
    article.classList.add("message--animate");
  });
  scrollToBottom();
}

function autoResizeInput() {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 104)}px`;
}

async function sendMessage(forcedText) {
    console.log("sendMessage() called");
  const text = (forcedText ?? chatInput.value).trim();
  if (!text || isSending) return;

  isSending = true;
  updateSendButton();
  hideQuickActions();

  appendMessage(text, "user");
  chatInput.value = "";
  autoResizeInput();
  focusInput();

showTypingIndicator();

try {
    console.log("About to call webhook");
    console.log(CONFIG.webhook);
    const response = await fetch(CONFIG.webhook, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sessionId,
            message: text
        })
    });

    const data = await response.json();

    hideTypingIndicator();

    appendMessage(
        data.reply || "No response received from AI.",
        "bot"
    );

} catch (error) {

    hideTypingIndicator();

    console.error(error);

    appendMessage(
        "Sorry, I couldn't reach the AI server.",
        "bot"
    );

}

  isSending = false;
  updateSendButton();
  focusInput();
}

function toggleChat() {
  if (chatWindow.classList.contains("is-open")) {
    closeChat();
  } else {
    openChat();
  }
}

chatButton.addEventListener("click", toggleChat);
closeButton.addEventListener("click", closeChat);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

quickActions.addEventListener("click", (event) => {
  const chip = event.target.closest(".quick-actions__chip");
  if (!chip || isSending) return;
  sendMessage(chip.dataset.message);
});

chatInput.addEventListener("input", () => {
  autoResizeInput();
  updateSendButton();
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && chatWindow.classList.contains("is-open")) {
    closeChat();
  }
});

updateSendButton();
scrollToBottom();

const initialTime = document.querySelector(".message--bot .message__time");
if (initialTime) {
  const now = new Date();
  initialTime.dateTime = now.toISOString();
  initialTime.textContent = formatTime(now);
}

setTimeout(() => {

    if (!localStorage.getItem("widgetClosed")) {
        openChat();
    }

}, 3000);

