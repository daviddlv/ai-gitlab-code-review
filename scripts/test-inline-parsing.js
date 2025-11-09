#!/usr/bin/env node

/**
 * Test script for inline comment parsing
 * Usage: node scripts/test-inline-parsing.js
 */

// Simulated AI responses for testing different modes
const testResponses = {
  inline: `
In \`src/auth/middleware.ts\` line 42: Missing null check before accessing user.role

In \`src/api/routes.ts\` line 89: Race condition possible if token expires during request

In \`src/auth/login.ts\` line 23: Security issue - password is logged in plain text
`,

  hybrid: `
# Code Review Summary

Overall, good implementation but some issues need attention.

In \`src/auth/middleware.ts\` line 42: Missing null check before accessing user.role

In \`src/api/routes.ts\` line 89: Race condition possible if token expires during request

## Recommendations
- Add integration tests
- Document the JWT structure
`,

  structured: `
\`\`\`json
{
  "summary": "Overall good implementation",
  "inline_comments": [
    {
      "file": "src/auth/middleware.ts",
      "line": 42,
      "comment": "Missing null check"
    },
    {
      "file": "src/api/routes.ts",
      "line": 89,
      "comment": "Race condition possible"
    }
  ]
}
\`\`\`
`,
};

// Simple test function (mimics the parsing logic)
function parseInlineComments(text) {
  const patterns = [
    /In\s+\`([^\`]+)\`\s+(?:line\s+)?(\d+):\s*(.+)/i,
    /\`?([^\`:]+\.\w+):(\d+)\`?:\s*(.+)/,
    /-\s*\`([^\`:]+):(\d+)\`\s*-\s*(.+)/,
  ];

  const comments = [];
  const lines = text.split("\n");

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, file, lineNum, comment] = match;
        if (file && lineNum && comment) {
          comments.push({
            file: file.trim(),
            line: parseInt(lineNum, 10),
            comment: comment.trim(),
          });
          break;
        }
      }
    }
  }

  return comments;
}

function parseStructuredResponse(text) {
  try {
    const jsonMatch =
      text.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`/) ||
      text.match(/\`\`\`\s*([\s\S]*?)\s*\`\`\`/);

    const jsonText = jsonMatch?.[1] ?? text;
    const parsed = JSON.parse(jsonText);

    return {
      summary: parsed.summary || "",
      inlineComments: parsed.inline_comments || [],
    };
  } catch (error) {
    console.error("Failed to parse structured response:", error.message);
    return { summary: "", inlineComments: [] };
  }
}

// Run tests
console.log("🧪 Testing inline comment parsing...\n");

console.log("📍 Test 1: Inline mode");
const inlineResult = parseInlineComments(testResponses.inline);
console.log(`Found ${inlineResult.length} inline comments:`);
inlineResult.forEach((c) =>
  console.log(`  - ${c.file}:${c.line} - ${c.comment}`),
);
console.log();

console.log("🎯 Test 2: Hybrid mode");
const hybridResult = parseInlineComments(testResponses.hybrid);
console.log(`Found ${hybridResult.length} inline comments:`);
hybridResult.forEach((c) =>
  console.log(`  - ${c.file}:${c.line} - ${c.comment}`),
);
console.log();

console.log("📊 Test 3: Structured mode");
const structuredResult = parseStructuredResponse(testResponses.structured);
console.log(`Summary: ${structuredResult.summary}`);
console.log(`Found ${structuredResult.inlineComments.length} inline comments:`);
structuredResult.inlineComments.forEach((c) =>
  console.log(`  - ${c.file}:${c.line} - ${c.comment}`),
);
console.log();

// Validation
const allTestsPassed =
  inlineResult.length === 3 &&
  hybridResult.length === 2 &&
  structuredResult.inlineComments.length === 2;

if (allTestsPassed) {
  console.log("✅ All parsing tests passed!");
} else {
  console.log("❌ Some tests failed");
  process.exit(1);
}
