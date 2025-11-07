import { buildPrompt } from '../../prompt/index.js'
import { GitLabError, type CommentPayload, type GitLabWebhookHandler, type SupportedWebhookEvent } from './types.js'
import { fetchBranchDiff, fetchPreEditFiles } from './services.js'
import type { WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { getProviderFromModel, type AIModel } from '../../config/index.js'

const supportedMergeRequestActions: Array<WebhookMergeRequestEventSchema['object_attributes']['action']> = [
  'open',
  'update',
  'reopen'
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

  console.log('MR action received:', action, 'Supported actions:', supportedMergeRequestActions)
  
  if (!supportedMergeRequestActions.includes(action)) {
    console.log('Action not supported, skipping')
    return
  }

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
  const aiModel = process.env.AI_MODEL as AIModel
  const provider = getProviderFromModel(aiModel)

  // Build unified prompt (works for both providers with Vercel AI SDK)
  const messages = buildPrompt({ oldFiles, changes: changes.diffs ?? [] })
  
  return {
    mergeRequestIid,
    gitLabBaseUrl,
    messages,
    provider,
    modelName: aiModel
  }
}

export const buildCommentPayload = <T extends SupportedWebhookEvent>(answer: string, eventType: T['object_kind']): CommentPayload => {
  if (eventType === 'merge_request') {
    return { body: answer } as CommentPayload
  }
  return { note: answer }
}
