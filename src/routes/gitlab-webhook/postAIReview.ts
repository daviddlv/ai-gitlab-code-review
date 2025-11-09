import { buildAnswer } from "../../prompt/index.js";
import { buildCommentPayload } from "./hookHandlers.js";
import {
  generateAICompletion,
  postAIComment,
  postInlineComments,
  parseStructuredResponse,
  approveMergeRequest,
} from "./services.js";
import type { CommentMode } from "./types.js";
import type { FastifyBaseLogger } from "fastify";

/**
 * Determine if MR should be approved based on AI response
 */
function shouldApproveMR(
  logger: FastifyBaseLogger,
  aiResponse: string,
): boolean {
  logger.debug("Analyzing AI response for approval decision", {
    responseLength: aiResponse.length,
  });
  logger.debug("Analyzing AI response for approval decision", {
    responseLength: aiResponse.length,
  });

  const lowerResponse = aiResponse.toLowerCase();

  // Negative keywords indicating issues
  const negativeKeywords = [
    "erreur",
    "error",
    "bug",
    "problème",
    "problem",
    "critique",
    "critical",
    "vulnérabilité",
    "vulnerability",
    "sécurité",
    "security issue",
    "attention",
    "warning",
    "risque",
    "risk",
    "à corriger",
    "must fix",
    "should fix",
    "incorrect",
    "wrong",
    "manquant",
    "missing",
    "casser",
    "break",
  ];

  const hasNegativeKeywords = negativeKeywords.some((keyword) =>
    lowerResponse.includes(keyword),
  );

  if (hasNegativeKeywords) {
    logger.info("MR should not be approved - negative keywords found", {
      foundKeywords: negativeKeywords.filter((k) => lowerResponse.includes(k)),
    });
    return false;
  }

  // Positive keywords indicating good quality
  const positiveKeywords = [
    "lgtm",
    "looks good",
    "approuvé",
    "approved",
    "bon",
    "good",
    "correct",
    "bien",
    "parfait",
    "perfect",
    "aucun problème",
    "no issue",
    "conforme",
    "compliant",
  ];

  const hasPositiveKeywords = positiveKeywords.some((keyword) =>
    lowerResponse.includes(keyword),
  );

  logger.info("MR approval decision", {
    shouldApprove: hasPositiveKeywords,
    hasPositiveKeywords,
    hasNegativeKeywords,
    foundPositiveKeywords: hasPositiveKeywords
      ? positiveKeywords.filter((k) => lowerResponse.includes(k))
      : [],
  });

  return hasPositiveKeywords;
}

/**
 * Post AI review comment to GitLab merge request
 */
export async function postAIReview(
  logger: FastifyBaseLogger,
  fastify: any,
  webhookBody: any,
  webhookResult: any,
): Promise<void> {
  logger.info("Starting AI review process", {
    hasWebhookBody: !!webhookBody,
    hasWebhookResult: !!webhookResult,
    webhookResultType: webhookResult?.constructor?.name,
    isError: webhookResult instanceof Error,
  });

  // Validation checks
  if (webhookResult instanceof Error) {
    logger.error(
      "Webhook result is an error, skipping AI review",
      webhookResult,
    );
    return;
  }

  if (webhookResult == null) {
    logger.warn("No webhook result, skipping AI review");
    return;
  }

  // Extract webhook result data
  const {
    gitLabBaseUrl,
    mergeRequestIid,
    provider,
    modelName,
    messages,
    baseSha,
    headSha,
    startSha,
  } = webhookResult;
  const commentMode = (process.env.COMMENT_MODE || "global") as CommentMode;

  logger.info("AI review configuration", {
    provider,
    model: modelName,
    commentMode,
    mergeRequestIid,
    hasCommitSHAs: !!(baseSha && headSha && startSha),
  });

  try {
    // Step 1: Generate AI completion
    logger.info("Step 1/3: Generating AI completion", {
      provider,
      model: modelName,
      commentMode,
    });

    const result = await generateAICompletion(
      logger,
      messages,
      provider,
      modelName,
    );

    let answer: string;

    // Handle AI completion error
    if (result instanceof Error) {
      logger.error("AI completion failed", result);
      answer = buildAnswer(undefined, result);

      // Post error as global comment regardless of mode
      const commentPayload = buildCommentPayload(
        answer,
        webhookBody.object_kind,
      );
      const aiComment = await postAIComment(
        logger,
        {
          gitLabBaseUrl,
          mergeRequestIid,
          headers: fastify.gitLabFetchHeaders,
        },
        commentPayload,
      );

      if (aiComment instanceof Error) throw aiComment;
      return;
    }

    answer = buildAnswer(result.text);

    logger.info("AI completion generated successfully", {
      answerLength: answer.length,
    });

    logger.debug("AI response content", { response: answer });

    // Step 2: Post comments based on mode
    logger.info("Step 2/3: Posting AI review comments", {
      commentMode,
    });

    if (commentMode === "structured") {
      await handleStructuredMode(logger, fastify, webhookBody, {
        answer,
        gitLabBaseUrl,
        mergeRequestIid,
        baseSha,
        headSha,
        startSha,
      });
    } else {
      await handleGlobalMode(logger, fastify, webhookBody, {
        answer,
        gitLabBaseUrl,
        mergeRequestIid,
      });
    }

    // Step 3: Auto-approve if applicable
    logger.info("Step 3/3: Checking if MR should be auto-approved");

    if (shouldApproveMR(logger, answer)) {
      logger.info("Approving merge request");

      const approval = await approveMergeRequest(logger, {
        gitLabBaseUrl,
        mergeRequestIid,
        headers: fastify.gitLabFetchHeaders,
      });

      if (approval instanceof Error) {
        logger.warn("Failed to approve merge request", {
          error: approval.message,
        });
      } else {
        logger.info("Merge request approved successfully");
      }
    } else {
      logger.info("MR not approved - AI review detected potential issues");
    }

    logger.info("AI review process completed successfully");
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error during AI review process", error);
    }
  }
}

/**
 * Handle structured comment mode
 */
async function handleStructuredMode(
  logger: FastifyBaseLogger,
  fastify: any,
  webhookBody: any,
  params: {
    answer: string;
    gitLabBaseUrl: URL;
    mergeRequestIid: string | number;
    baseSha?: string;
    headSha?: string;
    startSha?: string;
  },
): Promise<void> {
  const { answer, gitLabBaseUrl, mergeRequestIid, baseSha, headSha, startSha } =
    params;

  logger.info("Processing structured mode response");

  const { summary, inlineComments } = parseStructuredResponse(logger, answer);

  logger.info("Structured response parsed", {
    hasSummary: !!summary && summary.trim().length > 0,
    inlineCommentCount: inlineComments.length,
  });

  logger.debug("Parsed inline comments details", {
    inlineComments: inlineComments.map((c) => ({
      file: c.file,
      line: c.line,
      commentPreview: c.comment.substring(0, 100),
    })),
  });

  // Post inline comments if available
  if (inlineComments.length > 0 && baseSha && headSha && startSha) {
    logger.info("Posting inline comments", {
      count: inlineComments.length,
    });

    const inlineResult = await postInlineComments(logger, {
      gitLabBaseUrl,
      mergeRequestIid,
      headers: fastify.gitLabFetchHeaders,
      baseSha,
      headSha,
      startSha,
      comments: inlineComments,
    });

    if (inlineResult instanceof Error) {
      logger.warn("Failed to post some inline comments", {
        error: inlineResult.message,
      });
    }
  } else if (inlineComments.length > 0) {
    logger.warn("Missing commit SHAs, cannot post inline comments", {
      hasBaseSha: !!baseSha,
      hasHeadSha: !!headSha,
      hasStartSha: !!startSha,
    });
  }

  // Post summary as global comment
  if (summary && summary.trim()) {
    logger.info("Posting summary comment");

    const commentPayload = buildCommentPayload(
      buildAnswer(summary),
      webhookBody.object_kind,
    );
    const aiComment = await postAIComment(
      logger,
      {
        gitLabBaseUrl,
        mergeRequestIid,
        headers: fastify.gitLabFetchHeaders,
      },
      commentPayload,
    );

    if (aiComment instanceof Error) throw aiComment;
  } else if (inlineComments.length === 0) {
    // No inline comments and no summary: post full response as global
    logger.warn(
      "Structured response has no content, posting full response as global comment",
    );

    const commentPayload = buildCommentPayload(answer, webhookBody.object_kind);
    const aiComment = await postAIComment(
      logger,
      {
        gitLabBaseUrl,
        mergeRequestIid,
        headers: fastify.gitLabFetchHeaders,
      },
      commentPayload,
    );

    if (aiComment instanceof Error) throw aiComment;
  }
}

/**
 * Handle global comment mode
 */
async function handleGlobalMode(
  logger: FastifyBaseLogger,
  fastify: any,
  webhookBody: any,
  params: {
    answer: string;
    gitLabBaseUrl: URL;
    mergeRequestIid: string | number;
  },
): Promise<void> {
  const { answer, gitLabBaseUrl, mergeRequestIid } = params;

  logger.info("Posting global comment");

  const commentPayload = buildCommentPayload(answer, webhookBody.object_kind);
  const aiComment = await postAIComment(
    logger,
    {
      gitLabBaseUrl,
      mergeRequestIid,
      headers: fastify.gitLabFetchHeaders,
    },
    commentPayload,
  );

  if (aiComment instanceof Error) throw aiComment;

  logger.info("Global comment posted successfully");
}
