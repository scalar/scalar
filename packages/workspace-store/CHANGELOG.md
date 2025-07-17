# @scalar/workspace-store

## 0.10.1

### Patch Changes

- 3f2ea8a: fix: shows different console errors whether the request wasn't successful or the data isn't a valid object
- 828c894: fix: update workspace traversal with fixes from sidebar
- b5bcce7: feat: implement new request example openapi block in references
- Updated dependencies [591562f]
- Updated dependencies [85ee2ce]
- Updated dependencies [85ee2ce]
  - @scalar/openapi-types@0.3.6
  - @scalar/types@0.2.9
  - @scalar/code-highlight@0.1.8
  - @scalar/openapi-parser@0.18.1

## 0.10.0

### Minor Changes

- 8b9c48e: fix(workspace-store): support local ref resolution on arrays

### Patch Changes

- a85480e: feat: lay the groundwork for the block implementation PR
- Updated dependencies [6ab3a21]
  - @scalar/code-highlight@0.1.7

## 0.9.0

### Minor Changes

- a0cadac: feat(workspace-store) add persistence layer to workspace store

### Patch Changes

- 80acf84: feat: add code sample block wrapper with global state
- Updated dependencies [c10e191]
- Updated dependencies [903f975]
  - @scalar/types@0.2.8
  - @scalar/code-highlight@0.1.6
  - @scalar/openapi-parser@0.18.1

## 0.8.0

### Minor Changes

- d56f354: feat(workspace-store): differentiate the local saved document with the last known remote version of the document
- b6ac5b9: feat(workspace-store): create workspace mutators
- dbc09b9: feat(workspace-store): create extensions schemas for the api-client
- 20939a8: feat(workspace-store): add support for managing original document state with download and save APIs
- 909cf33: feat(workspace-store): add workspace specification schema

### Patch Changes

- f8ef4ab: fix: add a few missing http methods and type annotations
- Updated dependencies [ad2e3e6]
  - @scalar/types@0.2.7
  - @scalar/openapi-parser@0.18.1
  - @scalar/code-highlight@0.1.5

## 0.7.1

### Patch Changes

- Updated dependencies [2d7f995]
  - @scalar/code-highlight@0.1.5
  - @scalar/openapi-parser@0.18.1
  - @scalar/openapi-types@0.3.5
  - @scalar/helpers@0.0.6
  - @scalar/types@0.2.6

## 0.7.0

### Minor Changes

- a05d638: feat(workspace-store): create types and validator for reference config schema
- 8d8e427: feat(api-reference): load documents on the new store
- dbbdd70: feat(workspace-store) add configuration mapping to the workspace store

### Patch Changes

- 23b150b: fix: export and fix up some types from workspace store
- Updated dependencies [533469b]
- Updated dependencies [23b150b]
  - @scalar/openapi-types@0.3.4
  - @scalar/helpers@0.0.5
  - @scalar/openapi-parser@0.18.0
  - @scalar/types@0.2.5
  - @scalar/code-highlight@0.1.4

## 0.6.0

### Minor Changes

- b97c82a: feat(workspace-store): server store input document from different sources
- 9f786d5: feat(workspace-store): preserve the original ref information

### Patch Changes

- @scalar/code-highlight@0.1.4
- @scalar/openapi-parser@0.18.0

## 0.5.2

### Patch Changes

- 1703e42: fix(workspace-store): relative paths for ssg mode

## 0.5.1

### Patch Changes

- a567796: fix: make the workspace store reactive again
- Updated dependencies [291f09d]
  - @scalar/openapi-parser@0.18.0

## 0.5.0

### Minor Changes

- b6a1624: feat(workspace-store): improve workspace store validation

## 0.4.1

### Patch Changes

- Updated dependencies [7913193]
  - @scalar/code-highlight@0.1.4

## 0.4.0

### Minor Changes

- 7338d56: feat(workspace-store): generate sidebar entries

### Patch Changes

- 4156f1d: Expand workspace store integration
- Updated dependencies [221e35f]
- Updated dependencies [166e298]
- Updated dependencies [4156f1d]
- Updated dependencies [a37df33]
- Updated dependencies [f823d45]
- Updated dependencies [37c90b8]
  - @scalar/openapi-types@0.3.3
  - @scalar/helpers@0.0.4
  - @scalar/openapi-parser@0.17.0
  - @scalar/code-highlight@0.1.3

## 0.3.2

### Patch Changes

- 11fabae: fix(openapi-parser): webpack bundle errors because of the barrel files
- Updated dependencies [11fabae]
  - @scalar/openapi-parser@0.16.0

## 0.3.1

### Patch Changes

- 373214a: fix(workspace-store): remove readFiles plugin from the client store

## 0.3.0

### Minor Changes

- bbad7c7: feat(workspace-store): create a sync client store

## 0.2.0

### Minor Changes

- f4332eb: feat: external reference resolution and partial bundle of the openapi document

### Patch Changes

- Updated dependencies [17bc0d8]
- Updated dependencies [b9dacba]
- Updated dependencies [a73e9be]
- Updated dependencies [49c04cf]
- Updated dependencies [f4332eb]
- Updated dependencies [05c22c7]
  - @scalar/openapi-parser@0.15.0
  - @scalar/openapi-types@0.3.2

## 0.1.1

### Patch Changes

- Updated dependencies [ee3eb77]
  - @scalar/openapi-parser@0.14.0

## 0.1.0

### Minor Changes

- f7474ed: feat(workspace-store): openapi server side store

### Patch Changes

- Updated dependencies [1e87feb]
  - @scalar/openapi-parser@0.13.0
  - @scalar/openapi-types@0.3.1
