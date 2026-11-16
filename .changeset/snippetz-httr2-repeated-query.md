---
'@scalar/snippetz': patch
---

fix(snippetz): send repeated query parameters in R httr2 examples

The `r/httr2` example now adds `.multi = "explode"` to `req_url_query()` when a query parameter repeats. httr2 rejects vector values there by default, so `status=active&status=inactive` failed with "All vector elements of `...` must be length 1" instead of being sent.
