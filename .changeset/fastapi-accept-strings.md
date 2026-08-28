---
'scalar-fastapi': minor
---

feat(fastapi): accept plain strings for enum options

`layout`, `theme`, `search_hot_key`, and `document_download_type` now accept a plain string (for example `theme="moon"`) in addition to their enum members, so every option can be configured the same way. The enums are still exported and keep working unchanged. `force_dark_mode_state` is also tightened from `str` to `Literal["dark", "light"]`.
