import type { AIModel } from './src/config/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    env: {
      ANTHROPIC_API_KEY?: string
      OPENAI_API_KEY?: string
      GITLAB_TOKEN: string
      GITLAB_URL: string
      EXPECTED_GITLAB_TOKEN: string
      AI_MODEL: AIModel
    }
  }
}
