# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-13

This is the initial production-ready release of **Aria AI – Autonomous Real Estate Sales Agent**.

### Added
- **Core n8n Qualification Workflow**: Primary webhook-driven lead qualification flow with conversational session memory.
- **DeepSeek-v4-Flash Engine**: Complete prompt infrastructure configured on OpenRouter for ultra-low latency conversational agents.
- **Supabase Integration**: Unified session storage table `chat_sessions` that dynamically merges history and extracted attributes.
- **Mathematical Lead Scoring Model**: Automated lead evaluation script scoring leads based on contact channels, location, budget thresholds, and urgency.
- **Telegram Follow-Up sub-workflow**: Async relationship manager communication via Telegram bot triggers on hot lead scores ($\ge 50$).
- **Google Sheets & Google Calendar Sync**: Simultaneous CRM synchronization to sheets and automated calendar scheduling.
- **Website Chat Widget**: Responsive, gorgeous web client with glassmorphism styling, floating trigger bubbles, and local session preservation.

### Changed
- Refactored raw n8n exports into sanitised, secret-free JSON schemas.
- Enhanced web widget connection flow, moving hardcoded endpoints into an environment-driven `config.js` script.

### Removed
- Removed direct development webhook references, Telegram chat IDs, personal calendars, and sheets IDs from JSON payloads.
