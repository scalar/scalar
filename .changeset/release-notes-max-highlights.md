---
'@scalar/release-notes': minor
---

feat(release-notes): add a per-product `maxHighlights` option (1 to 20, default 5) that sets how many highlights a generated note may carry. The limit is stated in the default system prompt, enforced when the response is validated, and passed to custom system prompts, and the default output token budget grows with it.
