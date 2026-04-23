/**
 * Hugging Face Inference API Helper
 * Free-tier & Serverless AI Service
 * https://huggingface.co/docs/api-inference/quicktour
 */

export interface HFConfig {
  model?: string;
  systemInstruction?: string;
}

export interface HFResponse {
  text: string;
}

/**
 * Call Hugging Face Inference API (Free Tier)
 * No API key needed for public models with rate limits
 * Default model: Meta-Llama-3-8B-Instruct (Great Turkish support)
 */
export async function callHuggingFaceAI(
  prompt: string,
  config: HFConfig = {}
): Promise<HFResponse> {
  // Hugging Face free models (no API key required)
  const modelMap: Record<string, string> = {
    'llama': 'meta-llama/Meta-Llama-3-8B-Instruct',
    'mistral': 'mistralai/Mistral-7B-Instruct-v0.2',
    'zephyr': 'HuggingFaceH4/zephyr-7b-beta',
    'phi': 'microsoft/phi-2'
  };

  const selectedModel = config.model || 'llama';
  const modelId = modelMap[selectedModel] || modelMap['llama'];
  const systemPrompt = config.systemInstruction || '';
  
  // Combine system instruction with user prompt
  const fullPrompt = systemPrompt 
    ? `<|system|>\n${systemPrompt}\n<|user|>\n${prompt}\n<|assistant|>\n`
    : `<|user|>\n${prompt}\n<|assistant|>\n`;

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', errorText);
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    
    // HF returns array of generated text
    const generatedText = data[0]?.generated_text || data.generated_text || '';
    
    return { text: generatedText.trim() };
  } catch (error) {
    console.error('Hugging Face AI Error:', error);
    throw new Error('Yapay Zeka servisine bağlanılamadı. Lütfen tekrar deneyin.');
  }
}

/**
 * Available free models on Hugging Face
 * All support Turkish language to varying degrees
 */
export const AVAILABLE_MODELS = [
  { id: 'llama', name: 'Meta Llama 3 8B (Varsayılan - En İyi Türkçe)' },
  { id: 'mistral', name: 'Mistral 7B (Hızlı & Güçlü)' },
  { id: 'zephyr', name: 'Zephyr 7B (Konver. Odaklı)' },
  { id: 'phi', name: 'Microsoft Phi-2 (Hafif)' },
];
