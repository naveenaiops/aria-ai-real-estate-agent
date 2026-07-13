# Prompt Engineering Strategy & JSON Schemas

Aria AI relies on a highly sophisticated prompt engineering strategy to transform raw conversation transcripts into structured lead intelligence. By utilizing **DeepSeek-v4-Flash via OpenRouter**, Aria achieves near-instantaneous responses while maintaining strict adherence to output schemas.

---

## Technical Foundations

### Why DeepSeek-v4-Flash?
1. **Low Latency**: With response speeds regularly exceeding 80 tokens per second, DeepSeek-v4-Flash ensures a real-time conversational experience with under 1.5 seconds of total roundtrip overhead.
2. **Excellent Instruction Adherence**: Highly resilient to structured system guidelines, maintaining high compliance when instructed to respond exclusively in raw, parseable JSON.
3. **Disruptive Cost Efficiency**: Offered via OpenRouter at fraction-of-a-cent prices per thousand tokens, making 24/7 continuous real estate qualification highly cost-effective for agencies of any size.

---

## Core Prompts & JSON Specifications

Aria features three specialized prompts stored under the [prompts/](file:///C:/Users/user/.gemini/antigravity/scratch/aria-ai-real-estate-agent/prompts) folder.

### 1. Lead Qualification Schema (`qualification_agent.txt`)
Enforces conversational behavior while extracting real estate properties. The model is forced to output a JSON object adhering to this schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "OBJECT",
  "properties": {
    "reply": {
      "type": "STRING",
      "description": "Natural language conversational reply to the visitor. Keep it consultative and ask for exactly ONE missing detail."
    },
    "lead_data": {
      "type": "OBJECT",
      "properties": {
        "name": { "type": ["STRING", "NULL"] },
        "phone": { "type": ["STRING", "NULL"] },
        "email": { "type": ["STRING", "NULL"] },
        "preferred_location": { "type": ["STRING", "NULL"] },
        "budget": { "type": ["STRING", "NULL"] },
        "purchase_timeline": {
          "type": ["STRING", "NULL"],
          "enum": ["Immediately", "Within 3 Months", "Within 6 Months", "Just Exploring", null]
        }
      },
      "required": ["name", "phone", "email", "preferred_location", "budget", "purchase_timeline"]
    },
    "ready_to_recommend": {
      "type": "BOOLEAN",
      "description": "Set to true ONLY when name, phone, and preferred_location are fully gathered."
    }
  },
  "required": ["reply", "lead_data", "ready_to_recommend"]
}
```

---

## Parse Recovery & Resiliency

Relying on an LLM to output valid JSON can sometimes result in runtime failures if the model adds markdown formatting (e.g., ` ```json ... ``` `) or trails text. To prevent workflow crashes, Aria implements a highly resilient **Parse Recovery Layer** inside n8n via a JavaScript Code Node following the AI execution.

### n8n Parse Recovery Code
If the model output contains wrapping markdown markers or trailing commentary, this node strips them and extracts the clean, inner JSON block:

```javascript
// Retrieve the raw response from the LLM node
const rawText = $json.response ? $json.response.text : "";
let cleanedText = rawText.trim();

try {
    // Stage 1: Standard direct parse
    const parsed = JSON.parse(cleanedText);
    return parsed;
} catch (e) {
    // Stage 2: Clean markdown code blocks if the LLM ignored the raw system instructions
    if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```json\s*/i, "");
        cleanedText = cleanedText.replace(/```$/, "");
        cleanedText = cleanedText.trim();
    }

    try {
        const parsed = JSON.parse(cleanedText);
        return parsed;
    } catch (innerError) {
        // Stage 3: RegEx extraction fallback for trailing text or conversational wraps
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed;
            } catch (regexError) {
                // If all recovery fails, return a safe conversational fallback reply
                return {
                    reply: "I am taking notes on your requirements. Could you please share your phone number so we can coordinate a visit?",
                    lead_data: {
                        name: null,
                        phone: null,
                        email: null,
                        preferred_location: null,
                        budget: null,
                        purchase_timeline: null
                    },
                    ready_to_recommend: false
                };
            }
        }
    }
}
```

---

## Key Prompt Engineering Decisions

> [!TIP]
> **Dynamic Time Context Injection**
> 
> When resolving bookings (e.g., "tomorrow", "this Saturday"), LLMs are prone to hallucinating dates. Aria solves this by dynamically injecting the current timestamp context `{{ $now }}` (such as `2026-07-13T12:45:59+05:30`) directly into the model's system context window during runtime. This enables the model to perform highly accurate relative calendar date math before generating appointments.

> [!IMPORTANT]
> **Indian Real Estate Contextual Mapping**
> 
> Many buyers in the Indian real estate market express budgets using terms like "1.2" (meaning 1.2 Crores / 12,000,000 INR) or "80" (meaning 80 Lakhs / 8,000,000 INR). The system prompt is specifically engineered with contextual rules guiding the LLM to interpret these decimal representations accurately and confirm them politely, avoiding standard Western defaults that interpret "1.5" as "1.5 Lakhs" or "$1.5".

> [!WARNING]
> **Strict Emoji and Copy Constraints**
> 
> To maintain the high-end, premium brand reputation of **Bluestone Estates**, the automated WhatsApp follow-up generator prompt is strictly constrained against over-using emojis or hype-driven sales phrases. It forces clean, brief (max 55 words), high-end consultative prose.
