# Advisory PR Review

Posts normalized Kiro findings as a pull request review.

Authority: `pull-request-comment`

Install:

```bash
./install.sh pr-review
```

Local shift-left path after install:

```bash
export KIRO_API_KEY=...
./scripts/run-local-review.sh
```

Design notes:

- Emit structured `REVIEW_DATA` so follow-up recipes can promote or fix a numbered finding.
- Prefer current-run artifacts over stale bot comments when deciding whether review succeeded.
- Keep review tools read-only. Branch-writing remediation belongs in `auto-fix-branch`.
