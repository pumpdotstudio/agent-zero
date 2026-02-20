// OpenRouter API client — routes LLM calls for intel analysis
// Keeps the provider abstracted so we can swap models without touching analyst logic

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AnalystResponse {
  content: string;
  model: string;
  tokensUsed: { prompt: number; completion: number };
}

export class OpenRouterClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "x-ai/grok-3-beta") {
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: ChatMessage[], temperature = 0.3): Promise<AnalystResponse> {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pump.studio",
        "X-Title": "Agent Zero War Room",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? "",
      model: data.model ?? this.model,
      tokensUsed: {
        prompt: data.usage?.prompt_tokens ?? 0,
        completion: data.usage?.completion_tokens ?? 0,
      },
    };
  }
}
