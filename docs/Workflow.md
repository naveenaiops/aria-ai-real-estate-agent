# Workflow Engine & Integration Guides

Aria AI operates two core n8n workflows designed to handle lead intake (qualification and scoring) and scheduling (Telegram conversational scheduling, calendar booking, and CRM updates).

---

## 1. Primary Workflow: Lead Intake & Qualification

This workflow exposes a REST endpoint, receives chat messages from the website widget, qualifications the lead conversational using DeepSeek-v4-Flash, scores them, syncs to Google Sheets, and dispatches a follow-up Telegram notification.

```
[Web Widget Client]
      │ (REST POST)
      ▼
┌──────────────┐
│ Webhook      │ ◄── Handles incoming /sales-agent payload
└──────┬───────┘
       ▼
┌──────────────┐
│ Supabase     │ ◄── "Get Session": Checks if sessionId exists
└──────┬───────┘
       ▼
┌──────────────┐
│ OpenRouter   │ ◄── "Lead Qualification Agent": Enforces system prompt
└──────┬───────┘
       ▼
┌──────────────┐
│ Code Node    │ ◄── "JSON Parser & Recovery": Regular expression repair
└──────┬───────┘
       ▼
┌──────────────┐
│ Supabase     │ ◄── "Update Session": Saves history & extracted JSON
└──────┬───────┘
       ▼
┌──────────────┐
│ Code Node    │ ◄── "Calculate Lead Score": Executes scoring algorithm
└──────┬───────┘
       ▼
┌──────────────┐
│ Google Sheet │ ◄── Appends lead data to CRM Spreadsheet
└──────┬───────┘
       ▼
┌──────────────┐
│ Telegram     │ ◄── Send RM Alert + follow-up copy (only if Score >= 50)
└──────────────┘
```

### Detailed Node-by-Node Analysis

#### A. Webhook Gateway (`/sales-agent`)
- **HTTP Method**: `POST`
- **Payload Structure**: `{ "sessionId": "UUID", "message": "User text" }`
- **Function**: Entry point of the intake pipeline. Accepts requests from the floating client-side widget.

#### B. Supabase Session State Hydration
- **Node Type**: Supabase Query Node
- **Operation**: `Get row by session_id`
- **Function**: Wakes up and checks if a record matching the incoming `sessionId` already exists. If not found, a conditional split branches to insert a new, empty record with default values.

#### C. Lead Qualification AI Agent
- **Node Type**: LangChain AI Agent Node + OpenRouter Chat Model
- **Parameters**: `Model: deepseek/deepseek-v4-flash`, `Temperature: 0.1`
- **Prompt**: Parses historical transcript + new message and extracts attributes into standard JSON formats.

#### D. JSON Recovery Layer
- **Node Type**: JavaScript Code Node
- **Function**: Intercepts LLM outputs, cleans markdown tags if present, and parses text into a standardized n8n JSON schema.

#### E. Supabase Memory Sync
- **Node Type**: Supabase Update Node
- **Function**: Commits the updated dialogue transcript and extracted parameters back to the `chat_sessions` table under the corresponding `session_id`.

#### F. Lead Scoring and Classification
- **Node Type**: JavaScript Code Node
- **Function**: Executes the mathematical scoring logic (from [LeadScoring.md](LeadScoring.md)) and updates `lead_score`, `lead_status`, and `qualified`.

#### G. CRM Spreadsheet Sync
- **Node Type**: Google Sheets Node
- **Operation**: `Append Row`
- **Function**: Appends Name, Phone, Email, Location, Budget, Timeline, Score, and Priority Status to the central CRM spreadsheet for reporting.

#### H. Telegram RM Push Alert
- **Node Type**: Telegram Bot Action Node
- **Function**: If the lead qualifies (Score $\ge 50$), the workflow triggers an instant push alert to the Telegram chat of the assigned Relationship Manager (RM), providing the lead profile and pre-generated WhatsApp invitation copy.

---

## 2. Secondary Workflow: Appointment Booking Agent

This workflow is triggered when a qualified client replies to the relationship manager's outreach on Telegram. It processes relative dates, extracts configurations, and logs physical viewings in Google Calendar.

### Pipeline Flowchart

```
[Telegram User Reply]
         │ (Telegram Bot Webhook)
         ▼
┌──────────────────┐
│ Telegram Trigger │ ◄── Listens for replies to the bot
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Supabase         │ ◄── Retrieves corresponding active session_id
└────────┬─────────┘
         ▼
┌──────────────────┐
│ OpenRouter LLM   │ ◄── "AI Booking Agent": Resolves dates/time
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Code Node        │ ◄── Parses response and checks "booking_ready"
└────────┬─────────┘
         ▼
┌────────┴─────────┐
├─► [booking_ready = TRUE] ──► Google Calendar (Book Event) ──► Sheets CRM (Update Row)
└─► [booking_ready = FALSE] ──► Telegram (Send conversational reply)
```

### Detailed Node-by-Node Analysis

#### A. Telegram Message Trigger
- **Node Type**: Telegram Trigger Node
- **Function**: Triggers instantly on incoming Telegram chat messages. Hydrates `telegram_chat_id` and username.

#### B. Supabase Profile Retrieval
- **Node Type**: Supabase Query Node
- **Operation**: `Get rows from chat_sessions`
- **Criteria**: Matches `telegram_chat_id` to retrieve the active session details.

#### C. AI Booking Agent
- **Node Type**: LangChain Agent Node + OpenRouter
- **Inject variables**: Binds `$now` (current date/time) to resolve dates like "tomorrow".
- **Function**: Solves properties (`property_type`, `bedrooms`), financial intent (`loan_required`), and schedules appointment dates & times.

#### D. Conditional Branching (`booking_ready`)
- **Node Type**: n8n If-Node
- **Criteria**: Checks the extracted JSON attribute `booking_ready === true`.
- **Branch TRUE**: 
  - Triggers **Book Site Visit in Calendar** node, writing a 1-hour appointment directly to the Google Calendar of `theologicalnaveen@gmail.com`.
  - Triggers **Update Lead CRM Record** in Supabase, saving booking parameters.
  - Updates the corresponding Google Sheet row with site visit date and time.
- **Branch FALSE**: Sends a conversational reply via Telegram Bot to continue the booking dialogue.
