import type { EvaluateTestSuite, TestCase } from "promptfoo";
import { breakingChangesAndErrorsTestCase } from "./test-cases/breaking-changes-and-errors/index.js";
import { dependencyDeletionTestCase } from "./test-cases/dependency-deletion/index.js";
import { fileDeletionTestCase } from "./test-cases/file-deletion/index.js";
import { newFileTestCase } from "./test-cases/new-file/index.js";
import { subtleErrorsTestCase } from "./test-cases/subtle-errors/index.js";
import {
  type BuildPromptParameters,
  buildClaudePrompt,
  buildOpenAIPrompt,
} from "../src/prompt/index.js";

const AI_MODEL = process.env.AI_MODEL || "";
const isClaudeModel = AI_MODEL.startsWith("claude");

const prompts: EvaluateTestSuite["prompts"] = [
  ({ vars }: { vars: BuildPromptParameters }) => {
    if (isClaudeModel) {
      const { messages, systemPrompt } = buildClaudePrompt(vars);
      // Convert to format compatible with Anthropic provider
      return [{ role: "system", content: systemPrompt }, ...messages];
    } else {
      // OpenAI format
      return buildOpenAIPrompt(vars);
    }
  },
];

const providers: EvaluateTestSuite["providers"] = [
  {
    id: isClaudeModel ? `anthropic:messages:${AI_MODEL}` : `openai:${AI_MODEL}`,
  },
];

const tests: Array<TestCase<any>> = [
  breakingChangesAndErrorsTestCase,
  dependencyDeletionTestCase,
  fileDeletionTestCase,
  newFileTestCase,
  subtleErrorsTestCase,
];

export const promptTestSuite: EvaluateTestSuite = {
  description: "Code review eval with Claude",
  prompts,
  providers,
  tests,
  writeLatestResults: true,
};
