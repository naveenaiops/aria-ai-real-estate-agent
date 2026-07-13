# Contributing to Aria AI

Thank you for your interest in contributing to **Aria AI – Autonomous Real Estate Sales Agent**! We welcome open-source contributions from developers, AI engineers, technical writers, and product specialists.

Please follow these guidelines to ensure a smooth, professional, and efficient collaboration.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainers.

## Technical Scope

Aria AI is built as an automated, n8n-orchestrated backend with a Supabase memory layer and a vanilla web widget frontend. 

When contributing:
- **Do NOT** modify core workflow structure or node-to-node routing without opening an architectural RFC issue first.
- **Do NOT** embed raw secrets or API keys in code or exported JSON. Always use n8n credential objects or environment variables.
- Maintain compatibility with standard n8n (v1+) self-hosted schemas.

---

## Development Setup

To begin hacking on Aria AI locally:

### 1. Prerequisites
- **Docker** and **Docker Compose**
- **Node.js** (v18+) and npm
- A free **Supabase** account
- An **OpenRouter** API key
- A **Telegram** Bot Token (from BotFather)

### 2. Fork and Clone
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/aria-ai-real-estate-agent.git
   cd aria-ai-real-estate-agent
   ```

### 3. Database Initialisation
Create a new project on Supabase, navigate to the **SQL Editor**, paste the contents of `database/schema.sql`, and click **Run**. This setup creates the necessary tables, triggers, and indices.

### 4. Running n8n with Docker
You can start a local n8n instance pre-loaded with environment settings using our docker configurations.
```bash
cp .env.example .env
# Edit your .env with your actual OpenRouter keys and Supabase credentials
docker-compose up -d
```

### 5. Importing Workflows
1. Access your local n8n dashboard (usually at `http://localhost:5678`).
2. Click **Add Workflow** -> **Import from File**.
3. Select `workflow/sales-agent-workflow.json`.
4. Configure the Supabase, OpenRouter, Google, and Telegram credential credentials when prompted.

---

## Pull Request Guidelines

1. **Create a Branch**: Use clean branch names (e.g., `feature/add-discord-alerts` or `fix/budget-regex`).
2. **Write Unit Tests / Validate**: Verify that your exported n8n workflow JSON parses cleanly and does not contain raw developer IDs or credentials.
3. **Commit Messages**: Follow conventional commits (e.g., `feat: optimize budget conversion JavaScript node`).
4. **Document Changes**: If you are adding a feature, update the corresponding file in `docs/` and summarize it in `CHANGELOG.md`.
5. **Open a PR**: Submit a Pull Request against our `main` branch. Provide a clear description of the problem solved and the implementation details.
