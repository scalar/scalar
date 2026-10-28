# @scalar/mermaid-plugin

## 0.1.3

## 0.1.2

## 0.1.1

## 0.1.0

### Minor Changes

- [#10213](https://github.com/scalar/scalar/pull/10213): Add per-reference Markdown rendering hooks and an explicitly loaded Mermaid plugin with interactive diagrams, keyboard panning, and zoom controls.

  Provide Markdown hooks before mounting the embedded client modal so its initial render receives the configured hooks. The Mermaid viewer uses customizable Scalar theme styles and an intentional light drawing surface.

  Isolate Markdown plugin cleanup failures so other plugins still release their resources when content changes or unmounts.

### Patch Changes

- [#10650](https://github.com/scalar/scalar/pull/10650): Allow the Mermaid plugin to be published to npm by removing the private package flag.
