# @scalar/mermaid-plugin

## 0.1.12

No changes in this release.

## 0.1.11

No changes in this release.

## 0.1.10

### Patch Changes

- [#11099](https://github.com/scalar/scalar/pull/11099): Update compatible runtime and styling dependencies, align editor dependency versions, and preserve document-change comparisons with updated microdiff semantics.

## 0.1.9

### Patch Changes

- [#11004](https://github.com/scalar/scalar/pull/11004): Preserve package output paths and application aliases when building with TypeScript 6.

## 0.1.8

### Patch Changes

- [#11032](https://github.com/scalar/scalar/pull/11032): Update Mermaid to use a patched KaTeX dependency.

## 0.1.7

No changes in this release.

## 0.1.6

## 0.1.5

## 0.1.4

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
