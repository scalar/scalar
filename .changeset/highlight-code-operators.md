---
'@scalar/highlight': patch
'@scalar/components': patch
---

Color operators like punctuation in syntax highlighting

Operators such as `=`, `->` and `::` now get an `hljs-operator` class and use the same quieter color as brackets and commas, so `client.planets()` and `Client::new()` read consistently.
