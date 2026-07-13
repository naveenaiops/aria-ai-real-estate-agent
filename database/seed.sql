-- ==============================================================================
-- Aria AI – Seed Mock Lead Sessions
-- Target Platform: Supabase (PostgreSQL 15+)
-- File: database/seed.sql
-- ==============================================================================

-- Empty any existing mock sessions (caution in production)
-- TRUNCATE TABLE chat_sessions;

INSERT INTO chat_sessions (
    session_id, 
    history, 
    lead_data, 
    lead_score, 
    lead_status, 
    qualified, 
    sales_stage,
    property_type,
    bedrooms,
    loan_required,
    booking_ready,
    telegram_chat_id,
    created_at
) VALUES 
(
    'mock-session-001-hot',
    'User: Hi, looking for villas.
Agent: Welcome! I can help you with that. Can I have your name and phone number to start?
User: Sure, my name is Amit Sharma. Phone is +919876543210.
Agent: Excellent, Amit. What locations are you exploring and what budget do you have?
User: Exploring Whitefield. Budget is around 1.5 Crores.
Agent: Perfect. When are you planning to make the purchase?
User: Looking to buy immediately.',
    '{
        "name": "Amit Sharma",
        "phone": "+919876543210",
        "email": "amit.sharma@example.com",
        "preferred_location": "Whitefield",
        "budget": "1.5 Crores",
        "purchase_timeline": "Immediately"
    }'::jsonb,
    100, -- Score = Phone(10)+Email(5)+Location(10)+Budget(25)+Timeline(35) + Buffer = capped at 100
    'HOT',
    TRUE,
    'BOOKING',
    'Villa',
    '3 BHK',
    TRUE,
    FALSE,
    'YOUR_TELEGRAM_CHAT_ID',
    now() - INTERVAL '2 hours'
),
(
    'mock-session-002-warm',
    'User: Hello, I want to check prices in Sarjapur.
Agent: Hello! I''d be glad to help. Who do I have the pleasure of speaking with?
User: I am Neha Patel. Email is neha.patel@example.com.
Agent: Thanks Neha. What is your budget and phone number?
User: Budget is 80 Lakhs. No phone number for now.
Agent: No problem. What is your purchase timeline?
User: Within 3 months.',
    '{
        "name": "Neha Patel",
        "email": "neha.patel@example.com",
        "preferred_location": "Sarjapur",
        "budget": "80 Lakhs",
        "purchase_timeline": "Within 3 Months"
    }'::jsonb,
    60, -- Score = Email(5)+Location(10)+Budget(20)+Timeline(25) = 60
    'WARM',
    TRUE,
    'INTAKE',
    NULL,
    NULL,
    FALSE,
    FALSE,
    NULL,
    now() - INTERVAL '1 day'
),
(
    'mock-session-003-cold',
    'User: I am just browsing around some listings.
Agent: Welcome! I can show you listings. Can I get your name and email?
User: Just call me Rahul. I am not sharing email.
Agent: Thanks Rahul. What areas or budget?
User: Exploring. Under 40 Lakhs.',
    '{
        "name": "Rahul",
        "preferred_location": "Electronic City",
        "budget": "35 Lakhs",
        "purchase_timeline": "Just Exploring"
    }'::jsonb,
    25, -- Score = Location(10)+Budget(10)+Timeline(5) = 25
    'COLD',
    FALSE,
    'INTAKE',
    NULL,
    NULL,
    FALSE,
    FALSE,
    NULL,
    now() - INTERVAL '3 days'
);
