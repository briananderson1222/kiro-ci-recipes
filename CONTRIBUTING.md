# Contributing

This repo is a catalog of Kiro CLI headless-mode CI use cases. Contributions should keep use cases small, installable, and clear about authority.

## Development

Run local checks before opening a PR:

```bash
npm test
npm run lint
kiro-cli agent validate --path .kiro/agents/code-reviewer.json
kiro-cli agent validate --path .kiro/agents/security-reviewer.json
```

When adding a Kiro agent, validate it with `kiro-cli agent validate --path <file>`.

## Adding a Use Case

Each use case should include:

- `use-cases/<id>/README.md`
- `use-cases/<id>/manifest.json`
- one workflow or local script entry point
- a clear authority tier
- required secrets and GitHub permissions
- local shift-left commands when possible

Keep high-authority workflows opt-in. Any workflow that can write to branches, issues, or pull requests must document why that permission is needed.

## Agent and Prompt Design

Keep agent configs small enough to audit. If instructions become long, move review behavior into a prompt file or shared skill and keep the agent config focused on model, tools, and resource wiring.

Review-oriented use cases should reuse a common rubric for:

- severity definitions;
- confidence scoring;
- discard rules;
- required structured finding fields;
- review pass boundaries.

When a workflow emits findings for downstream automation, include structured data such as `REVIEW_DATA` and test the parser with fixtures. Follow-up workflows should consume that structure instead of reparsing visible markdown.

## Authority Tiers

| Tier | Meaning |
| --- | --- |
| `read-only-artifact` | Produces artifacts only. |
| `pull-request-comment` | Posts advisory PR comments or reviews. |
| `read-only-blocking` | Can fail CI but cannot write code. |
| `issue-write` | Creates or updates GitHub issues. |
| `branch-write` | Creates commits, branches, or PRs. |

## Pull Request Checklist

- [ ] `npm test` passes.
- [ ] `npm run lint` passes.
- [ ] New workflows use least-privilege permissions.
- [ ] Secret-backed workflows do not run PR-controlled action/script code.
- [ ] Comment-triggered workflows check commenter permissions.
- [ ] User-controlled strings are parsed from files or validated env vars, not interpolated into shell.
- [ ] Review outputs include tested structured data when another workflow consumes them.
- [ ] New use cases have a manifest and README.
- [ ] Local shift-left path is documented or explicitly marked not applicable.
