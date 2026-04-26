# Security Gate

Runs Kiro in strict mode and fails when normalized critical findings exist.

Authority: `read-only-blocking`

Install:

```bash
./install.sh security-gate
```

Local shift-left path:

```bash
KIRO_API_KEY=... ./scripts/run-kiro-review.sh --agent security-reviewer --review-kind "security review" --strict --output-json review-findings.json --output-markdown review-output.md
node scripts/fail-on-critical.mjs review-findings.json
```
