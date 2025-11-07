import { generateText, type CoreMessage, type LanguageModel } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import type { RepositoryCompareSchema } from '@gitbeaker/rest'
import { type GitLabFetchHeaders, GitLabError, type CommentPayload } from './types.js'
import { AI_MODEL_TEMPERATURE } from '../../prompt/index.js'
import type { AIModel, AIProvider } from '../../config/index.js'

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

// Unified AI completion function using Vercel AI SDK
export async function generateAICompletion (
  messages: CoreMessage[],
  provider: AIProvider,
  modelName: AIModel
): Promise<{ text: string } | Error> {
  console.log('Calling AI API with:', { provider, model: modelName, messageCount: messages.length })

  try {
    // Create the appropriate model instance based on provider
    let model: LanguageModel
    
    switch (provider) {
      case 'anthropic':
        // API key from ANTHROPIC_API_KEY env var
        model = anthropic(modelName)
        break
      
      case 'openai':
        // API key from OPENAI_API_KEY env var
        model = openai(modelName)
        break
      
      case 'google':
        // API key from GOOGLE_GENERATIVE_AI_API_KEY env var
        model = google(modelName)
        break
      
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    const result = await generateText({
      model,
      messages,
      temperature: AI_MODEL_TEMPERATURE
    })

    return { text: result.text }
  } catch (error: any) {
    console.error('AI API error:', error.message, error.status, error.code)
    return error
  }
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
