# AI Provider Configuration Guide

This guide explains how to configure each AI provider for the GitLab code review tool.

## 📋 Table of Contents

- [Anthropic Claude](#anthropic-claude)
- [OpenAI](#openai)
- [Google Gemini](#google-gemini)
- [Switching Between Providers](#switching-between-providers)

---

## 🤖 Anthropic Claude

### Getting Started

1. **Get API Key**
   - Go to https://console.anthropic.com/
   - Create an account or sign in
   - Navigate to "API Keys"
   - Click "Create Key"
   - Copy your API key (starts with `sk-ant-`)

2. **Configure Environment**

   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-...
   AI_MODEL=claude-sonnet-4-5  # or claude-3-5-sonnet-20241022 for stable
   ```

3. **Recommended Models (2025)**
   - **Latest**: `claude-sonnet-4-5` or `claude-haiku-4-5` 🆕 (best latest)
   - **Production**: `claude-3-5-sonnet-20241022` (stable, proven)
   - **Budget**: `claude-haiku-4-5` 🆕 or `claude-3-5-haiku-20241022`
   - **Quality**: `claude-opus-4-1` 🆕 or `claude-3-opus-20240229`
   - **Reasoning**: `claude-opus-4-1` 🆕 (with thinking capabilities)

### Model Series Overview

- **Claude 4.5 Series** 🆕: Latest models (2025) - `claude-haiku-4-5`, `claude-sonnet-4-5`
- **Claude 4 Series** 🆕: Advanced reasoning - `claude-opus-4-1`, `claude-opus-4-0`, `claude-sonnet-4-0`
- **Claude 3.7 Series** 🆕: Enhanced reasoning - `claude-3-7-sonnet-latest`
- **Claude 3.5 Series**: Stable production - `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`
- **Claude 3 Series**: Legacy models

### Pricing (2025)

- **Claude 4.5/4**: Premium tier ($3-$15/million tokens)
- **Claude 3.5 Sonnet**: $3/$15 per million tokens
- **Claude 3.5 Haiku**: $1/$5 per million tokens
- **Context**: 200K tokens

### Best For

- **Claude 4.5**: Latest capabilities, best overall
- **Claude 3.5 Sonnet**: Stable production, proven reliability
- **Claude Opus**: Complex reasoning and analysis
- Code review with detailed explanations
- Security analysis

---

## 🟢 OpenAI

### Getting Started

1. **Get API Key**
   - Go to https://platform.openai.com/api-keys
   - Create an account or sign in
   - Click "Create new secret key"
   - Copy your API key (starts with `sk-`)

2. **Configure Environment**

   ```bash
   OPENAI_API_KEY=sk-...
   AI_MODEL=gpt-5  # or gpt-4o for stable production
   ```

3. **Recommended Models (2025)**
   - **Latest**: `gpt-5` or `gpt-5-pro` 🆕 (best performance)
   - **Production**: `gpt-4o` (stable, proven)
   - **Budget**: `gpt-5-mini` 🆕 or `gpt-4o-mini`
   - **Reasoning**: `o4-mini` 🆕 or `o3` 🆕 (advanced reasoning)
   - **Code**: `gpt-5-codex` 🆕 (specialized for code)

### Model Series Overview

- **GPT-5 Series** 🆕: Latest models (2025) - `gpt-5-pro`, `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-5-codex`
- **GPT-4.1 Series** 🆕: Improved efficiency - `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`
- **GPT-4o Series**: Stable production - `gpt-4o`, `gpt-4o-mini`
- **o4/o3 Series** 🆕: Advanced reasoning - `o4-mini`, `o3`, `o3-mini`
- **o1 Series**: Legacy reasoning - `o1-preview`, `o1-mini`
- **Specialized** 🆕: `codex-mini-latest`, `computer-use-preview`

### Pricing (2025)

- **GPT-5 Series**: $3.50-$5/$14-$20 per million tokens
- **GPT-4.1 Series**: $0.50-$3/$2-$12 per million tokens
- **GPT-4o**: $2.50/$10 per million tokens
- **GPT-4o-mini**: $0.15/$0.60 per million tokens
- **o4/o3**: $7-$15/$28-$60 per million tokens

### Best For

- **GPT-5**: Latest capabilities, best overall performance
- **GPT-4o**: Stable production, proven reliability
- **GPT-5-mini**: High-volume reviews with latest tech
- **o4-mini/o3**: Complex code analysis requiring deep reasoning
- **GPT-5-codex**: Code-specific tasks and generation

---

## 🌟 Google Gemini

### Getting Started

1. **Get API Key**
   - Go to https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Choose "Create API key in new project" or select existing
   - Copy your API key

2. **Configure Environment**

   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=AIza...
   AI_MODEL=gemini-2.5-flash  # or gemini-1.5-pro for stable
   ```

3. **Recommended Models (2025)**
   - **Latest**: `gemini-2.5-pro` or `gemini-2.5-flash` 🆕 (best latest)
   - **Production**: `gemini-1.5-pro` (stable, proven)
   - **Budget**: `gemini-2.5-flash` 🆕 or `gemini-1.5-flash`
   - **Ultra Budget**: `gemini-1.5-flash-8b`
   - **Image**: `gemini-2.5-flash-image-preview` 🆕 (image generation)

### Model Series Overview

- **Gemini 2.5 Series** 🆕: Latest models (2025) - thinking support, improved reasoning
- **Gemini 2.0 Series** 🆕: Enhanced capabilities
- **Gemini 1.5 Series**: Stable production models
- **Gemini 1.0 Series**: Legacy models

### Pricing (2025)

- **Gemini 2.5 Pro**: Premium tier
- **Gemini 2.5 Flash**: $0.10-$0.50 per million tokens (estimated)
- **Gemini 1.5 Pro**: $1.25/$5 per million tokens
- **Gemini 1.5 Flash**: $0.075/$0.30 per million tokens
- **Gemini 1.5 Flash 8B**: Even cheaper
- **Context**: Up to 1M+ tokens

### Best For

- **Gemini 2.5**: Latest capabilities with thinking support
- **Gemini 1.5 Pro**: Stable production, excellent reasoning
- Cost-effective code review (best price/performance)
- High-volume reviews
- Very fast responses
- Huge context windows (1M+ tokens)

---

## 🔄 Switching Between Providers

### Quick Switch

Just change the `AI_MODEL` variable - the provider is automatically detected:

```bash
# Use Claude
export AI_MODEL=claude-3-5-sonnet-20241022

# Use OpenAI
export AI_MODEL=gpt-4o

# Use Gemini
export AI_MODEL=gemini-1.5-pro
```

### Provider Detection

The code automatically detects the provider based on the model prefix:

- `claude-*` → Anthropic
- `gpt-*` or `o1-*` → OpenAI
- `gemini-*` → Google

### Required Environment Variables

| Provider  | Required Variables             |
| --------- | ------------------------------ |
| Anthropic | `ANTHROPIC_API_KEY`            |
| OpenAI    | `OPENAI_API_KEY`               |
| Google    | `GOOGLE_GENERATIVE_AI_API_KEY` |

---

## 💡 Tips & Best Practices

### Cost Optimization

1. **Start with budget models**: `gpt-4o-mini`, `gemini-1.5-flash`, `claude-3-5-haiku`
2. **Monitor usage**: Set up billing alerts
3. **Use caching**: Enable prompt caching where available
4. **Batch reviews**: Process multiple files at once

### Quality Optimization

1. **Use flagship models for critical reviews**: `claude-3-5-sonnet`, `gpt-4o`, `gemini-1.5-pro`
2. **Adjust temperature**: Lower for consistent reviews (default: 0.2)
3. **Test different providers**: Each has strengths
4. **Compare results**: Try the same review with different models

### Security

1. **Never commit API keys**: Use environment variables
2. **Rotate keys regularly**: Especially for production
3. **Use secrets management**: Google Secret Manager, cloud key vaults, etc.
4. **Limit permissions**: Use read-only keys where possible

### Troubleshooting

#### "API key not found"

- Check environment variable name matches provider
- Ensure `.env` file is in the correct location
- Restart the application after setting variables

#### "Model not found"

- Check model name spelling
- Verify model is available for your account
- Ensure the model is supported by the provider

#### "Quota exceeded"

- Check billing/usage limits
- Wait for quota reset (usually monthly)
- Upgrade plan if needed
- Switch to a different provider temporarily

#### "Invalid credentials"

- Regenerate API key
- Check for extra spaces in `.env` file
- Verify account is active

---

## 📊 Provider Comparison

| Feature                 | Claude           | OpenAI           | Gemini           |
| ----------------------- | ---------------- | ---------------- | ---------------- |
| **Ease of Setup**       | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐       |
| **Cost**                | Medium           | Low-High         | Low              |
| **Speed**               | Fast             | Fast             | Very Fast        |
| **Context Length**      | 200K             | 128K             | 1M+              |
| **Code Review Quality** | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐         |
| **Model Selection**     | **17 models** 🆕 | **33 models** 🆕 | **18 models** 🆕 |
| **Latest Technology**   | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐       |
| **2025 Models**         | Claude 4.5/4/3.7 | GPT-5/4.1/o3/o4  | Gemini 2.5/2.0   |
| **Enterprise Features** | ⭐⭐⭐           | ⭐⭐⭐           | ⭐⭐⭐           |
| **Availability**        | Global           | Global           | Global           |

### When to Use Each Provider

**Anthropic Claude** 🆕

- ✅ **17 models including latest Claude 4.5, 4.1, 3.7**
- ✅ **Latest 2025 models with reasoning capabilities**
- ✅ Detailed code explanations
- ✅ Security-focused reviews
- ✅ Long context analysis (200K)
- ✅ Consistent quality across models
- ✅ Advanced reasoning with thinking support
- ⚠️ Medium to premium pricing

**OpenAI** 🆕

- ✅ **Most model options (33 models)**
- ✅ **Latest 2025 models (GPT-5, GPT-4.1, o3, o4)**
- ✅ Fast and reliable
- ✅ Wide range from budget to premium
- ✅ Specialized models (codex, reasoning)
- ✅ Good ecosystem and documentation
- ✅ Multimodal capabilities
- ⚠️ Pricing varies widely by model tier

**Google Gemini** 🆕

- ✅ **18 models including latest Gemini 2.5, 2.0**
- ✅ **Latest 2025 models with thinking support**
- ✅ Best price/performance
- ✅ Very fast
- ✅ Huge context window (1M+ tokens)
- ✅ Good for high-volume reviews
- ✅ Implicit caching for cost savings
- ⚠️ Less mature platform than competitors
- ✅ Good for high-volume
- ❌ Newer, less mature

---

## 🔗 Additional Resources

- [AI Models Guide](./MODELS.md) - Complete model list and recommendations
- [Vercel AI SDK Docs](https://sdk.vercel.ai/) - SDK documentation
- [Anthropic API Docs](https://docs.anthropic.com/) - Claude API reference
- [OpenAI API Docs](https://platform.openai.com/docs/) - OpenAI API reference
- [Google AI Studio](https://aistudio.google.com/) - Gemini documentation
