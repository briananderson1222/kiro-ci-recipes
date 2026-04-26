# Kiro CI Recipes

Installable examples for using Kiro CLI headless mode in CI/CD and local shift-left workflows.

The goal is not one monolithic workflow. Each use case is a small pack you can copy into another repo without taking the whole catalog.

```bash
./install.sh --target /path/to/your/repo pr-review security-gate test-gap-finder
```

Headless Kiro requires `KIRO_API_KEY` in the environment. In GitHub Actions, store it as a repository secret named `KIRO_API_KEY`.

The sample app in `src/` is intentionally flawed so the workflows have concrete review material.

## Catalog

| Use case | Authority | What it does | Install |
| --- | --- | --- | --- |
| Advisory PR Review | `pull-request-comment` | Posts normalized Kiro findings as a PR review. | `./install.sh --target /path/to/repo pr-review` |
| Security Gate | `read-only-blocking` | Fails CI on normalized critical security findings. | `./install.sh --target /path/to/repo security-gate` |
| Test Gap Finder | `pull-request-comment` | Finds changed behavior without direct test coverage. | `./install.sh --target /path/to/repo test-gap-finder` |
| Docs Drift Check | `pull-request-comment` | Flags behavior changes that should update docs. | `./install.sh --target /path/to/repo docs-drift` |
| Manual Artifact Review | `read-only-artifact` | Uploads markdown/JSON review artifacts without PR comments. | `./install.sh --target /path/to/repo artifact-review` |
| Issue Promotion | `issue-write` | Converts `/open-issue <n>` into a tracked issue. | `./install.sh --target /path/to/repo issue-promotion` |
| Auto-Fix Branch | `branch-write` | Creates an opt-in fix branch for `/kiro-fix <n>`. | `./install.sh --target /path/to/repo auto-fix-branch` |

List packs:

```bash
npm run catalog:list
```

Preview installation:

```bash
./install.sh --target ../some-repo --dry-run pr-review security-gate
```

If you intentionally run `./install.sh` without `--target`, it installs into the current working directory. Use `--target` when applying recipes from this catalog clone into another repo.

## Local Usage

Most packs have a local equivalent so teams can shift left before CI:

```bash
export KIRO_API_KEY=...
./scripts/run-local-review.sh
```

Specialized local examples:

```bash
./scripts/run-kiro-review.sh --agent test-gap-finder --review-kind "test gap review"
./scripts/run-kiro-review.sh --agent docs-drift-reviewer --review-kind "documentation drift review"
./scripts/run-kiro-review.sh --agent security-reviewer --review-kind "security review" --strict
node scripts/fail-on-critical.mjs review-findings.json
```

Validate the Kiro agent configs:

```bash
kiro-cli agent validate --path .kiro/agents/code-reviewer.json
kiro-cli agent validate --path .kiro/agents/security-reviewer.json
kiro-cli agent validate --path .kiro/agents/test-gap-finder.json
kiro-cli agent validate --path .kiro/agents/docs-drift-reviewer.json
kiro-cli agent validate --path .kiro/agents/fix-branch-writer.json
```

Run the sample app tests:

```bash
npm test
```

## Expected Review Output Contract

Kiro is prompted to include one HTML comment with JSON:

```html
<!-- REVIEW_DATA: [{"severity":"HIGH","confidence":"medium","file":"src/app.js","line":10,"description":"Example finding","source":"kiro"}] -->
```

`scripts/normalize-review-output.mjs` accepts that legacy array shape, validates it, and emits a canonical normalized object:

```json
{
  "findings": [
    {
      "severity": "HIGH",
      "confidence": "medium",
      "file": "src/app.js",
      "line": 10,
      "description": "Example finding",
      "source": "kiro"
    }
  ],
  "counts": { "total": 1, "critical": 0, "high": 1, "medium": 0, "low": 0 },
  "warnings": [],
  "source": { "rawMarkdownPath": "review-output.md", "normalizedAt": "...", "strict": false }
}
```

The visible markdown can be human-friendly, but the embedded normalized JSON powers automation:

- `scripts/post-pr-review.sh` posts a PR review/comment with that payload.
- `scripts/fail-on-critical.mjs` turns normalized critical security findings into a failing CI gate.
- `scripts/select-review-finding.mjs` selects a numbered normalized finding for issue creation.
- `open-issue-from-review.yml` converts a numbered finding into a GitHub issue without reparsing raw model markdown.

Strict mode is workflow-specific:

| Workflow | Strict? | Behavior |
| --- | --- | --- |
| PR advisory review | no | Missing or malformed `REVIEW_DATA` posts an empty normalized payload with warnings. |
| Security gate | yes | Missing or malformed `REVIEW_DATA` fails before severity policy runs. |
| Artifact review | configurable | Defaults to permissive for experimentation. |

## CI Setup

1. Add `KIRO_API_KEY` under repository Settings -> Secrets and variables -> Actions.
2. Install one or more use cases with `./install.sh`.
3. Open a pull request that changes code.
4. The installed workflows run according to their authority tier.
5. Comment `/open-issue 1` to promote a finding, or `/kiro-fix 1` if you intentionally installed the branch-writing workflow.

## Permissions and Trust Boundaries

Review workflows use read-only Kiro tools with `--trust-tools=read,grep`. They do not edit code.

| Workflow | GitHub permissions | Reason |
| --- | --- | --- |
| `kiro-pr-review.yml` | `contents: read`, `pull-requests: write` | Read code and post an advisory PR review. Runs Kiro action/scripts and agent config from the trusted base checkout while reviewing PR code in a separate workspace. |
| `kiro-security-gate.yml` | `contents: read` | Read code, upload artifacts, and fail locally on normalized critical findings. |
| `kiro-test-gap-finder.yml` | `contents: read`, `pull-requests: write` | Read changed code/tests and post advisory test coverage findings. |
| `kiro-docs-drift.yml` | `contents: read`, `pull-requests: write` | Read changed code/docs and post advisory documentation drift findings. |
| `kiro-artifact-review.yml` | `contents: read` | Manual read-only experiment that uploads artifacts. |
| `open-issue-from-review.yml` | `contents: read`, `issues: write`, `pull-requests: write` | Check out trusted scripts, read PR review data, create an issue, and acknowledge the command on the PR. |
| `kiro-auto-fix-branch.yml` | `contents: write`, `pull-requests: write` | Opt-in higher-authority workflow that checks commenter permission, selects an earlier structured finding, creates a standalone branch, and opens a fix PR. |

Forked PRs and Dependabot runs may not receive `KIRO_API_KEY` or write-capable tokens. Treat those as repository policy decisions: skip Kiro review, use the manual artifact workflow after maintainer review, or run from a trusted branch.

The demo workflows use Kiro's official installer for readability and print `kiro-cli --version` before review execution. Production pipelines should pin or verify the CLI installer, or install Kiro from an approved package source.

## Design Lessons

This catalog keeps reusable AI-in-CI patterns while making risky workflow behaviors explicit guardrails.

Patterns worth reusing:

- Put long review behavior in prompt files or shared skills when the agent JSON becomes hard to audit.
- Keep severity, confidence, review-pass definitions, and discard rules in one shared review rubric.
- Prefer formal `gh pr review` output for PR review workflows when teams want GitHub-native approve/comment/request-changes semantics.
- Embed structured `REVIEW_DATA` in review bodies so follow-up automations can select findings without scraping prose.
- Offer configurable gates such as `fail`, `warn`, and `info` so teams can adopt workflows gradually.
- Add proactive `workflow_dispatch` scans when the goal is repository maintenance, not only PR review.

Pitfalls to avoid:

- Do not run PR-controlled workflow code with `KIRO_API_KEY`.
- Do not trust old bot comments as proof that the current review run succeeded.
- Do not pass issue comments, PR titles, paths, or workflow inputs as shell arguments; read them from files or validated environment variables.
- Do not compare IDs across GitHub object namespaces. For example, PR review IDs and issue comment IDs are not ordered against each other.
- Do not let public comment commands create issues or branches without checking the commenter's repository permission.
- Do not give read-only review agents broad shell tools such as unrestricted `cat`, `find`, or `shell`.

## Notes

The sample uses `--trust-tools=read,grep` for review workflows because code review should be read-only. If you create a remediation workflow that edits files, put that in a separate workflow with explicit permissions and a different agent.

See `docs/expected-findings.md` for the intentional issues in the sample app.

## Project Documentation

- `CONTRIBUTING.md`: contribution workflow and authority-tier rules.
- `SECURITY.md`: security policy and CI workflow safety rules.
- `docs/index.html`: GitHub Pages landing page.
- `docs/release-checklist.md`: open-source release checklist.
- `LICENSE`: MIT license.
