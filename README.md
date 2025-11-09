# AI Code Reviewer

Gitlab AI Code Review is a JS script that leverages multiple AI providers (Anthropic Claude, OpenAI, Google Gemini) to automatically review code changes in GitLab repositories. It listens for merge request and push events, fetches the associated code changes, and provides feedback on the changes in a Markdown format.

## Features

- Automatically reviews code changes in GitLab repositories
- Provides feedback on code clarity, simplicity, bugs, and security issues
- Generates Markdown-formatted responses for easy readability in GitLab
- **2 comment modes**: Choose between global comments or structured JSON with inline comments
- **Simple and reliable**: JSON parsing for precise inline comments

### Comment Modes

The application supports 2 modes for posting AI review comments:

- **`global`** (default): Single comment with entire review - Simple and reliable
- **`structured`**: AI generates JSON with inline comments on specific lines + summary - Recommended for detailed reviews

📖 **See [COMMENT_MODES.md](COMMENT_MODES.md) for detailed documentation about each mode.**

### Prerequisites

- Docker
- An OpenAI API key
- A GitLab access token (can be generated in your [GitLab account settings](https://gitlab.com/-/user_settings/ssh_keys))

### Installation

1. Clone the repository:

```
https://github.com/Evobaso-J/ai-gitlab-code-review
cd ai-code-reviewer
```

2. Create a `.env` file by copying the `.env.example` file and set the required environment variables:

### For Anthropic Claude:

```bash
ANTHROPIC_API_KEY=<your Anthropic API key>
GITLAB_TOKEN=<your GitLab API token>
GITLAB_URL=https://gitlab.com/api/v4
AI_MODEL=claude-3-5-sonnet-20241022
```

### For OpenAI:

```bash
OPENAI_API_KEY=<your OpenAI API key>
GITLAB_TOKEN=<your GitLab API token>
GITLAB_URL=https://gitlab.com/api/v4
AI_MODEL=gpt-4o
```

### For Google Gemini:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=<your Google API key>
GITLAB_TOKEN=<your GitLab API token>
GITLAB_URL=https://gitlab.com/api/v4
AI_MODEL=gemini-1.5-pro
```

- `ANTHROPIC_API_KEY` is your Anthropic Claude account's API key (required for Claude models)
- `OPENAI_API_KEY` is your OpenAI account's API key (required for OpenAI GPT models)
- `GOOGLE_GENERATIVE_AI_API_KEY` is your Google API key (required for Gemini models)
- `GITLAB_TOKEN` is a personal gitlab account token. You can create it [here](https://gitlab.com/-/user_settings/personal_access_tokens) and it can be either be your own personal token or a token from a gitlab account created _ad hoc_
- `GITLAB_URL` it's the latest gitlab's api version url, currently https://gitlab.com/api/v4
- `AI_MODEL` is the model you want to use. Supported providers:
  - **Claude**: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-sonnet-4-5-20250929`, etc.
  - **OpenAI**: `gpt-5`, `gpt-5-mini`, `gpt-4o`, `gpt-4o-mini`, `o4-mini`, `o3`, etc.
  - **Gemini**: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash-exp`, etc.
- `COMMENT_MODE` (optional) is the comment posting mode:
  - `global` (default): Single comment with entire review - Simple and reliable
  - `structured`: JSON format with inline comments on specific lines + summary - Recommended ⭐

📖 **See [MODELS.md](MODELS.md) for a complete list of available models and recommendations.**

📖 **See [COMMENT_MODES.md](COMMENT_MODES.md) for detailed documentation about comment modes.**

### Docker

You can use Docker to run the application:

1. Build the Docker image:

```
docker compose build
```

2. Run the Docker container:

```
docker compose up -d
```

## Usage

1. Configure your GitLab repository to send webhook events to the AI Code Reviewer application by following [GitLab's webhook documentation](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html).

2. The AI Code Reviewer application will automatically review code changes in your GitLab repository and provide feedback as comments on merge requests and commit diffs.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Deployment

### Google Cloud Run

This project is configured for automatic deployment to Google Cloud Run via GitHub Actions.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

Quick start:

1. Set up a Google Cloud project
2. Configure GitHub secrets
3. Push to `main` or `feat/claude-ai` branch
4. Application is automatically deployed!

Deployment cost: ~$1-2/month for typical code review usage.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
