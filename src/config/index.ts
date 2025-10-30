export type ClaudeModel = 
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-sonnet-20240620'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'

export type OpenAIModel = 
  | 'gpt-4o'
  | 'gpt-4o-2024-05-13'
  | 'gpt-4-turbo'
  | 'gpt-4-turbo-2024-04-09'
  | 'gpt-4'
  | 'gpt-4-0613'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-0125'

export type AIModel = ClaudeModel | OpenAIModel

export type AIProvider = 'anthropic' | 'openai'

export const CLAUDE_MODELS: ClaudeModel[] = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
]

export const OPENAI_MODELS: OpenAIModel[] = [
  'gpt-4o',
  'gpt-4o-2024-05-13',
  'gpt-4-turbo',
  'gpt-4-turbo-2024-04-09',
  'gpt-4',
  'gpt-4-0613',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-0125'
]

export const AI_MODELS: AIModel[] = [
  ...CLAUDE_MODELS,
  ...OPENAI_MODELS
]

export function getProviderFromModel(model: AIModel): AIProvider {
  if (CLAUDE_MODELS.includes(model as ClaudeModel)) {
    return 'anthropic'
  }
  if (OPENAI_MODELS.includes(model as OpenAIModel)) {
    return 'openai'
  }
  throw new Error(`Unknown model: ${model}`)
}
