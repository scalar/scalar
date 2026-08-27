---
'scalar-fastapi': minor
---

feat(fastapi): add one-line `add_scalar_reference(app)` setup and fix small bugs

`add_scalar_reference(app)` registers the reference route for you and reads `title` and `openapi_url` straight from the FastAPI app, so the common case is a single line. Any `get_scalar_api_reference` option (theme, custom `route`, etc.) can still be passed through.

Also fixes a few papercuts in `get_scalar_api_reference`: the page title is now HTML-escaped, a document containing `</script>` can no longer break out of the inline script, the `dark_mode` type hint matches its `None` default, and the mutable default arguments were replaced with `None`.
