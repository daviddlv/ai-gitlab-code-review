import type {
  FastifyPluginAsync,
  RequestParamsDefault,
  RequestQuerystringDefault,
} from "fastify";
import {
  GitLabError,
  type GitLabFetchHeaders,
  type GitLabWebhookHandlerReturnType,
  type SupportedWebhookEvent,
} from "./types.js";
import { handleMergeRequestHook } from "./hookHandlers.js";
import { postAIReview } from "./postAIReview.js";
import { BaseError } from "../../config/errors.js";

export interface GitLabWebhookRequest {
  Body?: SupportedWebhookEvent;
  Querystring?: RequestQuerystringDefault;
  Params?: RequestParamsDefault;
  Headers?: {
    "x-gitlab-token": string;
  };
}

declare module "fastify" {
  // Extension from decorator
  interface FastifyInstance {
    gitLabWebhookHandlerResult: GitLabWebhookHandlerReturnType;
    gitLabFetchHeaders: GitLabFetchHeaders;
  }
}

const gitlabWebhook: FastifyPluginAsync = async (
  fastify,
  _opts,
): Promise<void> => {
  fastify
    .decorate<GitLabWebhookHandlerReturnType>(
      "gitLabWebhookHandlerResult",
      new GitLabError({
        name: "UNSUPPORTED_EVENT_TYPE",
        message: "Webhook event type not supported",
      }),
    )
    .decorate<GitLabFetchHeaders>("gitLabFetchHeaders", {
      "private-token": fastify.env.GITLAB_TOKEN,
    })
    .post<GitLabWebhookRequest>("/", async function (request, reply) {
      const logger = fastify.log.child({ module: "gitlab-webhook" });
      const gitlabUrl = new URL(fastify.env.GITLAB_URL);

      logger.info("Received GitLab webhook request", {
        eventType: request.body?.object_kind,
        hasToken: !!request.headers["x-gitlab-token"],
      });

      logger.debug("Webhook headers", { headers: request.headers });

      // Token validation
      if (request.headers["x-gitlab-token"] !== fastify.env.GITLAB_TOKEN) {
        logger.warn("Unauthorized webhook request - invalid token");
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }

      // Body validation
      if (request.body == null) {
        logger.warn("Bad request - missing body");
        reply.code(400).send({ error: "Bad Request" });
        return;
      }

      logger.debug("Full webhook payload", { payload: request.body });

      // FETCH NEEDED PARAMS FOR AI COMPLETION
      try {
        logger.info("Processing webhook event", {
          eventType: request.body.object_kind,
        });

        if (request.body.object_kind === "merge_request") {
          logger.info("Handling merge request webhook");

          fastify.gitLabWebhookHandlerResult = await handleMergeRequestHook(
            logger,
            request.body,
            {
              gitlabUrl,
              headers: fastify.gitLabFetchHeaders,
            },
          );

          logger.info("Merge request webhook handled", {
            hasResult: !!fastify.gitLabWebhookHandlerResult,
            isError: fastify.gitLabWebhookHandlerResult instanceof Error,
          });
        } else {
          logger.warn("Unsupported webhook event type", {
            eventType: request.body.object_kind,
          });
        }
      } catch (error: any) {
        logger.error("Exception during webhook processing", error);
        fastify.gitLabWebhookHandlerResult = error;
      }

      const { gitLabWebhookHandlerResult } = fastify;

      // Handle errors
      if (gitLabWebhookHandlerResult instanceof Error) {
        logger.error(
          "Webhook handler returned error",
          gitLabWebhookHandlerResult,
        );

        const statusCode =
          gitLabWebhookHandlerResult instanceof BaseError
            ? gitLabWebhookHandlerResult.statusCode
            : 500;

        reply.code(statusCode).send({ result: gitLabWebhookHandlerResult });
        return;
      }

      logger.info("Webhook processed successfully, preparing AI review");

      // Save result before sending response
      const webhookResult = gitLabWebhookHandlerResult;

      // Return 200 OK to GitLab immediately to avoid webhook timeout
      logger.info("Sending 200 OK response to GitLab");
      reply.code(200).send({ status: "OK" });

      // CREATE AI COMMENT AND POST IT ON MERGE REQUEST (async, after response)
      setImmediate(() => {
        logger.info("Starting async AI review process", {
          hasWebhookResult: !!webhookResult,
          hasRequestBody: !!request.body,
        });

        postAIReview(logger, fastify, request.body, webhookResult).catch(
          (error) => {
            logger.error("Error in postAIReview", error);
          },
        );
      });
    });
};

export default gitlabWebhook;
