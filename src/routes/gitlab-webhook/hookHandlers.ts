import { buildClaudePrompt, buildOpenAIPrompt } from '../../prompt/index.js'
import { GitLabError, type CommentPayload, type GitLabWebhookHandler, type SupportedWebhookEvent, type WebhookHandlerResult } from './types.js'
import { fetchBranchDiff, fetchPreEditFiles } from './services.js'
import type { WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { getProviderFromModel, type AIModel } from '../../config/index.js'

const supportedMergeRequestActions: Array<WebhookMergeRequestEventSchema['object_attributes']['action']> = [
  'update'
] as const

export const handleMergeRequestHook: GitLabWebhookHandler<WebhookMergeRequestEventSchema> = async (mergeRequestEvent: WebhookMergeRequestEventSchema, {
  gitlabUrl,
  headers
}) => {
  const {
    object_attributes: {
      target_project_id: targetProjectId,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      iid: mergeRequestIid,
      action
    }
  } = mergeRequestEvent

  if (!supportedMergeRequestActions.includes(action)) return

  const gitLabBaseUrl = new URL(`${gitlabUrl}/projects/${targetProjectId}`)

  const changes = await fetchBranchDiff({
    gitLabBaseUrl,
    sourceBranch,
    targetBranch,
    headers
  })
  if (changes instanceof Error) return changes
  if ((changes.diffs == null) || (changes.diffs.length === 0)) return new GitLabError({ name: 'EMPTY_DIFF', message: 'No changes found in the merge request', statusCode: 404 })

  const changesOldPaths = changes.diffs.map(diff => diff.old_path)

  // Fetch files before the edit
  const oldFiles = await fetchPreEditFiles({
    gitLabBaseUrl,
    changesOldPaths,
    headers
  })
  if (oldFiles instanceof Error) return oldFiles

  // Determine which provider to use based on AI_MODEL env variable
  // This will be passed from the environment in the route handler
  const aiModel = process.env.AI_MODEL as AIModel
  const provider = getProviderFromModel(aiModel)

  if (provider === 'anthropic') {
    const messageParams = buildClaudePrompt({ oldFiles, changes: changes.diffs ?? [] })
    return {
      mergeRequestIid,
      gitLabBaseUrl,
      messageParams,
      provider: 'anthropic' as const
    }
  } else {
    const messageParams = buildOpenAIPrompt({ oldFiles, changes: changes.diffs ?? [] })
    return {
      mergeRequestIid,
      gitLabBaseUrl,
      messageParams,
      provider: 'openai' as const
    }
  }
}

export const buildCommentPayload = <T extends SupportedWebhookEvent>(answer: string, eventType: T['object_kind']): CommentPayload => {
  if (eventType === 'merge_request') {
    return { body: answer } as CommentPayload
  }
  return { note: answer }
}
