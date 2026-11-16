---
'scalar_api_reference': patch
---

Prevent HTML injection in embedded Rust configuration and bundle URLs, and preserve literal template placeholders in user data.

Make the raw `render_scalar` helper internal so callers cannot bypass JSON validation. Use `scalar_html` with a `serde_json::Value` or `scalar_html_from_json` with a JSON string instead.
