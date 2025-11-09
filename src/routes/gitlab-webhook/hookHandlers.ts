import { buildPrompt } from "../../prompt/index.js";
import {
  GitLabError,
  type CommentPayload,
  type GitLabWebhookHandler,
  type SupportedWebhookEvent,
  type CommentMode,
} from "./types.js";
import { fetchBranchDiff, fetchPreEditFiles } from "./services.js";
import type { WebhookMergeRequestEventSchema } from "@gitbeaker/rest";
import { getProviderFromModel, type AIModel } from "../../config/index.js";
import type { FastifyBaseLogger } from "fastify";

const supportedMergeRequestActions: Array<
  WebhookMergeRequestEventSchema["object_attributes"]["action"]
> = ["open", "update", "reopen"] as const;

/**
 * Handle GitLab merge request webhook events
 */
export const handleMergeRequestHook: GitLabWebhookHandler<
  WebhookMergeRequestEventSchema
> = async (
  logger: FastifyBaseLogger,
  mergeRequestEvent: WebhookMergeRequestEventSchema,
  { gitlabUrl, headers },
) => {
  const {
    object_attributes: {
      target_project_id: targetProjectId,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      iid: mergeRequestIid,
      action,
      last_commit: lastCommit,
    },
  } = mergeRequestEvent;

  logger.info("Received merge request webhook", {
    action,
    mergeRequestIid,
    targetProjectId,
    sourceBranch,
    targetBranch,
  });

  logger.debug("Full MR webhook payload", { payload: mergeRequestEvent });

  // Check if action is supported
  if (!supportedMergeRequestActions.includes(action)) {
    logger.info("MR action not supported, skipping", {
      action,
      supportedActions: supportedMergeRequestActions,
    });
    return;
  }

  const gitLabBaseUrl = new URL(`${gitlabUrl}/projects/${targetProjectId}`);

  // Step 1: Fetch branch diff
  logger.info("Step 1/4: Fetching branch diff", {
    sourceBranch,
    targetBranch,
  });

  const changes = await fetchBranchDiff(logger, {
    gitLabBaseUrl,
    sourceBranch,
    targetBranch,
    headers,
  });

  if (changes instanceof Error) {
    logger.error("Failed to fetch branch diff", changes, {
      sourceBranch,
      targetBranch,
    });
    return changes;
  }

  if (changes.diffs == null || changes.diffs.length === 0) {
    logger.warn("No changes found in merge request", {
      mergeRequestIid,
      sourceBranch,
      targetBranch,
    });
    return new GitLabError({
      name: "EMPTY_DIFF",
      message: "No changes found in the merge request",
      statusCode: 404,
    });
  }

  logger.info("Branch diff fetched successfully", {
    diffCount: changes.diffs.length,
    commitCount: changes.commits?.length ?? 0,
  });

  const changesOldPaths = changes.diffs.map((diff) => diff.old_path);

  // Step 2: Fetch old file versions
  logger.info("Step 2/4: Fetching old file versions", {
    fileCount: changesOldPaths.length,
  });

  const oldFiles = await fetchPreEditFiles(logger, {
    gitLabBaseUrl,
    changesOldPaths,
    headers,
  });

  if (oldFiles instanceof Error) {
    logger.error("Failed to fetch old files", oldFiles);
    return oldFiles;
  }

  logger.info("Old files fetched successfully", {
    fileCount: oldFiles.length,
  });

  // Step 3: Determine AI provider and build prompt
  logger.info("Step 3/4: Building AI prompt");

  const aiModel = process.env.AI_MODEL as AIModel;
  const provider = getProviderFromModel(aiModel);
  const commentMode = (process.env.COMMENT_MODE || "global") as CommentMode;

  logger.info("AI configuration", {
    provider,
    model: aiModel,
    commentMode,
  });

  const messages = buildPrompt({
    oldFiles,
    changes: changes.diffs ?? [],
    commentMode,
  });

  logger.info("Prompt built successfully", {
    messageCount: messages.length,
    commentMode,
  });

  logger.debug("Prompt messages", { messages });

  // Step 4: Extract commit SHAs
  logger.info("Step 4/4: Extracting commit SHAs for inline comments");

  const mrAttrs = mergeRequestEvent.object_attributes as any;

  // Extract SHAs from different possible locations in the webhook payload
  const headSha = (lastCommit?.id ||
    mrAttrs?.last_commit?.id ||
    (changes as any).commit?.id ||
    mrAttrs?.source_branch_sha) as string | undefined;

  const baseSha = ((changes as any).commits?.[0]?.parent_ids?.[0] ||
    mrAttrs?.target_branch_sha ||
    mrAttrs?.diff_refs?.base_sha ||
    headSha) as string | undefined;

  const startSha = (mrAttrs?.diff_refs?.start_sha || baseSha) as
    | string
    | undefined;

  logger.info("Commit SHAs extracted", {
    headSha,
    baseSha,
    startSha,
    hasLastCommit: !!lastCommit,
    hasDiffRefs: !!mrAttrs?.diff_refs,
  });

  logger.debug("Full diff_refs from webhook", {
    diff_refs: mrAttrs?.diff_refs,
  });

  if (!baseSha || !headSha || !startSha) {
    logger.warn("Some commit SHAs are missing, inline comments may not work", {
      hasBaseSha: !!baseSha,
      hasHeadSha: !!headSha,
      hasStartSha: !!startSha,
    });
  }

  logger.info("MR webhook processing completed successfully", {
    mergeRequestIid,
    provider,
    model: aiModel,
  });

  return {
    mergeRequestIid,
    gitLabBaseUrl,
    messages,
    provider,
    modelName: aiModel,
    baseSha,
    headSha,
    startSha: baseSha,
  };
};

export const buildCommentPayload = <T extends SupportedWebhookEvent>(
  answer: string,
  eventType: T["object_kind"],
): CommentPayload => {
  if (eventType === "merge_request") {
    return { body: answer } as CommentPayload;
  }
  return { note: answer };
};
