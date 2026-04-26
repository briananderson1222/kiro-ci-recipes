---
name: review-criteria
description: Shared review definitions for Kiro CI recipes: severity, confidence, required finding fields, and discard rules.
---

# Review Criteria

## Severity

Severity measures impact.

| Severity | Meaning | Examples |
| --- | --- | --- |
| CRITICAL | Security vulnerability, data loss, auth bypass, secret exposure | injection, hardcoded secrets, path traversal, missing auth check |
| HIGH | Bug or risk likely to break functionality or CI safety | logic error, unsafe permission, resource leak, unsafe workflow execution |
| MEDIUM | Correctness, maintainability, or coverage concern | missing validation, missing tests, stale docs, confusing behavior |
| LOW | Minor convention or cleanup concern | naming, formatting, small readability issue |

## Confidence

Confidence measures certainty.

| Confidence | Meaning |
| --- | --- |
| high | Confirmed or very likely real, with exact evidence. |
| medium | Plausible and actionable, but context-dependent. |
| low | Worth noting, but likely non-blocking or uncertain. |

## Required Finding Fields

Every actionable finding must include:

```json
{
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "confidence": "high | medium | low",
  "file": "path/to/file",
  "line": 1,
  "description": "short actionable description",
  "source": "kiro"
}
```

Use the source required by the active recipe, for example `kiro`, `kiro-security`, `kiro-test-gap`, or `kiro-docs-drift`.

## Discard Rules

Discard findings that are:

- pre-existing and unrelated to the reviewed diff;
- already guaranteed by normal lint/type/test tooling unless the workflow itself is testing that tooling gap;
- vague quality opinions without an actionable file and line;
- based on PR-controlled assumptions when trusted/base checkout evidence proves otherwise;
- unrelated to the active review kind.
