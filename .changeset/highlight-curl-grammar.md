---
'@scalar/highlight': minor
---

Add a dedicated `curl` grammar, so curl command lines keep the colouring they had under `@scalar/code-highlight`.

`curl` was mapped to the bash grammar. That is a defensible reading — a curl invocation is a shell command line — but it loses the two tokens a reader actually looks for. `@scalar/code-highlight` ships a bespoke curl grammar, and `code.css` is written against it: `.hljs.language-curl .hljs-literal` and `.hljs.language-curl .hljs-string` both have curl-specific rules. Under bash, `curl` and the request method came out unscoped, so the command name lost its keyword colour and `POST` lost its symbol colour entirely.

The new grammar mirrors the reference: the command is a keyword, `--request`/`-X` and other flags are literals, the method they carry is a symbol, and `$(…)` inside a double-quoted value reads as a variable. Output now matches the reference class for class.

This also adds a `symbol` scope to the vocabulary, mapped to `hljs-symbol` in the compat layer — a scope highlight.js has and `code.css` already styles, and the natural home for Ruby symbols and Erlang atoms too.

A curl sample joins the shared test corpus, so the differential suites compare this grammar against the reference on every run.
