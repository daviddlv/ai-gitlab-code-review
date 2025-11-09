# GitHub Copilot Instructions - AI GitLab Code Review

## Project Overview

This is a **GitLab webhook-based AI code review service** that automatically reviews merge requests using multiple AI providers (Anthropic Claude, OpenAI, Google Gemini). The service is built with **Fastify** (Node.js/TypeScript) and can be deployed via Docker or Google Cloud Run.

### Core Purpose

- Receive GitLab webhook events (merge request open/update/reopen)
- Fetch code changes (diffs) from GitLab API
- Send code to AI provider for review
- Post review comments back to GitLab (global or inline)

---

## Tech Stack & Dependencies

### Runtime

- **Node.js** with TypeScript
- **Fastify** (web framework)
- **pnpm** (package manager)
- **Docker** for containerization

### Key Dependencies

- `@fastify/autoload` - Auto-load routes and plugins
- `@fastify/env` - Environment variable validation
- `@gitbeaker/rest` - GitLab API client
- `ai` SDK with providers:
  - `@ai-sdk/anthropic` - Claude models
  - `@ai-sdk/openai` - GPT models
  - `@ai-sdk/google` - Gemini models
- `fluent-json-schema` - JSON schema builder for validation

### Dev Tools

- `ts-standard` - TypeScript linting
- `husky` + `commitlint` - Git hooks and commit conventions
- `promptfoo` - LLM prompt evaluation and testing
- `ngrok` - Local webhook testing

---

## Architecture Patterns

### File Structure

```
src/
├── app.ts                  # Fastify app setup
├── server.ts              # Entry point
├── config/                # Environment config & types
├── plugins/               # Fastify plugins (sensible, etc.)
├── prompt/                # AI prompt building logic
└── routes/
    └── gitlab-webhook/    # Main webhook handler
        ├── index.ts       # Route registration
        ├── hookHandlers.ts # MR event processing
        ├── services.ts    # AI provider calls
        ├── postAIReview.ts # Comment posting logic
        └── types.ts       # TypeScript types
```

### Comment Modes

The app supports 4 comment modes (see `COMMENT_MODES.md`):

1. **`global`** (default): Single comment with full review
2. **`inline`**: Parse AI text for inline comment patterns
3. **`hybrid`**: Inline comments + summary
4. **`structured`**: AI returns JSON with inline comments array

**Current recommendation**: Use `structured` mode with Claude 3.5 Sonnet for best results.

### AI Provider Pattern

All providers use the Vercel AI SDK (`ai` package):

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const result = await generateText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  prompt: "...",
});
```

---

## Code Conventions

### TypeScript

- Use **strict mode** enabled
- Prefer **explicit types** over `any`
- Use **type guards** for runtime validation
- Export types from `types.ts` in each module

### Naming

- **camelCase** for variables and functions
- **PascalCase** for types and interfaces
- **UPPER_CASE** for environment variables and constants
- Prefix interfaces with `I` only when needed for clarity

### Error Handling

- Use custom error classes from `src/config/errors.ts`
- Always log errors with context
- Return proper HTTP status codes (defined in `errors.ts`)

### Async/Await

- Always use `async/await` (no raw Promises)
- Use `try/catch` blocks for error handling
- Prefer `Promise.all()` for parallel operations

### GitLab API Usage

- Use `@gitbeaker/rest` Gitlab SDK
- Handle pagination when fetching large diffs
- Use Compare API for branch diffs: `Projects.compare()`
- Use Files API for old file content: `RepositoryFiles.show()`
- Use Discussions API for inline comments
- Use Notes API for global comments

---

## Environment Variables

### Required

```bash
# AI Provider (choose one set)
ANTHROPIC_API_KEY=sk-ant-...     # For Claude models
OPENAI_API_KEY=sk-...            # For OpenAI models
GOOGLE_GENERATIVE_AI_API_KEY=... # For Gemini models

# GitLab
GITLAB_TOKEN=glpat-...           # Personal access token
GITLAB_URL=https://gitlab.com/api/v4

# Model Selection
AI_MODEL=claude-3-5-sonnet-20241022  # Or gpt-4o, gemini-1.5-pro, etc.
```

### Optional

```bash
COMMENT_MODE=structured          # Default: global
PORT=3000                        # Default: 3000
HOST=0.0.0.0                     # Default: 0.0.0.0
```

---

## AI Model Selection

### Recommended Models (2025)

#### Claude (Anthropic) - Best for code review

- **Production**: `claude-3-5-sonnet-20241022` ⭐ (stable, proven)
- **Latest**: `claude-sonnet-4-5` (cutting edge)
- **Budget**: `claude-3-5-haiku-20241022`
- **Reasoning**: `claude-opus-4-1`

#### OpenAI - Fast and reliable

- **Production**: `gpt-4o` ⭐
- **Latest**: `gpt-5` or `gpt-5-pro`
- **Budget**: `gpt-4o-mini` or `gpt-5-mini`
- **Code**: `gpt-5-codex`

#### Gemini (Google) - Cost-effective

- **Latest**: `gemini-2.0-flash-exp` ⭐
- **Production**: `gemini-1.5-pro`
- **Budget**: `gemini-1.5-flash`

See `MODELS.md` and `PROVIDERS.md` for complete lists.

---

## Development Workflow

### Local Development

```bash
pnpm install          # Install dependencies
pnpm dev             # Start dev server with watch mode
pnpm lint            # Run linting
pnpm test            # Run tests
```

### Testing Webhooks Locally

```bash
pnpm ngrok           # Start ngrok tunnel
# Then configure GitLab webhook to: https://xxx.ngrok.io/gitlab
```

### Docker

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

### Deployment

```bash
# Google Cloud Run
./scripts/deploy-to-cloud-run.sh
```

---

## Testing

### Unit Tests

- Test files: `test/**/*.test.ts`
- Run with: `pnpm test`
- Use Fastify's `inject()` for route testing

### Prompt Testing (promptfoo)

- Config: `promptfoo/testSuite.ts`
- Test cases: `promptfoo/test-cases/`
- Run: `pnpm test:prompt`
- View results: `pnpm view:promptfooResults`

### Test Categories

1. **New file creation** - Handle added files
2. **File deletion** - Handle removed files
3. **Dependency changes** - Detect dependency updates/removals
4. **Breaking changes** - Identify breaking API changes
5. **Subtle errors** - Catch logic bugs and edge cases

---

## GitLab API Integration

### Webhook Events

Listen for: `merge_request` events with actions:

- `open` - New MR
- `update` - MR updated (new commits)
- `reopen` - MR reopened

### API Calls Flow

1. **Get MR diff**: `Projects.compare(projectId, baseSha, headSha)`
2. **Get old files**: `RepositoryFiles.show(projectId, filePath, baseSha)`
3. **Post inline comment**: `MergeRequestDiscussions.create(projectId, mrId, { body, position })`
4. **Post global comment**: `MergeRequestNotes.create(projectId, mrId, body)`

### Position Object (for inline comments)

```typescript
{
  base_sha: string,   // Source branch HEAD
  head_sha: string,   // Target branch HEAD
  start_sha: string,  // Common ancestor
  new_path: string,   // File path
  new_line: number    // Line number (1-indexed)
}
```

---

## Common Tasks

### Adding a New AI Provider

1. Install provider SDK: `pnpm add @ai-sdk/provider-name`
2. Add model types in `src/config/index.ts`
3. Update `generateAICompletion()` in `src/routes/gitlab-webhook/services.ts`
4. Add example in `PROVIDERS.md`
5. Update `MODELS.md` with model list

### Adding a New Comment Mode

1. Add mode in `src/config/index.ts` CommentMode type
2. Update prompt in `src/prompt/index.ts`
3. Add parsing logic in `src/routes/gitlab-webhook/postAIReview.ts`
4. Document in `COMMENT_MODES.md`
5. Add test cases in `promptfoo/test-cases/`

### Debugging GitLab API Issues

- Check GitLab webhook logs in project settings
- Use `fastify.log.info()` for debugging
- Verify GITLAB_TOKEN permissions (api, read_repository)
- Test API calls with: `curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" ...`

### Improving Prompts

1. Add test case in `promptfoo/test-cases/`
2. Run: `pnpm test:prompt`
3. Modify prompt in `src/prompt/index.ts`
4. Re-run tests and compare results
5. View detailed results: `pnpm view:promptfooResults`

---

## Security & Best Practices

### API Keys

- Never commit API keys
- Use `.env` file (gitignored)
- Validate env vars at startup with `@fastify/env`

### GitLab Token Permissions

Required scopes:

- `api` - Full API access
- `read_repository` - Read repo files
- `write_repository` - Post comments

### Rate Limiting

- AI providers have rate limits (check pricing pages)
- GitLab API: 300 requests/minute for personal tokens
- Implement exponential backoff for retries

### Error Handling

- Don't expose API keys in error messages
- Log errors with context but sanitize sensitive data
- Return user-friendly error messages to GitLab

---

## Documentation Files

- `README.md` - Quick start guide
- `ARCHITECTURE.md` - Detailed architecture diagrams
- `COMMENT_MODES.md` - Comment modes explanation
- `MODELS.md` - Complete model list with recommendations
- `PROVIDERS.md` - Provider setup guides
- `GITLAB_API.md` - GitLab API reference
- `EXAMPLES.md` - Usage examples
- `docs/DEPLOYMENT.md` - Deployment instructions
- `docs/GCP_COMMANDS.md` - Google Cloud commands

---

## Useful Commands Reference

```bash
# Development
pnpm dev                          # Start dev server
pnpm build:ts                     # Compile TypeScript
pnpm lint                         # Lint code

# Testing
pnpm test                         # Run unit tests
pnpm test:prompt                  # Test prompts with promptfoo
pnpm view:promptfooResults        # View prompt test results

# Docker
docker compose build              # Build image
docker compose up -d              # Start container
docker compose logs -f            # View logs
docker compose down               # Stop container

# Ngrok (local testing)
pnpm ngrok                        # Start ngrok tunnel

# Git
git commit -m "feat: ..."         # Conventional commits (commitlint)
```

---

## When Suggesting Code Changes

1. **Always check existing patterns** in the codebase first
2. **Use TypeScript types** - never use `any`
3. **Follow Fastify patterns** - use plugins, decorators, hooks
4. **Handle errors properly** - use try/catch and custom errors
5. **Add logging** - use `fastify.log.info/error/debug()`
6. **Update tests** - add test cases for new features
7. **Document changes** - update relevant .md files
8. **Validate with schema** - use fluent-json-schema for validation
9. **Consider all comment modes** - ensure changes work with all modes
10. **Test with promptfoo** - add test cases for prompt changes

---

## Troubleshooting Guide

### "Invalid API key" errors

- Check env var name matches provider (ANTHROPIC_API_KEY vs OPENAI_API_KEY)
- Verify key format (Claude: `sk-ant-`, OpenAI: `sk-`, Gemini: varies)

### GitLab webhook not triggering

- Check webhook URL is correct and accessible
- Verify webhook is enabled in GitLab project settings
- Check SSL certificate if using HTTPS
- Review GitLab webhook logs for errors

### AI comments not posting

- Verify GITLAB_TOKEN has correct permissions
- Check project ID and MR ID are correct
- Review Fastify logs for API errors
- Test GitLab API manually with curl

### Inline comments failing

- Ensure COMMENT_MODE is set correctly
- Verify position object has all required fields
- Check file path matches exactly (case-sensitive)
- Confirm line number exists in diff

### Docker build fails

- Check Node.js version in Dockerfile
- Verify pnpm version matches package.json
- Clear Docker cache: `docker system prune -a`

---

## Project Goals & Vision

- **Reliable**: Handle all GitLab webhook scenarios gracefully
- **Flexible**: Support multiple AI providers and comment modes
- **Fast**: Minimize latency for code review feedback
- **Testable**: Comprehensive tests for prompts and logic
- **Maintainable**: Clean code, good docs, clear architecture
- **Cost-effective**: Optimize for token usage and API costs

---

## Contact & Resources

- **GitLab API Docs**: https://docs.gitlab.com/ee/api/
- **Fastify Docs**: https://www.fastify.io/docs/latest/
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Claude Docs**: https://docs.anthropic.com/
- **OpenAI Docs**: https://platform.openai.com/docs
- **Gemini Docs**: https://ai.google.dev/docs
