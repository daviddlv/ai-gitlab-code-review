# Architecture des modes de commentaires

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitLab Webhook                            │
│                 (merge_request.open/update/reopen)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    hookHandlers.ts                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Fetch branch diff (Compare API)                         │ │
│  │ 2. Extract commit SHAs (baseSha, headSha, startSha)        │ │
│  │ 3. Fetch old files (Files API)                             │ │
│  │ 4. Build prompt with COMMENT_MODE                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      prompt/index.ts                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ buildPrompt({ changes, oldFiles, commentMode })            │ │
│  │                                                            │ │
│  │ Mode instructions:                                         │ │
│  │  - global: Standard review                                │ │
│  │  - inline: "Use format: In `file` line X: comment"       │ │
│  │  - hybrid: "Provide both inline + summary"                │ │
│  │  - structured: "Return JSON {summary, inline_comments}"   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     services.ts                                  │
│                 generateAICompletion()                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Call AI provider (Claude/OpenAI/Gemini)                    │ │
│  │ Return: { text: "AI response..." }                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   postAIReview.ts                                │
│              Switch on COMMENT_MODE                              │
└─────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┬───────────────┐
        │                    │                    │               │
        ▼                    ▼                    ▼               ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐    ┌──────────┐
   │ global  │         │ inline  │         │ hybrid  │    │structured│
   └────┬────┘         └────┬────┘         └────┬────┘    └────┬─────┘
        │                   │                   │              │
        ▼                   ▼                   ▼              ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐  ┌────────────┐
│postAIComment │   │parseInline   │   │parseInline   │  │parseStruct │
│(Notes API)   │   │Comments()    │   │Comments()    │  │uredResp()  │
│              │   │              │   │              │  │            │
│POST /notes   │   │Pattern match:│   │Extract:      │  │Parse JSON: │
│{body}        │   │ - `file:42:` │   │ - inline     │  │{summary,   │
│              │   │ - In `file`  │   │ - summary    │  │ inline_... }│
└──────────────┘   └──────┬───────┘   └──────┬───────┘  └──────┬─────┘
                          │                   │                 │
                          ▼                   ▼                 ▼
                   ┌────────────────────────────────────────────────┐
                   │     postInlineComments()                       │
                   │     (Discussions API)                          │
                   │                                                │
                   │  For each comment:                             │
                   │    POST /discussions                           │
                   │    {                                           │
                   │      body: "comment",                          │
                   │      position: {                               │
                   │        base_sha, head_sha, start_sha,          │
                   │        new_path, new_line                      │
                   │      }                                         │
                   │    }                                           │
                   └────────────────────────────────────────────────┘
                                         │
                                         ▼
                             ┌─────────────────────┐
                             │  postAIComment()    │
                             │  (Notes API)        │
                             │                     │
                             │  POST /notes        │
                             │  {body: "summary"}  │
                             │                     │
                             │  (hybrid/structured │
                             │   only)             │
                             └─────────────────────┘
```

## Flux de données par mode

### Mode `global` (défaut)

```
AI Response (full text)
    │
    ▼
buildAnswer(text)
    │
    ▼
postAIComment(body: full review)
    │
    ▼
✅ 1 commentaire global sur la MR
```

### Mode `inline`

```
AI Response ("In `file.ts` line 42: comment")
    │
    ▼
parseInlineComments(text)
    │
    ▼
[
  { file: "file.ts", line: 42, comment: "..." },
  { file: "api.ts", line: 89, comment: "..." }
]
    │
    ▼
postInlineComments(comments, baseSha, headSha, startSha)
    │
    ▼
✅ N commentaires inline (discussions)
❌ Pas de commentaire global
```

### Mode `hybrid`

```
AI Response (mixed: summary + inline comments)
    │
    ▼
parseInlineComments(text)
    │
    ▼
{
  summary: "General observations...",
  inlineComments: [
    { file: "file.ts", line: 42, comment: "..." }
  ]
}
    │
    ├─────────────────┬─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
postInline       postAIComment    (parallel)
Comments()       (summary)
    │                 │
    ▼                 ▼
✅ N commentaires inline
✅ 1 commentaire global (résumé)
```

### Mode `structured`

```
AI Response (JSON)
{
  "summary": "...",
  "inline_comments": [...]
}
    │
    ▼
parseStructuredResponse(text)
    │ (extract JSON from markdown block)
    ▼
{
  summary: "...",
  inlineComments: [...]
}
    │
    ├─────────────────┬─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
postInline       postAIComment    (parallel)
Comments()       (summary)
    │                 │
    ▼                 ▼
✅ N commentaires inline
✅ 1 commentaire global (résumé JSON)
```

## Fallbacks et gestion d'erreurs

```
┌──────────────────────────────────────────┐
│ postInlineComments()                     │
│                                          │
│ Si baseSha/headSha/startSha manquants:  │
│   → Log warning                          │
│   → Return early                         │
│   → Caller fallback to global comment   │
│                                          │
│ Si API error (400/422):                  │
│   → Log error with HTTP status + body    │
│   → Continue with other comments         │
│   → Return first error at end            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ parseStructuredResponse()                │
│                                          │
│ Si JSON invalide:                        │
│   → Log error                            │
│   → Fallback to parseInlineComments()    │
│   → Extract via regex patterns           │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ parseInlineComments()                    │
│                                          │
│ Si aucun pattern trouvé:                 │
│   → Return { summary: full text,         │
│              inlineComments: [] }        │
│   → Caller posts as global comment       │
└──────────────────────────────────────────┘
```

## Variables d'environnement

```
COMMENT_MODE=global|inline|hybrid|structured
     │
     ▼
┌────────────────────────────────────────┐
│ hookHandlers.ts                        │
│   → Read COMMENT_MODE                  │
│   → Pass to buildPrompt(commentMode)   │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ prompt/index.ts                        │
│   → Add mode-specific instructions     │
│   → Return adapted prompt              │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ postAIReview.ts                        │
│   → Read COMMENT_MODE again            │
│   → Switch on mode                     │
│   → Call appropriate functions         │
└────────────────────────────────────────┘
```

## Commits SHAs (requis pour inline comments)

```
GitLab Webhook Payload
{
  object_attributes: {
    last_commit: {
      id: "def456..." ← headSha
    }
  }
}
     │
     ▼
Compare API Response
{
  commit: {
    id: "def456...", ← headSha (fallback)
    parent_ids: ["abc123..."] ← baseSha
  }
}
     │
     ▼
WebhookHandlerResult
{
  baseSha: "abc123...",
  headSha: "def456...",
  startSha: "abc123..." (= baseSha)
}
     │
     ▼
InlineCommentPosition
{
  base_sha: "abc123...",
  head_sha: "def456...",
  start_sha: "abc123...",
  new_path: "src/file.ts",
  new_line: 42
}
```

## Logs et debugging

```
┌──────────────────────────────────────────┐
│ Console logs (debug)                     │
│   → Request details before API call      │
│   → Parsing results                      │
│   → SHA extraction                       │
└──────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ Fastify logger (Pino)                    │
│   → Structured logs with { err }         │
│   → GCP severity levels                  │
│   → HTTP status codes in errors          │
└──────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ GCP Cloud Logging                        │
│   → Filter by severity=ERROR             │
│   → View stack traces                    │
│   → Search by MR IID                     │
└──────────────────────────────────────────┘
```
