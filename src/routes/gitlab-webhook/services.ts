import { generateText, type CoreMessage, type LanguageModel } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import type { RepositoryCompareSchema } from '@gitbeaker/rest'
import { type GitLabFetchHeaders, GitLabError, type CommentPayload, type InlineComment, type InlineCommentPosition } from './types.js'
import { AI_MODEL_TEMPERATURE } from '../../prompt/index.js'
import type { AIModel, AIProvider } from '../../config/index.js'
import { Logger } from '../../utils/logger.js'

type GitLabFetchFunction<URLParams extends Record<string, any> = {}, Result = GitLabError> = (
  logger: Logger,
  fetchParams: {
    gitLabBaseUrl: URL
    headers: GitLabFetchHeaders
  } & URLParams,
  ...rest: any[]
) => Promise<Result>

interface FetchBranchParams {
  gitLabBaseUrl: URL
  targetBranch: string
  sourceBranch: string
}
type FetchBranchResult = RepositoryCompareSchema | GitLabError

/**
 * Fetch diff between two branches
 */
export const fetchBranchDiff: GitLabFetchFunction<FetchBranchParams, FetchBranchResult> = async (
  logger,
  {
    gitLabBaseUrl,
    headers,
    targetBranch,
    sourceBranch
  }
) => {
  const compareUrl = new URL(`${gitLabBaseUrl}/repository/compare`)
  compareUrl.searchParams.append('from', targetBranch)
  compareUrl.searchParams.append('to', sourceBranch)
  compareUrl.searchParams.append('unidiff', String(true))

  logger.info('Fetching branch diff', {
    url: compareUrl.toString(),
    targetBranch,
    sourceBranch
  })

  let branchDiff: Response | Error
  try {
    branchDiff = await fetch(compareUrl, { headers: { ...headers } })
  } catch (error: any) {
    logger.error('Failed to fetch branch diff', error, {
      url: compareUrl.toString(),
      targetBranch,
      sourceBranch
    })
    return new GitLabError({
      error,
      name: 'MISSING_DIFF',
      message: `Failed to fetch branch diff: ${error.message}`
    })
  }

  if (branchDiff instanceof Error) {
    return new GitLabError({
      error: branchDiff,
      name: 'MISSING_DIFF',
      message: `Failed to fetch branch diff: ${branchDiff.message}`
    })
  }

  if (!branchDiff.ok) {
    let errorText = ''
    try {
      errorText = await branchDiff.text()
    } catch {
      errorText = 'Unable to read error response'
    }
    
    logger.error('GitLab API returned error for branch diff', undefined, {
      status: branchDiff.status,
      statusText: branchDiff.statusText,
      errorBody: errorText,
      url: compareUrl.toString()
    })

    return new GitLabError({
      name: 'MISSING_DIFF',
      message: `Failed to fetch branch diff: HTTP ${branchDiff.status} ${branchDiff.statusText}`,
      statusCode: branchDiff.status,
      error: new Error(`Response body: ${errorText}`)
    })
  }

  const diffData = (await branchDiff.json()) as RepositoryCompareSchema

  logger.info('Successfully fetched branch diff', {
    commitCount: diffData.commits?.length ?? 0,
    diffCount: diffData.diffs?.length ?? 0
  })

  logger.debug('Branch diff payload', { diff: diffData })

  return diffData
}

interface FetchPreEditFilesParams {
  changesOldPaths: string[]
}
export interface OldFileVersion { fileName: string, fileContent: string }
type FetchPreEditFilesResult = OldFileVersion[] | GitLabError

/**
 * Fetch old versions of files before changes
 */
export const fetchPreEditFiles: GitLabFetchFunction<FetchPreEditFilesParams, FetchPreEditFilesResult> = async (
  logger,
  {
    gitLabBaseUrl,
    headers,
    changesOldPaths
  }
) => {
  logger.info('Fetching old file versions', {
    fileCount: changesOldPaths.length,
    files: changesOldPaths
  })

  const oldFilesRequestUrls = changesOldPaths.map((path: string) =>
    new URL(`${gitLabBaseUrl}/repository/files/${encodeURIComponent(path)}/raw`)
  )

  let oldFiles: Array<PromiseSettledResult<string>> | Error
  try {
    oldFiles = await Promise.allSettled(
      oldFilesRequestUrls.map(async (url: URL) => {
        const file = await (await fetch(url, { headers: { ...headers } })).text()
        return file
      })
    )
  } catch (error: any) {
    logger.error('Failed to fetch old files', error, {
      fileCount: changesOldPaths.length
    })
    return new GitLabError({
      error,
      name: 'MISSING_OLD_FILES',
      message: `Failed to fetch old files: ${error.message}`
    })
  }

  // We throw no error if no file is found because the file might have been created anew
  if (oldFiles instanceof Error) {
    return new GitLabError({
      error: oldFiles,
      name: 'MISSING_OLD_FILES',
      message: `Failed to fetch old files: ${oldFiles.message}`
    })
  }

  const result = oldFiles.reduce<OldFileVersion[]>((acc, file, index) => {
    if (file.status === 'fulfilled') {
      acc.push({
        fileName: changesOldPaths[index]!,
        fileContent: file.value
      })
    } else {
      logger.warn('Failed to fetch old file', {
        fileName: changesOldPaths[index],
        reason: file.reason?.message ?? 'Unknown error'
      })
    }
    return acc
  }, [])

  logger.info('Successfully fetched old files', {
    successCount: result.length,
    totalCount: changesOldPaths.length
  })

  logger.debug('Old files content', { files: result })

  return result
}

/**
 * Clean and fix common JSON formatting issues in AI responses
 */
function cleanJsonString(jsonText: string): string {
  // Trim whitespace
  let cleaned = jsonText.trim()
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
  
  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')
  
  // Fix common escape issues in strings
  // Replace unescaped newlines inside strings with \n
  cleaned = cleaned.replace(/"([^"]*)\n([^"]*?)"/g, (_match, before, after) => {
    return `"${before}\\n${after}"`
  })
  
  // Fix unescaped quotes inside strings (but not already escaped ones)
  // This is tricky - we look for patterns like: "text"text" and fix to "text\"text"
  cleaned = cleaned.replace(/([^\\])"([^",:}\]]*)"([^,:}\]]*)/g, '$1\\"$2\\"$3')
  
  // Try to fix unterminated strings by finding the error position
  // This is a heuristic approach - it might not work for all cases
  try {
    JSON.parse(cleaned)
    return cleaned
  } catch (error: any) {
    // If we have a position, try to fix unterminated string
    const posMatch = error.message.match(/position (\d+)/)
    if (posMatch && error.message.includes('Unterminated string')) {
      const pos = parseInt(posMatch[1])
      // Add closing quote at the error position
      cleaned = cleaned.slice(0, pos) + '"' + cleaned.slice(pos)
      
      // Try parsing again to validate
      try {
        JSON.parse(cleaned)
        return cleaned
      } catch {
        // If still fails, return original
        return jsonText
      }
    }
    return jsonText
  }
}

/**
 * Extract complete JSON object from text, handling incomplete/truncated responses
 */
function extractCompleteJson(jsonText: string): string {
  const firstBrace = jsonText.indexOf('{')
  if (firstBrace === -1) return jsonText
  
  let braceCount = 0
  let inString = false
  let escapeNext = false
  let lastValidIndex = -1
  
  for (let i = firstBrace; i < jsonText.length; i++) {
    const char = jsonText[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
      continue
    }
    
    if (inString) continue
    
    if (char === '{') braceCount++
    if (char === '}') {
      braceCount--
      if (braceCount === 0) {
        lastValidIndex = i
        break
      }
    }
  }
  
  if (lastValidIndex !== -1) {
    return jsonText.substring(firstBrace, lastValidIndex + 1)
  }
  
  // JSON is incomplete, try to close it properly
  if (braceCount > 0) {
    // Close any open string first
    const result = (inString ? jsonText + '"' : jsonText) + '}'.repeat(braceCount)
    return result
  }
  
  return jsonText
}

/**
 * Generate AI completion using configured provider
 */
export async function generateAICompletion (
  logger: Logger,
  messages: CoreMessage[],
  provider: AIProvider,
  modelName: AIModel
): Promise<{ text: string } | Error> {
  logger.info('Calling AI provider', {
    provider,
    model: modelName,
    messageCount: messages.length,
    temperature: AI_MODEL_TEMPERATURE
  })

  logger.debug('AI request messages', { messages })

  try {
    // Create the appropriate model instance based on provider
    let model: LanguageModel

    switch (provider) {
      case 'anthropic':
        model = anthropic(modelName)
        break

      case 'openai':
        model = openai(modelName)
        break

      case 'google':
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

    logger.info('AI response received', {
      provider,
      model: modelName,
      responseLength: result.text.length,
      finishReason: result.finishReason,
      usage: result.usage
    })

    logger.debug('AI response text', { response: result.text })

    return { text: result.text }
  } catch (error: any) {
    logger.error('AI API call failed', error, {
      provider,
      model: modelName,
      errorCode: error.code,
      errorStatus: error.status
    })
    return error
  }
}

/**
 * Find existing bot comment on the merge request
 * Returns the note ID if found, null otherwise
 */
async function findExistingBotComment (
  logger: Logger,
  params: {
    gitLabBaseUrl: URL
    headers: GitLabFetchHeaders
    mergeRequestIid: string | number
  }
): Promise<number | null> {
  const notesUrl = new URL(`${params.gitLabBaseUrl}/merge_requests/${params.mergeRequestIid}/notes`)
  
  logger.debug('Searching for existing bot comment', {
    url: notesUrl.toString(),
    mergeRequestIid: params.mergeRequestIid
  })

  try {
    const response = await fetch(notesUrl, {
      method: 'GET',
      headers: params.headers
    })

    if (!response.ok) {
      logger.warn('Failed to fetch existing notes', {
        status: response.status,
        statusText: response.statusText
      })
      return null
    }

    const notes = await response.json() as Array<{ id: number, author: { username: string }, body: string, system: boolean }>
    
    logger.debug('Fetched existing notes', { count: notes.length })

    // Filter bot notes (non-system notes from the current bot user)
    const botNotes = notes.filter(note => 
      !note.system && 
      note.body?.includes('🤖') // Our bot comments include this emoji
    )

    if (botNotes.length > 0 && botNotes[0]) {
      logger.info('Found existing bot comment', {
        noteId: botNotes[0].id,
        totalBotComments: botNotes.length
      })
      return botNotes[0].id
    }

    logger.debug('No existing bot comment found')
    return null
  } catch (error: any) {
    logger.warn('Error searching for existing bot comment', {
      error: error.message
    })
    return null
  }
}

/**
 * Update an existing AI comment
 */
async function updateAIComment (
  logger: Logger,
  params: {
    gitLabBaseUrl: URL
    headers: GitLabFetchHeaders
    mergeRequestIid: string | number
    noteId: number
  },
  commentPayload: CommentPayload
): Promise<void | GitLabError> {
  const updateUrl = new URL(`${params.gitLabBaseUrl}/merge_requests/${params.mergeRequestIid}/notes/${params.noteId}`)

  logger.info('Updating existing AI comment', {
    url: updateUrl.toString(),
    noteId: params.noteId,
    mergeRequestIid: params.mergeRequestIid
  })

  logger.debug('Update payload', { payload: commentPayload })

  try {
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        ...params.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentPayload)
    })

    if (!response.ok) {
      let errorBody = ''
      try {
        errorBody = await response.text()
      } catch {
        errorBody = 'Unable to read error response'
      }

      logger.error('GitLab API returned error for comment update', undefined, {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        noteId: params.noteId
      })

      return new GitLabError({
        name: 'FAILED_TO_UPDATE_COMMENT',
        message: `Failed to update AI comment: HTTP ${response.status} ${response.statusText}`,
        statusCode: response.status,
        error: new Error(`Response body: ${errorBody}`)
      })
    }

    logger.info('Successfully updated AI comment', {
      noteId: params.noteId,
      mergeRequestIid: params.mergeRequestIid
    })
  } catch (error: any) {
    logger.error('Failed to update AI comment', error, {
      noteId: params.noteId,
      mergeRequestIid: params.mergeRequestIid
    })
    return new GitLabError({
      error,
      name: 'FAILED_TO_UPDATE_COMMENT',
      message: `Failed to update AI comment: ${error.message}`
    })
  }
}

interface PostAICommentParams {
  mergeRequestIid: string | number
}
type PostAICommentResult = void | GitLabError

/**
 * Post or update AI review comment to merge request
 * If a bot comment already exists, it will be updated instead of creating a new one
 */
export const postAIComment: GitLabFetchFunction<PostAICommentParams, PostAICommentResult> = async (
  logger,
  {
    gitLabBaseUrl,
    headers,
    mergeRequestIid
  },
  commentPayload: CommentPayload
): Promise<void | GitLabError> => {
  logger.info('Processing AI comment', {
    mergeRequestIid,
    payloadSize: JSON.stringify(commentPayload).length
  })

  logger.debug('Comment payload', { payload: commentPayload })

  // Check if a bot comment already exists
  const existingNoteId = await findExistingBotComment(logger, {
    gitLabBaseUrl,
    headers,
    mergeRequestIid
  })

  // If exists, update it; otherwise create new one
  if (existingNoteId !== null) {
    logger.info('Updating existing bot comment', {
      noteId: existingNoteId,
      mergeRequestIid
    })

    return await updateAIComment(logger, {
      gitLabBaseUrl,
      headers,
      mergeRequestIid,
      noteId: existingNoteId
    }, commentPayload)
  }

  // Create new comment
  const commentUrl = new URL(`${gitLabBaseUrl}/merge_requests/${mergeRequestIid}/notes`)

  logger.info('Creating new AI comment', {
    url: commentUrl.toString(),
    mergeRequestIid
  })

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
    logger.error('Failed to post AI comment', error, {
      mergeRequestIid,
      url: commentUrl.toString()
    })
    return new GitLabError({
      error,
      name: 'FAILED_TO_POST_COMMENT',
      message: `Failed to post AI comment: ${error.message}`
    })
  }

  if (aiComment instanceof Error) {
    return new GitLabError({
      error: aiComment,
      name: 'FAILED_TO_POST_COMMENT',
      message: `Failed to post AI comment: ${aiComment.message}`
    })
  }

  if (!aiComment.ok) {
    let errorBody = ''
    try {
      errorBody = await aiComment.text()
    } catch {
      errorBody = 'Unable to read error response'
    }

    logger.error('GitLab API returned error for comment post', undefined, {
      status: aiComment.status,
      statusText: aiComment.statusText,
      errorBody,
      mergeRequestIid
    })

    return new GitLabError({
      name: 'FAILED_TO_POST_COMMENT',
      message: `Failed to post AI comment: HTTP ${aiComment.status} ${aiComment.statusText}`,
      statusCode: aiComment.status,
      error: new Error(`Response body: ${errorBody}`)
    })
  }

  logger.info('Successfully created AI comment', { mergeRequestIid })
}

interface PostInlineCommentsParams {
  mergeRequestIid: string | number
  baseSha: string
  headSha: string
  startSha: string
  comments: InlineComment[]
}
type PostInlineCommentsResult = void | GitLabError

/**
 * Post inline comments on specific lines of code
 */
export const postInlineComments: GitLabFetchFunction<PostInlineCommentsParams, PostInlineCommentsResult> = async (
  logger,
  {
    gitLabBaseUrl,
    headers,
    mergeRequestIid,
    baseSha,
    headSha,
    startSha,
    comments
  }
): Promise<void | GitLabError> => {
  const discussionsUrl = new URL(`${gitLabBaseUrl}/merge_requests/${mergeRequestIid}/discussions`)

  logger.info('Posting inline comments', {
    url: discussionsUrl.toString(),
    mergeRequestIid,
    commentCount: comments.length,
    baseSha,
    headSha,
    startSha
  })

  logger.debug('Inline comments to post', { comments })

  const errors: GitLabError[] = []

  // Post each inline comment as a separate discussion
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i]!
    
    logger.debug(`Posting inline comment ${i + 1}/${comments.length}`, {
      file: comment.file,
      line: comment.line,
      isOldFile: comment.isOldFile
    })

    const position: InlineCommentPosition = {
      base_sha: baseSha,
      head_sha: headSha,
      start_sha: startSha,
      position_type: 'text',
      new_path: comment.file,
      new_line: comment.line
    }

    // If commenting on deleted line, use old_path and old_line
    if (comment.isOldFile) {
      position.old_path = comment.file
      position.old_line = comment.line
      delete (position as any).new_path
      delete (position as any).new_line
    }

    const payload = {
      body: comment.comment,
      position
    }

    let response: Response | Error
    try {
      response = await fetch(discussionsUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (error: any) {
      logger.error(`Failed to post inline comment ${i + 1}/${comments.length}`, error, {
        file: comment.file,
        line: comment.line
      })
      errors.push(new GitLabError({
        error,
        name: 'FAILED_TO_POST_COMMENT',
        message: `Failed to post inline comment on ${comment.file}:${comment.line}: ${error.message}`
      }))
      continue
    }

    if (response instanceof Error) {
      errors.push(new GitLabError({
        error: response,
        name: 'FAILED_TO_POST_COMMENT',
        message: `Failed to post inline comment on ${comment.file}:${comment.line}: ${response.message}`
      }))
      continue
    }

    if (!response.ok) {
      let errorBody = ''
      try {
        errorBody = await response.text()
      } catch {
        errorBody = 'Unable to read error response'
      }

      logger.error(`GitLab API error for inline comment ${i + 1}/${comments.length}`, undefined, {
        file: comment.file,
        line: comment.line,
        status: response.status,
        statusText: response.statusText,
        errorBody
      })

      errors.push(new GitLabError({
        name: 'FAILED_TO_POST_COMMENT',
        message: `Failed to post inline comment on ${comment.file}:${comment.line}: HTTP ${response.status} ${response.statusText}`,
        statusCode: response.status,
        error: new Error(`Response body: ${errorBody}`)
      }))
    } else {
      logger.debug(`Successfully posted inline comment ${i + 1}/${comments.length}`, {
        file: comment.file,
        line: comment.line
      })
    }
  }

  // Return first error if any
  if (errors.length > 0) {
    logger.error('Some inline comments failed to post', undefined, {
      failedCount: errors.length,
      totalCount: comments.length,
      successCount: comments.length - errors.length
    })
    return errors[0]
  }

  logger.info('Successfully posted all inline comments', {
    count: comments.length
  })
}

/**
 * Try to parse AI response using regex-based extraction
 * More tolerant to JSON formatting errors
 */
function tryRegexParsing (
  logger: Logger,
  aiResponse: string
): { summary: string, inlineComments: InlineComment[] } | null {
  try {
    // Extract summary - try multiple patterns
    let summary = ''
    const summaryMatch1 = aiResponse.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
    const summaryMatch2 = aiResponse.match(/"summary"\s*:\s*"([^"]*)"/s)
    
    if (summaryMatch1?.[1]) {
      summary = summaryMatch1[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
    } else if (summaryMatch2?.[1]) {
      summary = summaryMatch2[1]
    } else {
      // Try to extract everything before inline_comments
      const beforeInline = aiResponse.match(/"summary"\s*:\s*"([\s\S]*?)"\s*,?\s*"inline_comments"/s)
      if (beforeInline?.[1]) {
        summary = beforeInline[1]
      } else {
        // No summary found, return null to try JSON.parse
        return null
      }
    }
    
    const result = {
      summary,
      inlineComments: [] as InlineComment[]
    }
    
    // Extract inline comments with robust regex
    const inlineCommentsSection = aiResponse.match(/"inline_comments"\s*:\s*\[([\s\S]*?)(?:\]|$)/s)
    
    if (inlineCommentsSection) {
      const commentsText = inlineCommentsSection[1] ?? ''
      
      // Pattern 1: Standard format with all fields (any order)
      const pattern1 = /\{\s*"file"\s*:\s*"([^"]+)"\s*,\s*"line"\s*:\s*(\d+)\s*,\s*"comment"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/gs
      let commentMatches = commentsText.matchAll(pattern1)
      
      for (const match of commentMatches) {
        if (match[1] && match[2] && match[3]) {
          result.inlineComments.push({
            file: match[1],
            line: parseInt(match[2]),
            comment: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
          })
        }
      }
      
      // Pattern 2: More lenient - extract fields individually from each object
      if (result.inlineComments.length === 0) {
        const objectMatches = commentsText.matchAll(/\{[^}]*\}/gs)
        
        for (const objMatch of objectMatches) {
          const obj = objMatch[0]
          const fileMatch = obj.match(/"file"\s*:\s*"([^"]+)"/)
          const lineMatch = obj.match(/"line"\s*:\s*(\d+)/)
          const commentMatch = obj.match(/"comment"\s*:\s*"((?:[^"\\]|\\.)*)"/)
          
          if (fileMatch?.[1] && lineMatch?.[1] && commentMatch?.[1]) {
            result.inlineComments.push({
              file: fileMatch[1],
              line: parseInt(lineMatch[1]),
              comment: commentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
            })
          }
        }
      }
    }
    
    // Only return result if we got at least a summary
    if (summary.length > 0) {
      return result
    }
    
    return null
  } catch (error) {
    logger.debug('Regex parsing failed', {
      error: (error as Error).message
    })
    return null
  }
}

/**
 * Parse structured JSON response from AI
 */
export function parseStructuredResponse (
  logger: Logger,
  aiResponse: string
): { summary: string, inlineComments: InlineComment[] } {
  logger.debug('Parsing structured AI response', {
    responseLength: aiResponse.length
  })

  // Strategy: Try regex-based parsing FIRST (more tolerant), then JSON.parse as fallback
  // This avoids JSON syntax errors from malformed AI responses
  
  logger.debug('Attempting regex-based parsing (primary method)')
  const regexResult = tryRegexParsing(logger, aiResponse)
  
  if (regexResult) {
    logger.info('Successfully parsed with regex-based method', {
      hasSummary: !!regexResult.summary,
      summaryLength: regexResult.summary.length,
      inlineCommentCount: regexResult.inlineComments.length
    })
    return regexResult
  }

  // Fallback to JSON.parse if regex parsing failed
  logger.debug('Regex parsing failed, attempting JSON.parse')
  
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                      aiResponse.match(/```\s*([\s\S]*?)\s*```/)

    let jsonText = jsonMatch?.[1] ?? aiResponse
    
    // Clean up and extract complete JSON
    jsonText = jsonText.trim()
    jsonText = extractCompleteJson(jsonText)
    jsonText = cleanJsonString(jsonText)
    
    logger.debug('Cleaned JSON text for parsing', {
      jsonLength: jsonText.length,
      hasCodeBlock: !!jsonMatch,
      jsonPreview: jsonText.substring(0, 500)
    })
    
    const parsed = JSON.parse(jsonText)

    const result = {
      summary: parsed.summary || '',
      inlineComments: parsed.inline_comments || []
    }

    logger.info('Successfully parsed with JSON.parse', {
      hasSummary: !!result.summary,
      inlineCommentCount: result.inlineComments.length
    })

    return result
  } catch (error: any) {
    logger.error('Both parsing methods failed, using full response as summary', error, {
      responsePreview: aiResponse.substring(0, 500),
      responseLength: aiResponse.length,
      errorPosition: error.message.match(/position (\d+)/)?.[1]
    })

    // Final fallback: return full response as summary
    logger.warn('Using full AI response as summary fallback')
    return {
      summary: aiResponse,
      inlineComments: []
    }
  }
}

interface ApproveMergeRequestParams {
  mergeRequestIid: string | number
}
type ApproveMergeRequestResult = void | GitLabError

/**
 * Approve merge request
 */
export const approveMergeRequest: GitLabFetchFunction<ApproveMergeRequestParams, ApproveMergeRequestResult> = async (
  logger,
  {
    gitLabBaseUrl,
    headers,
    mergeRequestIid
  }
): Promise<void | GitLabError> => {
  const approveUrl = new URL(`${gitLabBaseUrl}/merge_requests/${mergeRequestIid}/approve`)

  logger.info('Approving merge request', {
    url: approveUrl.toString(),
    mergeRequestIid
  })

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
    logger.error('Failed to approve merge request', error, {
      mergeRequestIid,
      url: approveUrl.toString()
    })
    return new GitLabError({
      error,
      name: 'FAILED_TO_APPROVE_MR',
      message: `Failed to approve merge request: ${error.message}`
    })
  }

  if (approveResponse instanceof Error) {
    return new GitLabError({
      error: approveResponse,
      name: 'FAILED_TO_APPROVE_MR',
      message: `Failed to approve merge request: ${approveResponse.message}`
    })
  }

  if (!approveResponse.ok) {
    let errorBody = ''
    try {
      errorBody = await approveResponse.text()
    } catch {
      errorBody = 'Unable to read error response'
    }

    logger.error('GitLab API returned error for MR approval', undefined, {
      status: approveResponse.status,
      statusText: approveResponse.statusText,
      errorBody,
      mergeRequestIid
    })

    return new GitLabError({
      name: 'FAILED_TO_APPROVE_MR',
      message: `Failed to approve merge request: HTTP ${approveResponse.status} ${approveResponse.statusText}`,
      statusCode: approveResponse.status,
      error: new Error(`Response body: ${errorBody}`)
    })
  }

  logger.info('Successfully approved merge request', { mergeRequestIid })
}
