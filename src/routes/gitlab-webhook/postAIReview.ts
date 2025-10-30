import { type FastifyPluginAsync } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { buildClaudeAnswer, buildOpenAIAnswer } from '../../prompt/index.js'
import { buildCommentPayload } from './hookHandlers.js'
import { generateClaudeCompletion, generateOpenAICompletion, postAIComment } from './services.js'
import type { GitLabWebhookRequest } from './index.js'

export const postAIReview: FastifyPluginAsync =
    async (fastify): Promise<void> => {
      fastify.addHook<GitLabWebhookRequest>('onResponse',
        async (request, reply) => {
          if (reply.statusCode !== 200) {
            // Do not execute onResponse hook if the response status code is not 200
            return
          }
          if (request.headers['x-gitlab-token'] !== fastify.env.GITLAB_TOKEN) {
            fastify.log.error({ error: 'Unauthorized' })
            return
          }
          if (request.body == null) {
            fastify.log.error({ error: 'Bad Request' })
            return
          }

          if (fastify.gitLabWebhookHandlerResult instanceof Error) throw fastify.gitLabWebhookHandlerResult

          if (fastify.gitLabWebhookHandlerResult == null) return

          // CREATE AI COMMENT
          const webhookResult = fastify.gitLabWebhookHandlerResult
          const { gitLabBaseUrl, mergeRequestIid, provider } = webhookResult

          try {
            let answer: string

            if (provider === 'anthropic') {
              const anthropicInstance = new Anthropic({
                apiKey: fastify.env.ANTHROPIC_API_KEY
              })
              const AIModel = fastify.env.AI_MODEL

              fastify.log.info('Generating Claude AI completion...')
              const completion = await generateClaudeCompletion(
                webhookResult.messageParams.messages,
                webhookResult.messageParams.systemPrompt,
                anthropicInstance,
                AIModel as any
              )
              answer = buildClaudeAnswer(completion)
            } else {
              const openaiInstance = new OpenAI({
                apiKey: fastify.env.OPENAI_API_KEY
              })
              const AIModel = fastify.env.AI_MODEL

              fastify.log.info('Generating OpenAI completion...')
              const completion = await generateOpenAICompletion(
                webhookResult.messageParams,
                openaiInstance,
                AIModel as any
              )
              answer = buildOpenAIAnswer(completion)
            }

            const commentPayload = buildCommentPayload(answer, request.body.object_kind)

            fastify.log.info('AI completion generated successfully, posting comment on the merge request...')
            // POST COMMENT ON MERGE REQUEST
            const aiComment = postAIComment({
              gitLabBaseUrl,
              mergeRequestIid,
              headers: fastify.gitLabFetchHeaders
            }, commentPayload)
            if (aiComment instanceof Error) throw aiComment
            fastify.log.info('AI Comment posted successfully')
          } catch (error) {
            if (error instanceof Error) {
              fastify.log.error(error.message, error)
            }
          }
        })
    }
