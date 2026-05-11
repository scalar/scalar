---
'@scalar/helpers': patch
---

feat(helpers): add `normalizationForm` and `stripAccents` options to `slugify` and `slugger`

- `normalizationForm` (`'NFC' | 'NFD' | 'NFKC' | 'NFKD'`, default `'NFC'`) passes the chosen form to `String.prototype.normalize()` before slugifying.
- `stripAccents` (`boolean`, default `false`) decomposes accented letters via NFD and removes all Unicode combining marks so e.g. `"Crème Brûlée"` becomes `"creme-brulee"`. Takes precedence over `normalizationForm`.
