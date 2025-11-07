import { buildAnswer } from '../../prompt/index.js'
import { buildCommentPayload } from './hookHandlers.js'
import { generateAICompletion, postAIComment, approveMergeRequest } from './services.js'

function shouldApproveMR(aiResponse: string): boolean {
  const lowerResponse = aiResponse.toLowerCase()
  
  // Mots-clés négatifs qui indiquent des problèmes
  const negativeKeywords = [
    'erreur', 'error',
    'bug', 'problème', 'problem',
    'critique', 'critical',
    'vulnérabilité', 'vulnerability',
    'sécurité', 'security issue',
    'attention', 'warning',
    'risque', 'risk',
    'à corriger', 'must fix', 'should fix',
    'incorrect', 'wrong',
    'manquant', 'missing',
    'casser', 'break'
  ]
  
  // Si la réponse contient des mots-clés négatifs, ne pas approuver
  const hasNegativeKeywords = negativeKeywords.some(keyword => lowerResponse.includes(keyword))
  
  if (hasNegativeKeywords) {
    return false
  }
  
  // Mots-clés positifs qui indiquent une bonne qualité
  const positiveKeywords = [
    'lgtm', 'looks good',
    'approuvé', 'approved',
    'bon', 'good',
    'correct', 'bien',
    'parfait', 'perfect',
    'aucun problème', 'no issue',
    'conforme', 'compliant'
  ]
  
  const hasPositiveKeywords = positiveKeywords.some(keyword => lowerResponse.includes(keyword))
  
  // Approuver si présence de mots positifs et absence de mots négatifs
  return hasPositiveKeywords
}

export async function postAIReview(
  fastify: any,
  webhookBody: any,
  webhookResult: any
): Promise<void> {
  fastify.log.info('postAIReview called with:', {
    hasWebhookBody: !!webhookBody,
    hasWebhookResult: !!webhookResult,
    webhookResultType: webhookResult?.constructor?.name,
    isError: webhookResult instanceof Error
  })

  if (webhookResult instanceof Error) {
    fastify.log.error('Webhook handler result is an error, skipping AI review')
    return
  }

  if (webhookResult == null) {
    fastify.log.warn('No webhook handler result, skipping AI review', { webhookResult })
    return
  }

  fastify.log.info('Starting AI review process...')

  // CREATE AI COMMENT
  const { gitLabBaseUrl, mergeRequestIid, provider, modelName, messages } = webhookResult

  try {
    fastify.log.info(`Generating AI completion with ${provider}...`)
    
    const result = await generateAICompletion(
      messages,
      provider,
      modelName
    )
    
    let answer: string
    
    if (result instanceof Error) {
      fastify.log.error('AI completion failed:', result.message)
      answer = buildAnswer(undefined, result)
    } else {
      answer = buildAnswer(result.text)
    }

    const commentPayload = buildCommentPayload(answer, webhookBody.object_kind)

    fastify.log.info('AI completion generated successfully, posting comment on the merge request...')
    // POST COMMENT ON MERGE REQUEST
    const aiComment = await postAIComment({
      gitLabBaseUrl,
      mergeRequestIid,
      headers: fastify.gitLabFetchHeaders
    }, commentPayload)
    if (aiComment instanceof Error) throw aiComment
    fastify.log.info('AI Comment posted successfully')

    // Analyser la réponse et approuver si pas de problème détecté
    if (shouldApproveMR(answer)) {
      fastify.log.info('AI review looks good, approving merge request...')
      const approval = await approveMergeRequest({
        gitLabBaseUrl,
        mergeRequestIid,
        headers: fastify.gitLabFetchHeaders
      })
      if (approval instanceof Error) {
        fastify.log.warn('Failed to approve merge request:', approval.message)
      } else {
        fastify.log.info('Merge request approved successfully')
      }
    } else {
      fastify.log.info('AI review detected potential issues, not approving merge request')
    }
  } catch (error) {
    if (error instanceof Error) {
      fastify.log.error('Error during AI review:', error.message, error)
    }
  }
}
