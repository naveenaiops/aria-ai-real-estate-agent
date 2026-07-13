# Installation & Setup Guide

This guide walks you through the step-by-step process of installing and deploying **Aria AI – Autonomous Real Estate Sales Agent** in a local development or self-hosted environment.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Docker** and **Docker Compose**
- **Node.js (v18+)** and npm (optional, only for running the widget locally)
- A web browser to access dashboards

---

## 2. Setting Up the Database (Supabase)

Aria AI uses Supabase as its database layer.

1. Sign up/Log in to [Supabase](https://supabase.com/).
2. Click **New Project** and configure your organization, project name, and safe database password.
3. Once the database is initialized, navigate to the **SQL Editor** from the left navigation bar.
4. Click **New Query**, paste the complete contents of [database/schema.sql](file:///C:/Users/user/.gemini/antigravity/scratch/aria-ai-real-estate-agent/database/schema.sql), and click **Run**.
5. (Optional) paste the contents of [database/seed.sql](file:///C:/Users/user/.gemini/antigravity/scratch/aria-ai-real-estate-agent/database/seed.sql) and run it to pre-load mock leads for testing.

---

## 3. Creating Third-Party API Integrations

### A. OpenRouter (DeepSeek LLM)
1. Navigate to [OpenRouter](https://openrouter.ai/).
2. Create an account and go to the **Keys** tab.
3. Click **Create Key**, name it `Aria AI Core`, and copy the secret key. Keep it handy.

### B. Telegram Bot (RM Outreach Channel)
1. Open your Telegram app and search for `@BotFather`.
2. Send the command `/newbot` and follow the instructions to choose a name and username for your bot.
3. BotFather will provide an API **Token** (e.g., `1234567890:ABCdef...`). Save this token safely.
4. Search for `@userinfobot` on Telegram and send a message to get your personal **Chat ID** (e.g., `8195275061`). This is used to route hot lead alerts directly to you.

### C. Google Cloud Platform (Sheets & Calendar)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `Aria AI Integration`.
3. Enable the **Google Sheets API** and **Google Calendar API** from the API Library.
4. Configure the **OAuth Consent Screen** (User Type: External) and add scopes: `.../auth/spreadsheets`, `.../auth/calendar`.
5. Go to **Credentials** -> **Create Credentials** -> **OAuth Client ID**.
6. Set Application Type to **Web Application** and add the n8n redirect URI (e.g., `https://your-n8n-instance.com/rest/oauth2-credential/callback`).
7. Save the resulting **Client ID** and **Client Secret**.

---

## 4. Running n8n via Docker Compose

We provide a self-contained environment to launch n8n.

1. Copy [.env.example](file:///C:/Users/user/.gemini/antigravity/scratch/aria-ai-real-estate-agent/.env.example) to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and enter your actual secrets (OpenRouter API Key, Supabase URL, Telegram Bot Token, GCP Credentials).
3. Create a `docker-compose.yml` file at the root:
   ```yaml
   version: '3.8'

   services:
     n8n:
       image: docker.n8n.io/n8nio/n8n:latest
       container_name: aria_n8n_orchestrator
       restart: always
       ports:
         - "5678:5678"
       environment:
         - N8N_HOST=localhost
         - N8N_PORT=5678
         - N8N_PROTOCOL=http
         - N8N_METET_DATA=true
         - WEBHOOK_URL=${WEBHOOK_URL}
       volumes:
         - n8n_storage:/home/node/.n8n

   volumes:
     n8n_storage:
   ```
4. Fire up the docker container:
   ```bash
   docker-compose up -d
   ```
5. Open your browser and navigate to `http://localhost:5678` to configure your initial n8n admin account.

---

## 5. Importing and Activating Workflows

1. Inside the n8n dashboard, go to **Workflows** -> **Add Workflow** -> **Import from File**.
2. Select [workflow/sales-agent-workflow.json](file:///C:/Users/user/.gemini/antigravity/scratch/aria-ai-real-estate-agent/workflow/sales-agent-workflow.json).
3. n8n will detect missing credentials. Click **Configure** on each node to bind:
   - Your **Supabase Database connection**
   - Your **OpenRouter API Key** (Under "Header Auth" -> Name: `Authorization`, Value: `Bearer YOUR_OPENROUTER_KEY`)
   - Your **Google Sheets** and **Google Calendar OAuth** accounts
   - Your **Telegram Bot Token**
4. Click **Save** and click the **Active** toggle switch in the top-right corner to publish the webhook endpoint!
5. Repeat the process for the Booking workflow: [workflow/booking-agent-workflow.json](file:///C:/Users/user/.gemini/antigravity/scratch/aria-ai-real-estate-agent/workflow/booking-agent-workflow.json).

---

## 6. Running the Website Chat Widget Locally

To test the frontend chat widget:

1. Open [widget/config.js](file:///C:/Users/user/.gemini/antigravity/scratch/aria-ai-real-estate-agent/widget/config.js).
2. Replace `webhook` URL with your active n8n production webhook URL (e.g. `http://localhost:5678/webhook/sales-agent`).
3. Launch a local web server inside the `widget/` folder:
   - Using Node's `npx`:
     ```bash
     npx http-server ./widget -p 3000
     ```
   - Or Python's built-in server:
     ```bash
     python -m http.server 3000 --directory ./widget
     ```
4. Open `http://localhost:3000` in your web browser. The luxury demo site of **Bluestone Estates** will render, and the floating chat bubble will slide up in the bottom-right corner!
