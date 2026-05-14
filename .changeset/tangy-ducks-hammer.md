---
'@scalar/api-client': patch
---

fix: prevent stuck response overlay after overlapping sends

Fixes a case where the response loading overlay could stay visible indefinitely and **Cancel** had no effect after opening an example and sending a request very quickly (or when multiple sends overlapped).
The reason for that is that `ResponseLoadingOverlay` delays showing the spinner by 1s. Each `hooks:on:request:sent` scheduled a new `setTimeout` without clearing the previous one. Overlapping `sent` events could leave an orphaned timer that still called `loader.start()` after the request had already finished and `hooks:on:request:complete` had run—so the overlay turned on with no further `complete`, and **Cancel** targeted an `AbortController` that no longer matched the finished request.
