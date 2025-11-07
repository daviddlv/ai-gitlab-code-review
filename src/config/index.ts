// Claude Models (Anthropic) - Jan 2025
// Source: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
export type ClaudeModel = 
  // Claude 4.5 (Latest - 2025)
  | 'claude-haiku-4-5'                // Claude Haiku 4.5 (Latest)
  | 'claude-sonnet-4-5'               // Claude Sonnet 4.5 (Latest)
  | 'claude-sonnet-4-5-20250929'      // Claude Sonnet 4.5 (Dated)
  // Claude 4 (2025)
  | 'claude-opus-4-1'                 // Claude Opus 4.1 (Latest)
  | 'claude-opus-4-0'                 // Claude Opus 4.0
  | 'claude-sonnet-4-0'               // Claude Sonnet 4.0
  | 'claude-sonnet-4-20250514'        // Claude Sonnet 4 (Dated)
  // Claude 3.7 (2025)
  | 'claude-3-7-sonnet-latest'        // Claude 3.7 Sonnet (Latest alias)
  | 'claude-3-7-sonnet-20250219'      // Claude 3.7 Sonnet (Dated)
  // Claude 3.5 (Recommended for production)
  | 'claude-3-5-sonnet-20241022'      // Latest 3.5 Sonnet (Nov 2024) - Best balance
  | 'claude-3-5-sonnet-20240620'      // Previous 3.5 Sonnet
  | 'claude-3-5-haiku-20241022'       // Latest Haiku (Nov 2024) - Fast & cheap
  | 'claude-3-5-haiku-latest'         // Latest Haiku alias
  // Claude 3
  | 'claude-3-opus-20240229'          // Most capable, expensive
  | 'claude-3-sonnet-20240229'        // Balanced
  | 'claude-3-haiku-20240307'         // Fast and cheap

// OpenAI Models - Nov 2025
// Source: https://ai-sdk.dev/providers/ai-sdk-providers/openai
export type OpenAIModel = 
  // GPT-5 Series (Latest - 2025)
  | 'gpt-5-pro'                       // GPT-5 Pro (most capable)
  | 'gpt-5'                           // GPT-5 Standard
  | 'gpt-5-mini'                      // GPT-5 Mini (faster, cheaper)
  | 'gpt-5-nano'                      // GPT-5 Nano (smallest)
  | 'gpt-5-codex'                     // GPT-5 Codex (code specialized)
  | 'gpt-5-chat-latest'               // GPT-5 Chat (latest version)
  // GPT-4.1 Series (2025)
  | 'gpt-4.1'                         // GPT-4.1 Standard
  | 'gpt-4.1-mini'                    // GPT-4.1 Mini
  | 'gpt-4.1-nano'                    // GPT-4.1 Nano
  // GPT-4o (Omni) - Recommended for production
  | 'gpt-4o'                          // GPT-4 Omni (latest, multimodal)
  | 'gpt-4o-2024-11-20'               // Latest GPT-4o (Nov 2024)
  | 'gpt-4o-2024-08-06'               // Previous GPT-4o
  | 'gpt-4o-2024-05-13'               // Original GPT-4o
  | 'gpt-4o-mini'                     // Smaller, cheaper GPT-4o
  | 'gpt-4o-mini-2024-07-18'          // Specific GPT-4o mini version
  // GPT-4 Turbo
  | 'gpt-4-turbo'                     // Latest GPT-4 Turbo
  | 'gpt-4-turbo-2024-04-09'          // Specific Turbo version
  // GPT-4 Base
  | 'gpt-4'                           // Base GPT-4
  | 'gpt-4-0613'                      // Snapshot
  // o4 Series (Reasoning - Latest)
  | 'o4-mini'                         // o4 Mini reasoning model
  // o3 Series (Reasoning)
  | 'o3'                              // o3 reasoning model
  | 'o3-mini'                         // o3 Mini reasoning model
  // o1 Series (Reasoning - Legacy)
  | 'o1-preview'                      // Reasoning model (preview)
  | 'o1-mini'                         // Smaller reasoning model
  // Specialized Models
  | 'codex-mini-latest'               // Codex Mini (code interpreter)
  | 'computer-use-preview'            // Computer use model (preview)

// Google Gemini Models - Jan 2025
// Source: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
export type GeminiModel = 
  // Gemini 2.5 (Latest - 2025)
  | 'gemini-2.5-pro'                  // Gemini 2.5 Pro (Latest)
  | 'gemini-2.5-flash'                // Gemini 2.5 Flash (Latest)
  | 'gemini-2.5-flash-lite'           // Gemini 2.5 Flash Lite
  | 'gemini-2.5-flash-lite-preview-06-17'  // Gemini 2.5 Flash Lite Preview
  | 'gemini-2.5-flash-image-preview'  // Gemini 2.5 Flash Image (Image generation)
  // Gemini 2.0
  | 'gemini-2.0-flash'                // Gemini 2.0 Flash
  | 'gemini-2.0-flash-exp'            // Gemini 2.0 Flash (Experimental)
  // Gemini 1.5 (Stable)
  | 'gemini-1.5-pro'                  // Best for complex reasoning
  | 'gemini-1.5-pro-002'              // Specific version
  | 'gemini-1.5-pro-latest'           // Latest Pro alias
  | 'gemini-1.5-flash'                // Fast and efficient
  | 'gemini-1.5-flash-002'            // Specific version
  | 'gemini-1.5-flash-latest'         // Latest Flash alias
  | 'gemini-1.5-flash-8b'             // Smaller, cheaper
  | 'gemini-1.5-flash-8b-latest'      // Latest 8B alias
  // Gemini 1.0 (Legacy)
  | 'gemini-1.0-pro'                  // Legacy

export type AIModel = ClaudeModel | OpenAIModel | GeminiModel

export type AIProvider = 'anthropic' | 'openai' | 'google'

export const CLAUDE_MODELS: ClaudeModel[] = [
  // Claude 4.5
  'claude-haiku-4-5',
  'claude-sonnet-4-5',
  'claude-sonnet-4-5-20250929',
  // Claude 4
  'claude-opus-4-1',
  'claude-opus-4-0',
  'claude-sonnet-4-0',
  'claude-sonnet-4-20250514',
  // Claude 3.7
  'claude-3-7-sonnet-latest',
  'claude-3-7-sonnet-20250219',
  // Claude 3.5
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-5-haiku-20241022',
  'claude-3-5-haiku-latest',
  // Claude 3
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
];

export const OPENAI_MODELS: OpenAIModel[] = [
  // GPT-5 Series
  'gpt-5-pro',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5-codex',
  'gpt-5-chat-latest',
  // GPT-4.1 Series
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  // GPT-4o Series
  'gpt-4o',
  'gpt-4o-2024-11-20',
  'gpt-4o-2024-08-06',
  'gpt-4o-2024-05-13',
  'gpt-4o-mini',
  'gpt-4o-mini-2024-07-18',
  // GPT-4 Turbo
  'gpt-4-turbo',
  'gpt-4-turbo-2024-04-09',
  'gpt-4',
  'gpt-4-0613',
  // o4 Series
  'o4-mini',
  // o3 Series
  'o3',
  'o3-mini',
  // o1 Series
  'o1-preview',
  'o1-mini',
  // Specialized
  'codex-mini-latest',
  'computer-use-preview'
]

export const GEMINI_MODELS: GeminiModel[] = [
  // Gemini 2.5
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.5-flash-image-preview',
  // Gemini 2.0
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  // Gemini 1.5
  'gemini-1.5-pro',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-8b-latest',
  // Gemini 1.0
  'gemini-1.0-pro'
]

export const AI_MODELS: AIModel[] = [
  ...CLAUDE_MODELS,
  ...OPENAI_MODELS,
  ...GEMINI_MODELS
]

export function getProviderFromModel(model: AIModel): AIProvider {
  if (CLAUDE_MODELS.includes(model as ClaudeModel)) {
    return 'anthropic'
  }
  if (OPENAI_MODELS.includes(model as OpenAIModel)) {
    return 'openai'
  }
  if (GEMINI_MODELS.includes(model as GeminiModel)) {
    return 'google'
  }
  throw new Error(`Unknown model: ${model}`)
}
