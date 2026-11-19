---
'@scalar/highlight': patch
'@scalar/components': patch
---

Color operators like punctuation in syntax highlighting

Operators such as `=`, `->` and `::` now get an `hljs-operator` class and use the same quieter color as brackets and commas, so `client.planets()` and `Client::new()` read consistently. If you pair `@scalar/highlight/compat` with your own highlight.js theme, its `.hljs-operator` rules now apply too.
