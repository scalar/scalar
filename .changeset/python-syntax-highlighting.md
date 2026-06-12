---
'@scalar/code-highlight': patch
---

Improve Python syntax highlighting: constructor calls, function and method calls, attribute access, and keyword arguments are now colored. The built-in highlight.js Python grammar only tagged keywords, strings and definitions, which left most of a typical API reference snippet (mostly calls, attribute chains and keyword arguments) unstyled. Class titles are now colored green and property access is colored yellow in the theme, so constructors and method chains light up across all languages.
