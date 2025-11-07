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
  // Log app initialization
  fastify.log.info('Initializing AI GitLab Code Review application')

  // It's very common to pass secrets and configuration
  // to your application via environment variables.
  // The `fastify-env` plugin will expose those configuration
  // under `fastify.config` and validate those at startup.
  fastify.log.info('Loading environment configuration')

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

  fastify.log.info('Environment configuration loaded', {
    gitlabUrl: fastify.env.GITLAB_URL,
    aiModel: fastify.env.AI_MODEL,
    commentMode: process.env.COMMENT_MODE || 'global',
    hasAnthropicKey: !!fastify.env.ANTHROPIC_API_KEY,
    hasOpenAIKey: !!fastify.env.OPENAI_API_KEY,
    hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
  })

  // Validate that at least one API key is provided based on the model
  const { AI_MODEL, ANTHROPIC_API_KEY, OPENAI_API_KEY } = fastify.env
  const isClaudeModel = AI_MODEL.startsWith('claude')
  const isOpenAIModel = AI_MODEL.startsWith('gpt')
  const isGeminiModel = AI_MODEL.startsWith('gemini')

  fastify.log.info('Validating AI provider configuration', {
    model: AI_MODEL,
    isClaudeModel,
    isOpenAIModel,
    isGeminiModel
  })

  if (isClaudeModel && !ANTHROPIC_API_KEY) {
    fastify.log.error('Missing ANTHROPIC_API_KEY for Claude model', {
      model: AI_MODEL
    })
    throw new Error('ANTHROPIC_API_KEY is required when using Claude models')
  }
  if (isOpenAIModel && !OPENAI_API_KEY) {
    fastify.log.error('Missing OPENAI_API_KEY for OpenAI model', {
      model: AI_MODEL
    })
    throw new Error('OPENAI_API_KEY is required when using OpenAI models')
  }
  if (isGeminiModel && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    fastify.log.error('Missing GOOGLE_GENERATIVE_AI_API_KEY for Gemini model', {
      model: AI_MODEL
    })
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required when using Gemini models')
  }

  fastify.log.info('AI provider configuration validated successfully')

  // Add request/response logging hooks
  fastify.addHook('onRequest', async (request) => {
    request.log.info('Incoming request', {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    })
  })

  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime
    })
  })

  fastify.addHook('onError', async (request, reply, error) => {
    request.log.error('Request error', error, {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode
    })
  })

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.log.info('Loading plugins')

  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.log.info('Loading routes')

  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true
  })

  fastify.log.info('Application initialized successfully')
}

export default app
export { app, options }
