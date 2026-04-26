# Security Policy

## Reporting

Please report vulnerabilities privately through GitHub Security Advisories when enabled for this repository. If advisories are not enabled, contact the maintainers before opening a public issue.

## CI Workflow Safety Rules

- Do not expose `KIRO_API_KEY` to PR-controlled workflow code.
- Prefer read-only Kiro tools: `--trust-tools=read,grep`.
- Keep branch-writing workflows opt-in and clearly labeled.
- Use least-privilege GitHub Actions permissions.
- Treat `pull_request_target` as high risk and avoid it unless the workflow never executes untrusted code.
- Pin or verify third-party installers in production pipelines.
- Do not treat prior bot comments as verification for the current workflow run.
- Do not pass PR titles, issue comments, workflow inputs, or file paths directly into shell command strings.
- Do not grant broad shell tools to agents that review untrusted PR content.

## Comment-Triggered Commands

Workflows that respond to comments such as `/open-issue <n>` or `/kiro-fix <n>` must:

- confirm the comment is on a pull request, not a standalone issue;
- check that the commenter has write, maintain, or admin permission;
- read the comment body from the GitHub API into a file before parsing;
- parse only an allowlisted command shape;
- select findings from structured review data, not free-form markdown;
- acknowledge the command without echoing untrusted content into shell commands.

## Secrets

Required secrets should be documented in each use-case manifest. Never commit API keys, GitHub tokens, or generated credentials.
