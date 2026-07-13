# Chat Widget Client Architecture

Aria AI's client-side user interface is built as a lightweight, premium web widget designed to reside on agency landing pages. It features an event-driven vanilla JavaScript core and modern glassmorphic styling, delivering a beautiful user experience with zero external dependencies.

---

## Technical Architecture

The widget code is divided into four focused files:
1. `index.html`: The parent demonstration page simulating a luxury real estate portal (**Bluestone Estates**).
2. `widget.html`: The actual chat panel structure loaded within the DOM or an iframe.
3. `config.js`: Parameterized configuration file managing webhook addresses and visual branding.
4. `script.js`: Core client-side lifecycle logic, managing state, sessioning, visual indicator, and API fetch calls.
5. `style.css`: Sleek responsive design utilizing CSS custom properties, smooth cubic-bezier micro-animations, and CSS backdrop-filters.

```
[Parent Website Portal]
        │ (loads embed.js / iframe)
        ▼
┌──────────────────┐
│ widget.html      │ ◄── Main layout structure & UI panels
└────────┬─────────┘
         ├─► [config.js]  ──► Manages branding & Webhook endpoints
         ├─► [style.css]  ──► Glassmorphism & Micro-animations
         └─► [script.js]  ──► Local Storage Session & Fetch pipeline
```

---

## Client-Side Logic & Event Flow

### 1. Persistent Session Retention (`localStorage`)
To prevent conversation loss when visitors refresh the landing page or browse listings, the widget creates a persistent connection context using a browser-bound UUID:

```javascript
let sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
    sessionId = crypto.randomUUID(); // Fast, native standard UUID generation
    localStorage.setItem("sessionId", sessionId);
}
```

### 2. Event-Driven Asynchronous Network Fetching
When the visitor submits a query, `script.js` prevents default form submission, disables input to prevent race conditions, appends a user bubble, shows a typing indicator, and triggers a `fetch` request to n8n:

```javascript
async function sendMessage(forcedText) {
    const text = (forcedText ?? chatInput.value).trim();
    if (!text || isSending) return;

    isSending = true;
    updateSendButton();
    hideQuickActions();
    appendMessage(text, "user");
    showTypingIndicator();

    try {
        const response = await fetch(CONFIG.webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, message: text })
        });

        const data = await response.json();
        hideTypingIndicator();
        appendMessage(data.reply || "No response received from AI.", "bot");
    } catch (error) {
        hideTypingIndicator();
        appendMessage("Sorry, I couldn't reach the AI server.", "bot");
    }

    isSending = false;
    updateSendButton();
}
```

---

## Premium Visual Design System

The layout system is tailored to feel premium, featuring:
- **Responsive Sizing**: The widget limits itself to a viewport-friendly width (`420px`) and height (`650px`) on desktops, transitioning to a full-screen overlays on mobile viewports ($\le 480px$) for native-app feels.
- **Glassmorphism Styling**: Uses high-end background blurring `backdrop-filter: blur(16px)` on the header and floating bubbles.
- **Typography**: Tailored with **Outfit** (a luxury geometric font) instead of browser defaults.
- **Color Palettes**: Avoids plain primaries. The system centers on **Premium Warm Gold** (`#C89B5B`) and deep luxurious Charcoal (`#111111`).
- **Attention Animations**: The closed floating chat bubble has an attention animation that triggers every 8 seconds, inviting user engagement subtly.

---

## Self-Hosting & Embedding Mechanics

There are two primary methods to integrate Aria into an external client website:

### Method A: Native DOM Embedding (Recommended for high performance)
Insert this clean snippet directly before the closing `</body>` tag on your index file:

```html
<!-- Container elements -->
<div id="aria-chat-root"></div>

<!-- Load Stylesheet and Configuration -->
<link rel="stylesheet" href="https://your-domain.com/widget/style.css">
<script src="https://your-domain.com/widget/config.js"></script>
<script src="https://your-domain.com/widget/script.js"></script>
```

### Method B: Iframe Sandbox Isolation (Recommended for CMS like WordPress/Webflow)
Add the embed wrapper script to your website:

```html
<script src="https://your-domain.com/widget/embed.js" async></script>
```
The `embed.js` script will dynamically create a sandboxed iframe, isolating the chat widget's styling from the parent site's CSS classes to prevent layout conflicts.
