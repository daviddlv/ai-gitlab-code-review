import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { RepositoryCompareSchema } from '@gitbeaker/rest'
import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages.js'
import type { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { type GitLabFetchHeaders, AnthropicError, OpenAIError, GitLabError, type CommentPayload } from './types.js'
import { AI_MODEL_TEMPERATURE } from '../../prompt/index.js'
import type { ClaudeModel, OpenAIModel } from '../../config/index.js'

type GitLabFetchFunction<URLParams extends Record<string, any> = {}, Result = GitLabError> = (fetchParams: {
  gitLabBaseUrl: URL
  headers: GitLabFetchHeaders
} & URLParams, ...rest: any[]) => Promise<Result>

interface FetchBranchParams {
  gitLabBaseUrl: URL
  targetBranch: string
  sourceBranch: string
}
type FetchBranchResult = RepositoryCompareSchema | GitLabError
export const fetchBranchDiff: GitLabFetchFunction<FetchBranchParams, FetchBranchResult> = async ({
  gitLabBaseUrl,
  headers,
  targetBranch,
  sourceBranch
}) => {
  const compareUrl = new URL(`${gitLabBaseUrl}/repository/compare`)
  compareUrl.searchParams.append('from', targetBranch)
  compareUrl.searchParams.append('to', sourceBranch)
  compareUrl.searchParams.append('unidiff', String(true))

  console.log('Fetching branch diff from:', compareUrl.toString())
  console.log('Headers:', { ...headers, 'private-token': headers['private-token'] ? '[REDACTED]' : undefined })

  let branchDiff: Response | Error
  try {
    branchDiff = (
      await fetch(compareUrl, { headers: {...headers} })
    )
  } catch (error: any) {
    console.error('Fetch error:', error.message)
    branchDiff = error
  }
  if (branchDiff instanceof Error || !branchDiff.ok) {
    if (branchDiff instanceof Response) {
      const errorText = await branchDiff.text()
      console.error('GitLab API error:', branchDiff.status, errorText)
    }
    return new GitLabError({
      name: 'MISSING_DIFF',
      message: 'Failed to fetch branch diff'
    })
  }

  return await (branchDiff.json()) as RepositoryCompareSchema
}

interface FetchPreEditFilesParams {
  changesOldPaths: string[]
}
export interface OldFileVersion { fileName: string, fileContent: string }
type FetchPreEditFilesResult = OldFileVersion[] | GitLabError
export const fetchPreEditFiles: GitLabFetchFunction<FetchPreEditFilesParams, FetchPreEditFilesResult> = async ({
  gitLabBaseUrl,
  headers,
  changesOldPaths
}) => {
  const oldFilesRequestUrls = changesOldPaths.map(path =>
    new URL(`${gitLabBaseUrl}/repository/files/${encodeURIComponent(path)}/raw`)
  )
  let oldFiles: Array<PromiseSettledResult<string>> | Error
  try {
    oldFiles = await Promise.allSettled(
      oldFilesRequestUrls.map(async (url) => {
        const file = await (
          await fetch(url, { headers: {...headers} })
        ).text()
        return file
      })
    )
  } catch (error: any) {
    oldFiles = error
  }

  // We throw no error if no file is found because the file might have been created anew
  if (oldFiles instanceof Error) {
    return new GitLabError({
      name: 'MISSING_OLD_FILES',
      message: 'Failed to fetch old files'
    })
  }

  return oldFiles.reduce<OldFileVersion[]>((acc, file, index) => {
    if (file.status === 'fulfilled') {
      acc.push({
        fileName: changesOldPaths[index]!,
        fileContent: file.value
      })
    }
    return acc
  }, [])
}

export async function generateClaudeCompletion (
  messages: MessageParam[], 
  systemPrompt: string,
  anthropicInstance: Anthropic, 
  aiModel: ClaudeModel
): Promise<Message | AnthropicError> {
  let completion: Message | Error

  console.log('Calling Claude API with:', { model: aiModel, messageCount: messages.length })

  try {
    completion = await anthropicInstance.messages.create({
      model: aiModel,
      temperature: AI_MODEL_TEMPERATURE,
      max_tokens: 4096,
      system: systemPrompt,
      messages
    })
  } catch (error: any) {
    console.error('Claude API error:', error.message, error.status, error.error)
    completion = error
  }

  if (completion instanceof Error) {
    return new AnthropicError({
      name: 'MISSING_AI_COMPLETION',
      message: `Failed to generate AI completion: ${completion.message}`
    })
  }

  return completion
}

export async function generateOpenAICompletion (
  messages: ChatCompletionMessageParam[],
  openaiInstance: OpenAI, 
  aiModel: OpenAIModel
): Promise<ChatCompletion | OpenAIError> {
  let completion: ChatCompletion | Error

  console.log('Calling OpenAI API with:', { model: aiModel, messageCount: messages.length })

  try {
    completion = await openaiInstance.chat.completions.create({
      model: aiModel,
      temperature: AI_MODEL_TEMPERATURE,
      stream: false,
      messages
    })
  } catch (error: any) {
    console.error('OpenAI API error:', error.message, error.status, error.code)
    completion = error
  }

  if (completion instanceof Error) {
    return new OpenAIError({
      name: 'MISSING_AI_COMPLETION',
      message: `Failed to generate AI completion: ${completion.message}`
    })
  }

  return completion
}

interface PostAICommentParams {
  mergeRequestIid: string | number
}
type PostAICommentResult = void | GitLabError
export const postAIComment: GitLabFetchFunction<PostAICommentParams, PostAICommentResult> = async ({
  gitLabBaseUrl,
  headers,
  mergeRequestIid
}, commentPayload: CommentPayload): Promise<void | GitLabError> => {
  const commentUrl = new URL(`${gitLabBaseUrl}/merge_requests/${mergeRequestIid}/notes`)
  let aiComment: Response | Error
  try {
    aiComment = await fetch(commentUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentPayload)
    })
  } catch (error: any) {
    aiComment = error
  }
  if (aiComment instanceof Error || !aiComment.ok) {
    return new GitLabError({
      name: 'FAILED_TO_POST_COMMENT',
      message: 'Failed to post AI comment'
    })
  }
}

interface ApproveMergeRequestParams {
  mergeRequestIid: string | number
}
type ApproveMergeRequestResult = void | GitLabError
export const approveMergeRequest: GitLabFetchFunction<ApproveMergeRequestParams, ApproveMergeRequestResult> = async ({
  gitLabBaseUrl,
  headers,
  mergeRequestIid
}): Promise<void | GitLabError> => {
  const approveUrl = new URL(`${gitLabBaseUrl}/merge_requests/${mergeRequestIid}/approve`)
  let approveResponse: Response | Error
  try {
    approveResponse = await fetch(approveUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    approveResponse = error
  }
  if (approveResponse instanceof Error || !approveResponse.ok) {
    return new GitLabError({
      name: 'FAILED_TO_APPROVE_MR',
      message: 'Failed to approve merge request'
    })
  }
}
