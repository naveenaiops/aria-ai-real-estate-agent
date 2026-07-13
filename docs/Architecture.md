# System Architecture & Design Topology

Aria AI is structured around a decoupled, highly responsive event-driven topology. By separating the client UI, database state, orchestration engine, and cognitive model tier, the system achieves sub-second UI interactions while managing complex business integrations.

---

## Technical Architecture Overview

Aria AI uses **n8n** as a lightweight, low-code integration router, **Supabase (PostgreSQL)** as a real-time state repository, and **OpenRouter (DeepSeek-v4-Flash)** as a high-speed qualification brain.

```mermaid
graph TB
    subgraph client_tier["Client Tier"]
        Widget[Custom Website Chat Widget]
        Telegram[Telegram App client]
    end

    subgraph orchestration_tier["Orchestration Tier (n8n API Gateway)"]
        Webhook[Sales Agent Webhook Gateway]
        TGTrigger[Telegram Bot Message Trigger]
        Scoring[JS Lead Scoring Engine]
        ParseRecovery[JS JSON Parse Recovery]
    end

    subgraph cognitive_tier["Cognitive Tier"]
        LLM[DeepSeek-v4-Flash via OpenRouter]
    end

    subgraph data_tier["Data Tier (Supabase Real-Time DB)"]
        DB[(PostgreSQL Table: chat_sessions)]
    end

    subgraph external_tier["External CRM & Workspace Connectors"]
        Sheets[Google Sheets CRM Sync]
        Calendar[Google Calendar Scheduler]
    end

    %% Web Widget Intake Flow
    Widget -->|1. REST POST message/sessionId| Webhook
    Webhook -->|2. Get Session State| DB
    Webhook -->|3. Query structured reply| LLM
    LLM -->|4. Strict JSON reply| ParseRecovery
    ParseRecovery -->|5. Update Session, Extracted Lead & Score| DB
    ParseRecovery -->|6. Execute scoring script| Scoring
    Scoring -->|7. Score >= 50: Schedule follow-up alert| Telegram
    Scoring -->|8. Append Lead Record| Sheets
    ParseRecovery -->|9. JSON response: reply| Widget

    %% Telegram Booking Flow
    Telegram -->|1. Client reply / Chat details| TGTrigger
    TGTrigger -->|2. Get Lead Session History| DB
    TGTrigger -->|3. Feed dialogue context| LLM
    LLM -->|4. Resolve relative dates, extract preferences| ParseRecovery
    ParseRecovery -->|5. Update booking parameters| DB
    ParseRecovery -->|6. Booking Ready: Create physical event| Calendar
    ParseRecovery -->|7. Synchronize booked CRM fields| Sheets
```

---

## Event-Driven Sequence Diagram

The interaction sequence during the double-phase lead qualification and scheduling cycle is detailed below:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Website Visitor
    participant Widget as Chat Widget Client
    participant n8n as n8n Orchestrator
    participant DB as Supabase DB
    participant AI as OpenRouter (DeepSeek)
    participant Tele as Telegram bot
    participant Sheets as Google Sheets CRM
    participant Calendar as Google Calendar

    %% Phase 1: Intake and Qualification
    Client->>Widget: Input text ("Hi, looking for homes")
    Widget->>n8n: POST /sales-agent (message, sessionId)
    n8n->>DB: SELECT * FROM chat_sessions WHERE session_id = sessionId
    DB-->>n8n: Return raw history & lead_data (or null)
    n8n->>AI: Send prompt (System + History + Input text)
    AI-->>n8n: Return Qualification JSON (reply, lead_data, ready_to_recommend)
    n8n->>DB: INSERT / UPDATE chat_sessions (history, lead_data, score)
    n8n->>Widget: Return reply ("Welcome! What is your budget?")
    Widget-->>Client: Render message in chat bubble

    Note over n8n, AI: Conversation iterates until lead qualifies (Score >= 50)

    %% Trigger Outbound Sequences
    n8n->>Sheets: Append/Sync qualified lead record (Name, Phone, Location, Score)
    n8n->>Tele: Dispatch warm follow-up SMS / Alert to Agent / RM Chat

    %% Phase 2: Booking Conversation
    Client->>Tele: Reply to Follow-up ("Sounds good, book a tour tomorrow")
    Tele->>n8n: Trigger: Telegram Reply received
    n8n->>DB: Hydrate session variables using Telegram metadata
    DB-->>n8n: Return active lead details
    n8n->>AI: Send prompt (System + History + relative date resolver)
    AI-->>n8n: Return Booking JSON (reply, site_visit_date, booking_ready)
    n8n->>DB: Update chat_sessions booking parameters
    n8n->>Tele: Send Bot reply ("Confirmed! Tour is booked for tomorrow.")
    
    %% Calendar Booking Event
    n8n->>Calendar: Book 1-Hour Site Visit (site_visit_date + site_visit_time)
    Calendar-->>n8n: Confirm booking event created
    n8n->>Sheets: Update CRM row with site visit details
```

---

## Technical Decisions & Rationales

### 1. n8n as the Core Orchestrator
Many contemporary AI projects use heavy frameworks like LangChain (Python) or LlamaIndex in backend services. Aria intentionally uses **n8n** for orchestration.
- **Visual Debugging**: n8n provides a visual node-by-node execution trail. Real estate agency owners or operations managers can inspect failed runs, monitor active leads, and verify integrations without command-line code.
- **Native Oauth Connectors**: Managing OAuth authentication for Google Sheets and Google Calendar in custom Python code is complex. n8n abstracts this completely with secure, native credentials management.

### 2. DeepSeek-v4-Flash via OpenRouter
- **Parsing Strictness**: Enforces JSON schema extraction with extremely high compliance, bypassing the need for heavier LLM models.
- **Latency**: Under 1.5s rountrip, crucial for keeping website visitors engaged in conversation.

### 3. Supabase Memory Layer
- Using Supabase's fully-managed PostgreSQL gives us a production-grade database out of the box with zero local hosting friction. This allows seamless transitions from development to production without changing the database layer.
