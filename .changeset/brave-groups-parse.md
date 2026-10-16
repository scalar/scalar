---
'@scalar/highlight': minor
---

feat: close more gaps with TextMate grammars, and highlight faster

- Engine: only the wrapper group around each rule captures in a state's merged regex. Past 63 capture groups V8 allocates on every match, which cost large grammars such as C, C++, C#, PHP, Ruby and Python a third of their throughput or more.
- CSS: `var(--brand)` has the same scope as the `--brand:` it refers to. SCSS `$name` and Less `@name` read whole where they are used, and `$brand: red` at the top level reads as a value rather than a selector.
- JavaScript/TypeScript: the names in a parameter list read as parameters, destructuring and annotations included; `function f()` names a definition; `with { type: 'json' }` on an import is a keyword.
- Swift: `#/…/#` and `/…/` regex literals, and the `nonisolated`, `isolated`, `distributed`, `borrowing`, `consuming`, `sending` and `macro` modifiers.
- Diff: context (`diff -c`) and normal (`diff`) formats, svn `Index:` headers, and `#` comment lines.
- Ruby: a method called without parentheses, `list.length`, reads as a call, and `p`, `printf`, `warn` and friends as builtins.
- Go: a package-qualified type, `w http.ResponseWriter` or `*testing.T`, reads as a type where a type goes.
- nginx: log levels, event methods, rewrite flags, and the names of `upstream` and `map` blocks.
- Haskell: the names in an import list. Kotlin: `package` and `import` paths, and `tailrec`, `external` and `value class`. C++: calls with explicit template arguments, `any_cast<int>(x)`.
- Rust: `.await` is a keyword, `self` the receiver and `Self` a type, and `r#type` stays a name. Python: `case 200: return x` with its body on the same line is a keyword. TypeScript: `const id = <T,>(x: T) => x` names a function.
