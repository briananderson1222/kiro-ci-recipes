# Docs Drift Check

Asks Kiro to flag public behavior changes that should update docs, examples, or API references.

Authority: `pull-request-comment`

Install:

```bash
./install.sh docs-drift
```

Local shift-left path:

```bash
KIRO_API_KEY=... ./scripts/run-kiro-review.sh --agent docs-drift-reviewer --review-kind "documentation drift review"
```
