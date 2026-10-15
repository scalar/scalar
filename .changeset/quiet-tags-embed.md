---
'@scalar/highlight': minor
---

feat: highlight more embedded languages and keyword-named keys

- Markdown: front matter is highlighted as YAML, and HTML that starts a line as HTML. A `<script>`, `<pre>` or `<style>` block runs to its closing tag. The last line of front matter is no longer read as a heading.
- HTTP: a body that starts with `<` is highlighted as XML/HTML.
- PHP: `<script>` and `<style>` bodies in templates are highlighted as JavaScript and CSS, and a `<?= ?>` region inside them keeps the surrounding JavaScript or CSS state, so `"<?= $name ?>"` stays one string.
- Engine: an `embed` can declare `holes`, regions of the body the host grammar tokenizes while the embedded language reads across them.
- CSS: the condition of `@media`, `@supports`, `@container` and `@import` gets keywords, features, numbers and values.
- JavaScript/TypeScript: a keyword used as an object key (`{ type: 'object' }`, `{ default: 1 }`) reads as a property, `static of()` and `get(key)` read as method names, and `#private` fields are scoped.
