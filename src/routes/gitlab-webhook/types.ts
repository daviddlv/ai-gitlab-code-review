import type { WebhookPushEventSchema, WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { BaseError } from '../../config/errors.js'
import type { CoreMessage } from 'ai'
import type { AIProvider, AIModel } from '../../config/index.js'
import type { Logger } from '../../utils/logger.js'

export interface GitLabFetchHeaders {
  'private-token': string
}

export type CommentPayload = { body: string } | { note: string }

// #region Inline Comments
export interface InlineCommentPosition {
  base_sha: string
  head_sha: string
  start_sha: string
  position_type: 'text'
  new_path: string
  new_line: number
  old_path?: string
  old_line?: number
}

export interface InlineComment {
  file: string
  line: number
  comment: string
  isOldFile?: boolean // true if commenting on deleted line
}

export interface StructuredReview {
  summary: string
  inline_comments: InlineComment[]
}

export type CommentMode = 'global' | 'structured'
// #endregion

// #region Webhook Handler
export type SupportedWebhookEvent = WebhookPushEventSchema | WebhookMergeRequestEventSchema

// Unified webhook handler result (works for all AI providers)
export interface WebhookHandlerResult {
  mergeRequestIid: string | number
  messages: CoreMessage[]
  gitLabBaseUrl: URL
  provider: AIProvider
  modelName: AIModel
  baseSha?: string
  headSha?: string
  startSha?: string
}

export type GitLabWebhookHandler<TWebhookEvent extends SupportedWebhookEvent = SupportedWebhookEvent> = (
  logger: Logger,
  event: TWebhookEvent,
  envVariables: {
    gitlabUrl: URL
    headers: GitLabFetchHeaders
  }
) => Promise<WebhookHandlerResult | Error | undefined>

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
