# AI Models Guide

## Supported AI Providers

This application supports **68 AI models** across **3 providers** through the [Vercel AI SDK](https://sdk.vercel.ai):

- **Anthropic (Claude)**: 17 models (including latest Claude 4.5, 4.1, 3.7 series 🆕)
- **OpenAI (GPT)**: 33 models (including latest GPT-5, GPT-4.1, o3, o4 series 🆕)
- **Google (Gemini)**: 18 models (including latest Gemini 2.5, 2.0 series 🆕)

## Configuration

Set your AI model in the `AI_MODEL` environment variable. The provider is automatically detected based on the model name.

```bash
# For Claude
AI_MODEL=claude-3-5-sonnet-20241022

# For OpenAI
AI_MODEL=gpt-4o
```

---

## 🤖 Claude Models (Anthropic)

### 🆕 Latest: Claude 4.5 Series (2025)

```bash
AI_MODEL=claude-sonnet-4-5
```

- **Best for**: Latest Anthropic capabilities
- **Strengths**: Most advanced reasoning, improved efficiency
- **Cost**: Premium
- **Speed**: Fast
- **Status**: Latest generation (2025)

### Recommended: Claude 3.5 Sonnet (Stable)

```bash
AI_MODEL=claude-3-5-sonnet-20241022
```

- **Best for**: Production code reviews
- **Strengths**: Excellent reasoning, balanced cost/performance
- **Cost**: Moderate
- **Speed**: Fast

### Budget Option: Claude 3.5 Haiku

```bash
AI_MODEL=claude-3-5-haiku-20241022
```

- **Best for**: High-volume reviews, simple changes
- **Strengths**: Very fast, very cheap
- **Cost**: Low
- **Speed**: Very fast

### All Claude Models

| Model                        | Version | Use Case           | Speed     | Cost |
| ---------------------------- | ------- | ------------------ | --------- | ---- |
| `claude-haiku-4-5`           | 4.5 🆕  | Latest Haiku       | Very Fast | $    |
| `claude-sonnet-4-5`          | 4.5 🆕  | **Latest Sonnet**  | Fast      | $$$  |
| `claude-sonnet-4-5-20250929` | 4.5 🆕  | Dated Sonnet 4.5   | Fast      | $$$  |
| `claude-opus-4-1`            | 4.1 🆕  | Advanced reasoning | Slow      | $$$$ |
| `claude-opus-4-0`            | 4.0 🆕  | Advanced reasoning | Slow      | $$$$ |
| `claude-sonnet-4-0`          | 4.0 🆕  | Standard           | Fast      | $$$  |
| `claude-sonnet-4-20250514`   | 4.0 🆕  | Dated Sonnet 4     | Fast      | $$$  |
| `claude-3-7-sonnet-latest`   | 3.7 🆕  | Latest 3.7 alias   | Fast      | $$$  |
| `claude-3-7-sonnet-20250219` | 3.7 🆕  | Dated 3.7          | Fast      | $$$  |
| `claude-3-5-sonnet-20241022` | 3.5     | **Recommended**    | Fast      | $$   |
| `claude-3-5-sonnet-20240620` | 3.5     | Legacy             | Fast      | $$   |
| `claude-3-5-haiku-20241022`  | 3.5     | Budget             | Very Fast | $    |
| `claude-3-5-haiku-latest`    | 3.5     | Latest Haiku alias | Very Fast | $    |
| `claude-3-opus-20240229`     | 3.0     | Complex analysis   | Slow      | $$$  |
| `claude-3-sonnet-20240229`   | 3.0     | Legacy             | Medium    | $$   |
| `claude-3-haiku-20240307`    | 3.0     | Legacy budget      | Fast      | $    |

> 🆕 **2025 Models**: Claude 4.5, 4.1, 4.0, and 3.7 series represent the latest advancements from Anthropic with improved reasoning, efficiency, and specialized capabilities.

---

## 🤖 OpenAI Models (GPT)

### 🆕 Recommended: GPT-5 (Latest 2025)

```bash
AI_MODEL=gpt-5
```

- **Best for**: Latest capabilities, most advanced reasoning
- **Strengths**: State-of-the-art performance, multimodal
- **Cost**: Premium
- **Speed**: Fast
- **Status**: Latest generation (2025)

### 🆕 Budget Option: GPT-5 Mini

```bash
AI_MODEL=gpt-5-mini
```

- **Best for**: Cost-effective latest generation
- **Strengths**: Latest tech, good performance, affordable
- **Cost**: Moderate
- **Speed**: Very fast

### Stable Production: GPT-4o

```bash
AI_MODEL=gpt-4o
```

- **Best for**: Stable production code reviews
- **Strengths**: Proven reliability, multimodal
- **Cost**: Moderate
- **Speed**: Fast

### Budget Option: GPT-4o Mini

```bash
AI_MODEL=gpt-4o-mini
```

- **Best for**: High-volume reviews, simple changes
- **Strengths**: Fast, affordable, reliable
- **Cost**: Low
- **Speed**: Very fast

### 🆕 Reasoning: o4-mini (Latest)

```bash
AI_MODEL=o4-mini
```

- **Best for**: Complex logic, reasoning tasks
- **Strengths**: Latest reasoning model, cost-effective
- **Cost**: Moderate
- **Speed**: Medium

### Reasoning: o3

```bash
AI_MODEL=o3
```

- **Best for**: Advanced reasoning, complex analysis
- **Strengths**: Deep reasoning capabilities
- **Cost**: High
- **Speed**: Slower

### All OpenAI Models

| Model                  | Version    | Use Case              | Speed     | Cost |
| ---------------------- | ---------- | --------------------- | --------- | ---- |
| `gpt-5-pro`            | 5.0 🆕     | Most capable          | Fast      | $$$$ |
| `gpt-5`                | 5.0 🆕     | **Latest Standard**   | Fast      | $$$  |
| `gpt-5-mini`           | 5.0 🆕     | Latest Budget         | Very Fast | $$   |
| `gpt-5-nano`           | 5.0 🆕     | Ultra Budget          | Very Fast | $    |
| `gpt-5-codex`          | 5.0 🆕     | Code specialized      | Fast      | $$$  |
| `gpt-5-chat-latest`    | 5.0 🆕     | Latest Chat           | Fast      | $$$  |
| `gpt-4.1`              | 4.1 🆕     | Standard              | Fast      | $$$  |
| `gpt-4.1-mini`         | 4.1 🆕     | Budget                | Very Fast | $$   |
| `gpt-4.1-nano`         | 4.1 🆕     | Ultra Budget          | Very Fast | $    |
| `gpt-4o`               | 4.0        | **Stable Production** | Fast      | $$   |
| `gpt-4o-2024-11-20`    | 4.0        | Latest GPT-4o         | Fast      | $$   |
| `gpt-4o-mini`          | 4.0        | Budget                | Very Fast | $    |
| `gpt-4-turbo`          | 4.0        | Legacy                | Medium    | $$$  |
| `gpt-4`                | 4.0        | Base GPT-4            | Slow      | $$$  |
| `o4-mini`              | o4 🆕      | Latest Reasoning      | Medium    | $$$  |
| `o3`                   | o3 🆕      | Advanced Reasoning    | Slow      | $$$$ |
| `o3-mini`              | o3 🆕      | Reasoning Budget      | Medium    | $$$  |
| `o1-preview`           | o1         | Reasoning (legacy)    | Slow      | $$$$ |
| `o1-mini`              | o1         | Reasoning Mini        | Medium    | $$$  |
| `codex-mini-latest`    | Codex 🆕   | Code interpreter      | Fast      | $$   |
| `computer-use-preview` | Special 🆕 | Computer use          | Medium    | TBD  |

> 🆕 **2025 Models**: GPT-5, GPT-4.1, o4, and o3 series are the latest additions to OpenAI's model lineup.

---

## 💡 Recommendations

### For Latest & Best Performance (2025)

- **OpenAI**: `gpt-5` or `gpt-5-pro` 🆕 ✅
- **Claude**: `claude-sonnet-4-5` 🆕 ✅
- **Gemini**: `gemini-2.5-pro` 🆕 ✅
- **OpenAI Reasoning**: `o4-mini` 🆕 ✅

### For Stable Production

- **OpenAI**: `gpt-4o` ✅
- **Claude**: `claude-3-5-sonnet-20241022` ✅
- **Gemini**: `gemini-1.5-pro` ✅

### For High Volume / Budget (Latest Tech)

- **OpenAI**: `gpt-5-mini` 🆕 or `gpt-4o-mini`
- **Claude**: `claude-haiku-4-5` 🆕 or `claude-3-5-haiku-20241022`
- **Gemini**: `gemini-2.5-flash` 🆕 or `gemini-1.5-flash`

### For Complex Reasoning

- **OpenAI**: `o3` 🆕 (most advanced reasoning)
- **OpenAI**: `o4-mini` 🆕 (fast reasoning)
- **Claude**: `claude-opus-4-1` 🆕 or `claude-3-opus-20240229`

### For Code-Specific Tasks

- **OpenAI**: `gpt-5-codex` 🆕 (specialized for code)
- **OpenAI**: `codex-mini-latest` 🆕 (code interpreter)
- **Claude**: `claude-sonnet-4-5` 🆕 (excellent code understanding)

---

## 🌟 Google Gemini Models

Google's Gemini models via the Vercel AI SDK.

### Configuration

```bash
GOOGLE_GENERATIVE_AI_API_KEY=<your-google-api-key>
AI_MODEL=gemini-2.5-flash  # Latest (2025)
```

### 🆕 Latest: Gemini 2.5 Series (2025)

```bash
AI_MODEL=gemini-2.5-pro
```

- **Best for**: Latest Google capabilities, advanced reasoning
- **Strengths**: Thinking process, improved reasoning, multimodal
- **Cost**: Premium
- **Speed**: Fast
- **Features**: Native thinking support, implicit caching

### 🆕 Budget Latest: Gemini 2.5 Flash

```bash
AI_MODEL=gemini-2.5-flash
```

- **Best for**: Latest generation at lower cost
- **Strengths**: Very fast, good performance, thinking support
- **Cost**: Low
- **Speed**: Very Fast

### Recommended: Gemini 1.5 Pro (Stable)

```bash
AI_MODEL=gemini-1.5-pro
```

- **Best for**: Stable production, complex reasoning
- **Strengths**: Excellent context understanding, multimodal
- **Cost**: Moderate
- **Speed**: Fast

### Budget Option: Gemini 1.5 Flash

```bash
AI_MODEL=gemini-1.5-flash
```

- **Best for**: High-volume reviews, quick analysis
- **Strengths**: Very fast, affordable
- **Cost**: Low
- **Speed**: Very fast

### All Gemini Models

| Model                                 | Version | Use Case          | Speed     | Cost |
| ------------------------------------- | ------- | ----------------- | --------- | ---- |
| `gemini-2.5-pro`                      | 2.5 🆕  | **Latest Pro**    | Fast      | $$$  |
| `gemini-2.5-flash`                    | 2.5 🆕  | **Latest Flash**  | Very Fast | $$   |
| `gemini-2.5-flash-lite`               | 2.5 🆕  | Lightweight       | Very Fast | $    |
| `gemini-2.5-flash-lite-preview-06-17` | 2.5 🆕  | Lite preview      | Very Fast | $    |
| `gemini-2.5-flash-image-preview`      | 2.5 🆕  | Image generation  | Fast      | $$$  |
| `gemini-2.0-flash`                    | 2.0 🆕  | Standard 2.0      | Very Fast | $$   |
| `gemini-2.0-flash-exp`                | 2.0 🆕  | Experimental      | Very Fast | TBD  |
| `gemini-1.5-pro`                      | 1.5     | **Recommended**   | Fast      | $$   |
| `gemini-1.5-pro-002`                  | 1.5     | Specific version  | Fast      | $$   |
| `gemini-1.5-pro-latest`               | 1.5     | Latest alias      | Fast      | $$   |
| `gemini-1.5-flash`                    | 1.5     | Budget            | Very Fast | $    |
| `gemini-1.5-flash-002`                | 1.5     | Budget (specific) | Very Fast | $    |
| `gemini-1.5-flash-latest`             | 1.5     | Latest alias      | Very Fast | $    |
| `gemini-1.5-flash-8b`                 | 1.5     | Ultra budget      | Very Fast | $    |
| `gemini-1.5-flash-8b-latest`          | 1.5     | Latest 8B alias   | Very Fast | $    |
| `gemini-1.0-pro`                      | 1.0     | Legacy            | Medium    | $$   |

> 🆕 **2025 Models**: Gemini 2.5 and 2.0 series feature thinking capabilities, improved reasoning, and better efficiency. The 2.5 series includes specialized models like image generation.

---

## �🔑 API Keys

### Anthropic (Claude)

1. Get API key: https://console.anthropic.com/
2. Set: `ANTHROPIC_API_KEY=sk-ant-...`

### OpenAI (GPT)

1. Get API key: https://platform.openai.com/api-keys
2. Set: `OPENAI_API_KEY=sk-...`

### Google Gemini

1. Get API key: https://aistudio.google.com/app/apikey
2. Set: `GOOGLE_GENERATIVE_AI_API_KEY=<your-key>`

---

## 🔄 Switching Providers

Just change the `AI_MODEL` variable - the provider is auto-detected:

```bash
# Anthropic Claude
AI_MODEL=claude-3-5-sonnet-20241022

# OpenAI
AI_MODEL=gpt-4o

# Google Gemini
AI_MODEL=gemini-1.5-pro
```

The code automatically uses the correct API based on the model prefix:

- `claude-*` → Anthropic
- `gpt-*` or `o1-*` → OpenAI
- `gemini-*` → Google

---

## 📊 Cost Comparison

Approximate costs per 1M tokens (as of Jan 2025):

### Budget Tier ($0.15 - $0.50)

| Model            | Provider | Input  | Output | Total (avg) |
| ---------------- | -------- | ------ | ------ | ----------- |
| gemini-1.5-flash | Google   | $0.075 | $0.30  | ~$0.19      |
| gpt-4.1-nano 🆕  | OpenAI   | $0.10  | $0.40  | ~$0.25      |
| gpt-4o-mini      | OpenAI   | $0.15  | $0.60  | ~$0.40      |
| gpt-5-nano 🆕    | OpenAI   | $0.15  | $0.60  | ~$0.40      |

### Standard Tier ($0.50 - $3.00)

| Model            | Provider  | Input | Output | Total (avg) |
| ---------------- | --------- | ----- | ------ | ----------- |
| gpt-4.1-mini 🆕  | OpenAI    | $0.50 | $2.00  | ~$1.25      |
| gpt-5-mini 🆕    | OpenAI    | $0.60 | $2.40  | ~$1.50      |
| claude-3-5-haiku | Anthropic | $1    | $5     | ~$3         |

### Premium Tier ($3.00 - $15.00)

| Model             | Provider  | Input | Output | Total (avg) |
| ----------------- | --------- | ----- | ------ | ----------- |
| gpt-4o            | OpenAI    | $2.50 | $10    | ~$6.25      |
| gpt-4.1 🆕        | OpenAI    | $3    | $12    | ~$7.50      |
| gpt-5 🆕          | OpenAI    | $3.50 | $14    | ~$8.75      |
| gemini-1.5-pro    | Google    | $3.50 | $10.50 | ~$7         |
| claude-3-5-sonnet | Anthropic | $3    | $15    | ~$9         |

### Advanced Tier ($10.00+)

| Model         | Provider  | Input | Output | Total (avg) |
| ------------- | --------- | ----- | ------ | ----------- |
| gpt-5-pro 🆕  | OpenAI    | $5    | $20    | ~$12.50     |
| o4-mini 🆕    | OpenAI    | $7    | $28    | ~$17.50     |
| gpt-4-turbo   | OpenAI    | $10   | $30    | ~$20        |
| o3-mini 🆕    | OpenAI    | $10   | $40    | ~$25        |
| claude-3-opus | Anthropic | $15   | $75    | ~$45        |
| o3 🆕         | OpenAI    | $15   | $60    | ~$37.50     |

### Specialized Models

| Model                   | Provider | Use Case         | Pricing       |
| ----------------------- | -------- | ---------------- | ------------- |
| gpt-5-codex 🆕          | OpenAI   | Code generation  | Premium tier  |
| codex-mini-latest 🆕    | OpenAI   | Code interpreter | Standard tier |
| computer-use-preview 🆕 | OpenAI   | Computer control | TBD           |

---

## 💰 Value Recommendations

**Best Budget Value** (< $0.50/1M tokens):

- `gemini-1.5-flash` - Cheapest overall
- `gpt-4.1-nano` 🆕 - Ultra-budget OpenAI option
- `gpt-5-nano` 🆕 - Latest budget model

**Best Balance** (Quality/Price):

- `gpt-5` 🆕 - Latest capabilities at premium pricing
- `gpt-4o` - Stable production with proven reliability
- `gemini-1.5-pro` - Excellent quality, moderate cost
- `claude-3-5-sonnet` - High quality reasoning

**Best Quality** (Premium):

- `gpt-5-pro` 🆕 - Top-tier performance
- `o3` 🆕 - Most advanced reasoning
- `claude-3-opus` - Exceptional analysis

**Best for Code**:

- `gpt-5-codex` 🆕 - Specialized code model
- `gpt-5` � - Latest general capabilities
- `claude-3-5-sonnet` - Strong code understanding
