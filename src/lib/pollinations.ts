/**
 * Pollinations.ai API Helper
 * Keyless & Free AI Service
 */

export interface PollinationsConfig {
  model?: string;
  systemInstruction?: string;
}

export interface PollinationsResponse {
  text: string;
}

/**
 * Call Pollinations.ai API
 * Default model: openai (supports GPT-4 level responses, free & keyless)
 */
export async function callPollinationsAI(
  prompt: string,
  config: PollinationsConfig = {}
): Promise<PollinationsResponse> {
  const model = config.model || 'openai';
  const systemPrompt = config.systemInstruction || '';
  
  // Combine system instruction with user prompt
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\nUser: ${prompt}`
    : prompt;

  try {
    const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(fullPrompt), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    });

    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status}`);
    }

    const text = await response.text();
    return { text: text.trim() };
  } catch (error) {
    console.error('Pollinations AI Error:', error);
    throw new Error('Yapay Zeka servisine bağlanılamadı. Lütfen tekrar deneyin.');
  }
}

/**
 * Available models (Pollinations.ai supports various backends)
 * Default 'openai' is recommended for Turkish language support
 */
export const AVAILABLE_MODELS = [
  { id: 'openai', name: 'OpenAI (Varsayılan - En İyi Türkçe Desteği)' },
  { id: 'mistral', name: 'Mistral (Hızlı & Hafif)' },
  { id: 'llama', name: 'Llama (Açık Kaynak)' },
];
