-- ==============================================================================
-- Aria AI – Autonomous Real Estate Sales Agent Database Schema
-- Target Platform: Supabase (PostgreSQL 15+)
-- File: database/schema.sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dynamic updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- Table: chat_sessions
-- Centralised store for session state, LLM memory, and qualified attributes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    -- Identification
    session_id VARCHAR(255) PRIMARY KEY, -- Maps directly to the client's crypto.randomUUID()
    
    -- Conversation Memory
    history TEXT DEFAULT '', -- Stores raw human-agent dialogue transcription
    
    -- Extracted Entities & Status
    lead_data JSONB DEFAULT '{}'::jsonb, -- Stores Name, Phone, Email, Location, Budget, Purchase Timeline
    lead_score INTEGER DEFAULT 0, -- Evaluation score (0 - 100)
    lead_status VARCHAR(50) DEFAULT 'COLD', -- Category: HOT, WARM, COLD
    qualified BOOLEAN DEFAULT FALSE, -- Set TRUE when core qualification criteria are satisfied
    sales_stage VARCHAR(50) DEFAULT 'INTAKE', -- Current stage in lead lifecycle (e.g., INTAKE, BOOKING, COMPLETED)
    
    -- Booking Details (Populated during scheduling phase)
    property_type VARCHAR(100), -- E.g., Apartment, Villa, Penthouse
    bedrooms VARCHAR(50), -- E.g., 2 BHK, 3 BHK, 4 BHK
    loan_required BOOLEAN DEFAULT FALSE, -- Financial intent
    customer_intent VARCHAR(255), -- Qualitative classification of buyer intent
    site_visit_date DATE, -- YYYY-MM-DD
    site_visit_time TIME, -- HH:MM
    preferred_contact_time VARCHAR(100), -- Buyer preference
    booking_ready BOOLEAN DEFAULT FALSE, -- Flagged TRUE when appointment date & time are secured
    handoff BOOLEAN DEFAULT FALSE, -- Flagged TRUE when buyer requests human interaction
    
    -- Channel Integration Data
    telegram_chat_id VARCHAR(100), -- Telegram handle ID for conversational link
    telegram_username VARCHAR(100), -- Telegram user handle
    
    -- System Audit Timestamps
    last_scored_at TIMESTAMPTZ, -- Last execution of the lead scoring algorithm
    last_contacted_at TIMESTAMPTZ, -- Last notification sent
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- Triggers: Keep updated_at automatically aligned on modification
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_timestamp_chat_sessions ON chat_sessions;
CREATE TRIGGER set_timestamp_chat_sessions
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ------------------------------------------------------------------------------
-- Performance Tuning: Indexes
-- Optimised for low-latency lookups, sorting, and reporting.
-- ------------------------------------------------------------------------------

-- Index on session_id (implicitly covered by PRIMARY KEY but created for schema explicit representation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_sessions_id ON chat_sessions (session_id);

-- Speed up query filters in n8n and reports (e.g., "Get all qualified hot leads")
CREATE INDEX IF NOT EXISTS idx_chat_sessions_qualified ON chat_sessions (qualified) WHERE qualified = TRUE;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions (lead_status);

-- Optimise updates on active sessions being scoring or contacted
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_scored ON chat_sessions (last_scored_at DESC NULLS LAST);

-- JSONB indexing (GIN index) to allow ultra-fast queries inside lead_data attributes (e.g., query by phone/email)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_lead_data_gin ON chat_sessions USING gin (lead_data);
