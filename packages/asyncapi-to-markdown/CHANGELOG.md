# @scalar/asyncapi-to-markdown

## 0.2.8

No changes in this release.

## 0.2.7

### Patch Changes

- [#10904](https://github.com/scalar/scalar/pull/10904): Block private-network document requests by default and require an explicit basePath for local files. Apply the same permissions to external references, with an opt-in for trusted private-network inputs.
- [#10904](https://github.com/scalar/scalar/pull/10904): Share confined document loading between Markdown converters and include HTTP status codes in load errors.

## 0.2.6

## 0.2.5

## 0.2.4

## 0.2.3

## 0.2.2

## 0.2.1

## 0.2.0

### Minor Changes

- [#10586](https://github.com/scalar/scalar/pull/10586): Add AsyncAPI Markdown conversion with reusable renderers and individual reference pages. Share Markdown description parsing between the OpenAPI and AsyncAPI converters.

  Include shared model links, contents navigation, tag pages, generated examples, and an interactive playground.

  Preserve discriminators and linked schema descriptions, generate examples from primitive aliases, and compact property annotations.

  Include full-export tag documentation, preserve XML schema examples, and normalize annotated primitive aliases.

  Infer enum and const type labels and honor primitive-link settings in generated model examples.

  Preserve AsyncAPI application and schema metadata, explain security alternatives, and render reply and unknown-address semantics accurately.
