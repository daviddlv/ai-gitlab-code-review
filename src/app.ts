import * as path from 'path'
import AutoLoad, { type AutoloadPluginOptions } from '@fastify/autoload'
import type { FastifyPluginAsync } from 'fastify'
import { fileURLToPath } from 'url'
import { S } from 'fluent-json-schema'
import { fastifyEnv } from '@fastify/env'
import { AI_MODELS } from './config/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // It's very common to pass secrets and configuration
  // to your application via environment variables.
  // The `fastify-env` plugin will expose those configuration
  // under `fastify.config` and validate those at startup.
  await fastify.register(fastifyEnv, {
    confKey: 'env',
    schema: S.object()
      .prop('ANTHROPIC_API_KEY', S.string())
      .prop('OPENAI_API_KEY', S.string())
      .prop('GITLAB_TOKEN', S.string().required())
      .prop('GITLAB_URL', S.string().required())
      .prop('AI_MODEL', S.string().enum(AI_MODELS).required())
      .valueOf(),
    dotenv: true
  })

  // Validate that at least one API key is provided based on the model
  const { AI_MODEL, ANTHROPIC_API_KEY, OPENAI_API_KEY } = fastify.env
  const isClaudeModel = AI_MODEL.startsWith('claude')
  const isOpenAIModel = AI_MODEL.startsWith('gpt')

  if (isClaudeModel && !ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required when using Claude models')
  }
  if (isOpenAIModel && !OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI models')
  }

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true
  })
}

export default app
export { app, options }
