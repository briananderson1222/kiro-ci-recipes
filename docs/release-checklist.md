# Open-Source Release Checklist

Before publishing this repository publicly:

- [x] Choose and add a license.
- [ ] Confirm repository description and topics.
- [ ] Enable GitHub Pages from the `GitHub Pages` workflow.
- [ ] Enable private vulnerability reporting or document a maintainer contact path.
- [ ] Review every workflow permission block.
- [ ] Confirm secret-backed workflows run trusted scripts, not PR-controlled scripts.
- [ ] Confirm comment-triggered workflows check commenter permissions.
- [ ] Confirm user-controlled strings are not interpolated into shell command strings.
- [ ] Confirm read-only review agents do not include broad shell tools.
- [ ] Confirm workflow success checks use current-run artifacts, timestamps, or run IDs rather than stale bot comments.
- [ ] Run `npm test` and `npm run lint`.
- [ ] Validate all checked-in Kiro agents.
- [ ] Run `./install.sh --dry-run pr-review security-gate test-gap-finder`.
- [ ] Test installing at least one pack into a temporary repo.
- [ ] Decide whether `auto-fix-branch` should ship as experimental.
- [ ] Update README links after the GitHub Pages URL is known.
