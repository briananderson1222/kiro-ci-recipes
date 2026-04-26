# Auto-Fix Branch

Creates a standalone branch for a selected normalized finding with `/kiro-fix <n>`.

Authority: `branch-write`

Install:

```bash
./install.sh auto-fix-branch
```

This is intentionally opt-in and higher authority. It should be installed only after read-only review is working.

Security expectations:

- Only accept `/kiro-fix <n>` on pull requests.
- Check that the commenter has write, maintain, or admin permission before creating a branch.
- Read the command comment from the GitHub API into a file before parsing.
- Keep the fix agent scoped to file edits. Do not grant broad shell access unless the workflow has a separate threat model.

Local shift-left equivalent:

```bash
PROMPT=$(node -e 'const fs=require("fs"); const finding=fs.readFileSync("selected-finding.json", "utf8"); process.stdout.write(`Fix exactly this normalized review finding in a minimal branch. Do not address unrelated issues.\n\n${finding}`);')
KIRO_API_KEY=... kiro-cli chat --no-interactive --trust-tools=read,grep,write --agent fix-branch-writer "$PROMPT"
```
