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

    let shouldApprove = false;

    if (commentMode === "structured") {
      shouldApprove = await handleStructuredMode(logger, fastify, webhookBody, {
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
      // In global mode, we don't have structured response, so don't auto-approve
      shouldApprove = false;
    }

    // Step 3: Auto-approve if applicable
    logger.info("Step 3/3: Checking if MR should be auto-approved", {
      shouldApprove,
      commentMode,
    });

    if (shouldApprove) {
      logger.info("Approving merge request (approved by AI)");

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
      logger.info(
        "MR not approved - AI review detected issues or not in structured mode",
      );
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
): Promise<boolean> {
  const { answer, gitLabBaseUrl, mergeRequestIid, baseSha, headSha, startSha } =
    params;

  logger.info("Processing structured mode response");

  const { summary, approved, inlineComments } = parseStructuredResponse(
    logger,
    answer,
  );

  logger.info("Structured response parsed", {
    hasSummary: !!summary && summary.trim().length > 0,
    approved,
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

  // Return the approved status from AI
  return approved;
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
