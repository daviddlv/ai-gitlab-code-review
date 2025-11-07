import type { WebhookPushEventSchema, WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { BaseError } from '../../config/errors.js'
import type { CoreMessage } from 'ai'
import type { AIProvider, AIModel } from '../../config/index.js'

export interface GitLabFetchHeaders {
  'private-token': string
}

export type CommentPayload = { body: string } | { note: string }

// #region Webhook Handler
export type SupportedWebhookEvent = WebhookPushEventSchema | WebhookMergeRequestEventSchema

// Unified webhook handler result (works for all AI providers)
export interface WebhookHandlerResult {
  mergeRequestIid: string | number
  messages: CoreMessage[]
  gitLabBaseUrl: URL
  provider: AIProvider
  modelName: AIModel
}

export type GitLabWebhookHandler<TWebhookEvent extends SupportedWebhookEvent = SupportedWebhookEvent> = (event: TWebhookEvent, envVariables: {
  gitlabUrl: URL
  headers: GitLabFetchHeaders
}) => Promise<WebhookHandlerResult | Error | undefined>

export type GitLabWebhookHandlerReturnType = Awaited<ReturnType<GitLabWebhookHandler>>
// #endregion

// #region Errors
type GitLabErrorName =
    | 'MISSING_DIFF'
    | 'EMPTY_DIFF'
    | 'MISSING_OLD_FILES'
    | 'FAILED_TO_POST_COMMENT'
    | 'FAILED_TO_APPROVE_MR'
    | 'UNSUPPORTED_EVENT_TYPE'

type AIErrorName =
    | 'MISSING_AI_COMPLETION'

export class GitLabError extends BaseError<GitLabErrorName> { }
export class AIError extends BaseError<AIErrorName> { }
// #endregion
