/**
 * LLM Service — Voice text → structured bill items
 *
 * Currently: Ollama (local, for testing)
 * To switch to any other LLM API, only change this file.
 */

// ── Config ────────────────────────────────────────────────────────
// Emulator → PC:      http://10.0.2.2:11434
// Real device WiFi:   http://YOUR_PC_LAN_IP:11434
// Future (OpenAI):    change extractBillItems() to call OpenAI API
export const LLM_CONFIG = {
  ollamaUrl:   'http://10.0.2.2:11434',
  ollamaModel: 'llama3.2',   // Change to whichever model you have pulled
  timeoutMs:   30000,
};

// ── Types ─────────────────────────────────────────────────────────
export interface ExtractedItem {
  name:  string;
  qty:   number;
  unit:  string;
  price: number;   // 0 by default — cashier fills price if not in inventory
}

// ── Prompt ────────────────────────────────────────────────────────
const buildPrompt = (voiceText: string): string => `
You are a billing assistant for an Indian retail shop.
Extract products and quantities from this voice input.
The input may be in Tamil, Hindi, Telugu, Kannada, Malayalam, or English.

Voice input: "${voiceText}"

Return ONLY a valid JSON array — no explanation, no markdown, just the JSON.
Format: [{"name":"ProductName","qty":1,"unit":"pcs","price":0}]

Rules:
- Translate all product names to English
- qty: number mentioned (default 1 if not said)
- unit: "kg", "g", "L", "ml", "pcs", "pkt", "dozen" — default "pcs"
- price: always 0
- Combine duplicates (e.g. "coke coke" → qty 2)

Examples:
Input: "rice 2 kg, 3 coke, dairy milk 5"
Output: [{"name":"Rice","qty":2,"unit":"kg","price":0},{"name":"Coca Cola","qty":3,"unit":"pcs","price":0},{"name":"Dairy Milk","qty":5,"unit":"pcs","price":0}]
`.trim();

// ── Ollama API Call ───────────────────────────────────────────────
async function callOllama(voiceText: string): Promise<ExtractedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_CONFIG.timeoutMs);

  try {
    const res = await fetch(`${LLM_CONFIG.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:  LLM_CONFIG.ollamaModel,
        prompt: buildPrompt(voiceText),
        stream: false,
        options: { temperature: 0.1 },   // Low temp = more consistent JSON
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

    const data = await res.json();
    const raw: string = data.response ?? '';

    // Extract JSON array from response (handles extra text / markdown)
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found in LLM response');

    const items: ExtractedItem[] = JSON.parse(match[0]);
    return items.map(i => ({
      name:  String(i.name  ?? 'Unknown').trim(),
      qty:   Number(i.qty   ?? 1),
      unit:  String(i.unit  ?? 'pcs').trim(),
      price: Number(i.price ?? 0),
    }));
  } catch (e: any) {
    clearTimeout(timeout);
    throw e;
  }
}

// ── Regex Fallback ────────────────────────────────────────────────
// Used when LLM is unreachable — parses simple patterns like "2 rice, 3 coke"
function regexFallback(voiceText: string): ExtractedItem[] {
  const results: ExtractedItem[] = [];

  // Match patterns: "2 rice", "rice 2", "2 kg rice", "rice 2 kg"
  const pattern = /(\d+(?:\.\d+)?)\s*(kg|g|l|ml|ltr|pkt|pcs|dozen)?\s+([a-zA-Z\s]+)|([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|ltr|pkt|pcs|dozen)?/gi;
  const seen = new Set<string>();

  let match;
  while ((match = pattern.exec(voiceText)) !== null) {
    const isQtyFirst = !!match[1];
    const qty  = parseFloat(isQtyFirst ? match[1] : match[5]) || 1;
    const unit = (isQtyFirst ? match[2] : match[6])?.toLowerCase() || 'pcs';
    const name = (isQtyFirst ? match[3] : match[4])?.trim() || '';

    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      results.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        qty, unit, price: 0,
      });
    }
  }

  // If regex also fails, create one item from the whole text
  if (results.length === 0 && voiceText.trim()) {
    results.push({ name: voiceText.trim(), qty: 1, unit: 'pcs', price: 0 });
  }

  return results;
}

// ── Public API ────────────────────────────────────────────────────
/**
 * Main function: voice text → extracted bill items
 * Tries Ollama first, falls back to regex parser if offline/error.
 */
export async function extractBillItems(voiceText: string): Promise<{
  items: ExtractedItem[];
  usedFallback: boolean;
}> {
  if (!voiceText?.trim()) return { items: [], usedFallback: false };

  try {
    const items = await callOllama(voiceText);
    return { items, usedFallback: false };
  } catch (e) {
    console.warn('[LLM] Ollama unavailable, using regex fallback:', e);
    const items = regexFallback(voiceText);
    return { items, usedFallback: true };
  }
}

/**
 * Future: swap to OpenAI, Gemini, or your FastAPI backend
 * by replacing callOllama() with a different fetch call.
 *
 * Example (OpenAI):
 * const res = await fetch('https://api.openai.com/v1/chat/completions', {
 *   headers: { Authorization: `Bearer ${API_KEY}` },
 *   body: JSON.stringify({ model: 'gpt-4o-mini', messages: [...] }),
 * });
 */
