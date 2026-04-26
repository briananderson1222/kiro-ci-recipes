# Promote Review Finding to Issue

Turns a normalized Kiro finding into a GitHub issue with `/open-issue <n>`.

Authority: `issue-write`

Install:

```bash
./install.sh pr-review issue-promotion
```

Requires a review comment containing normalized `REVIEW_DATA`.

Security expectations:

- Only accept `/open-issue <n>` on pull requests.
- Check that the commenter has write, maintain, or admin permission before creating an issue.
- Read the comment body from the GitHub API into a file before parsing.
- Select findings from structured `REVIEW_DATA`, not free-form markdown.
