# Production Deployment & Hardening Checklist

Deploying Aria AI into a production environment requires configuring secure webhooks, managing database connection pools, optimizing SSL handshakes, and setting up persistent network tunnels.

---

## 1. Hosting Architecture Options

```mermaid
graph TD
    subgraph Self-Hosted (Developer Choice)
        Docker[Docker Compose VPS] --> n8nSelf[n8n Self-Hosted]
        Docker --> PostgresSelf[PostgreSQL DB]
    end

    subgraph Managed Cloud (Enterprise Scale)
        Cloudn8n[n8n Cloud] --> WebhookG
        SupaCloud[Supabase Cloud] --> PostgresManaged[Managed PostgreSQL]
    end
```

---

## 2. Production Checklist & Security Hardening

Before opening your webhooks to public internet traffic, execute these essential security audits:

### A. n8n Authentication & Gateway Hardening
1. **Disable Basic Registration**: If self-hosting, ensure you set `N8N_DISABLE_PRODUCTION_REGISTRATION=true` after creating your primary admin account to prevent unauthorized user registrations.
2. **Implement JWT / Secure Token Validation**: Modify the incoming widget webhook node to validate a secure, custom signature header matching a secret token shared between your landing site and n8n.
3. **Configure CORS Policies**: Restrict n8n webhook headers to accept incoming browser requests ONLY from your primary real estate agency domain (e.g., `https://bluestoneestates.com`).

### B. Supabase PostgreSQL Hardening
1. **Disable Public Schema Exposure**: Verify that anonymous client access (`anon_key` policies) is restricted. The widget should **never** query Supabase directly. All database SELECTs/UPDATEs must be routed via n8n using service-role keys behind a protected API gateway.
2. **Row Level Security (RLS)**: Enable RLS on your `chat_sessions` table. Create strict security policies restricting read/write access to approved API users:
   ```sql
   ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
   ```

### C. SSL & Network Security
1. **Enforce HTTPS**: All webhook traffic must be routed over port `443` using valid, renewed Let's Encrypt TLS/SSL certificates.
2. **Rate Limiting**: Protect your n8n webhooks against DDoS or malicious automated script spam. Configure a reverse proxy like **Nginx** or **Cloudflare** on your gateway and set up rate limits (e.g., maximum 5 requests per second per IP):
   ```nginx
   # Nginx Rate Limiting configuration
   limit_req_zone $binary_remote_addr zone=widget_limit:10m rate=5r/s;
   
   server {
       location /webhook/ {
           limit_req zone=widget_limit burst=10 nodelay;
           proxy_pass http://localhost:5678;
       }
   }
   ```

---

## 3. High Availability (HA) Scaling Guidelines

When scaling Aria AI to support thousands of concurrent chat sessions:

1. **Queue-Based Event Processing**: Offload high-traffic webhooks from n8n's immediate execution queue. Have n8n append incoming messages to a fast message broker (e.g., **Redis** or **RabbitMQ**), and process them asynchronously using independent worker nodes.
2. **Supabase Connection Pooling**: High numbers of concurrent n8n executions can exhaust standard PostgreSQL connection limits. Enable and use **PgBouncer** connection pooling in Supabase (Port `6543`) rather than direct database ports (`5432`) to manage concurrent database connections.
3. **LLM Fallback & Retry Logic**: Set up a secondary LLM provider or fallback model (e.g., switching from OpenRouter to a secondary key on Groq or direct Anthropic APIs) inside the n8n error-handling branch, ensuring that your chatbot stays online even during OpenRouter outages.
