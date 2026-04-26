# Test Gap Finder

Asks Kiro to identify changed behavior that lacks direct test coverage.

Authority: `pull-request-comment`

Install:

```bash
./install.sh test-gap-finder
```

Local shift-left path:

```bash
KIRO_API_KEY=... ./scripts/run-kiro-review.sh --agent test-gap-finder --review-kind "test gap review"
```
