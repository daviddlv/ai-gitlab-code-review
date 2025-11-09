import type { AIModel } from "./src/config/index.js";

declare module "fastify" {
  interface FastifyInstance {
    env: {
      ANTHROPIC_API_KEY?: string;
      OPENAI_API_KEY?: string;
      GOOGLE_GENERATIVE_AI_API_KEY?: string;
      GITLAB_TOKEN: string;
      GITLAB_URL: string;
      AI_MODEL: AIModel;
      COMMENT_MODE: "global" | "structured";
      HOST: string;
      PORT: number;
    };
  }
}
