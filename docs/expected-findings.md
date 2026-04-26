# Expected Sample Findings

The app in `src/app.js` is intentionally flawed so Kiro review workflows have realistic issues to find.

Expected high-signal findings:

| Area | Location | Why it matters |
| --- | --- | --- |
| Hardcoded credential | `login()` | The demo admin password is embedded directly in code. |
| Unsafe HTML rendering | `renderProfile()` | Query/user-provided profile fields are interpolated into HTML without escaping. |
| Weak session token | `login()` | Tokens are based on `Date.now()` and are predictable. |
| No session expiry | `sessions` map | Created sessions are never expired or revoked. |

The exact wording and severity may vary by model, but the normalized output should preserve any actionable findings in the `REVIEW_DATA` payload.
