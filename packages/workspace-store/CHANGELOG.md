# @scalar/workspace-store

## 0.15.6

### Patch Changes

- Updated dependencies [bff46e5]
  - @scalar/helpers@0.0.11
  - @scalar/json-magic@0.4.3
  - @scalar/code-highlight@0.1.9
  - @scalar/openapi-parser@0.20.6

## 0.15.5

### Patch Changes

- Updated dependencies [3bd1209]
- Updated dependencies [39bbc0e]
- Updated dependencies [1943b99]
  - @scalar/json-magic@0.4.2
  - @scalar/openapi-parser@0.20.5

## 0.15.4

### Patch Changes

- 019a22a: Try catch merge object to avoid uncaught proxy errors

## 0.15.3

### Patch Changes

- 821717b: refactor: schema rendering
- Updated dependencies [821717b]
  - @scalar/helpers@0.0.10
  - @scalar/json-magic@0.4.1
  - @scalar/openapi-parser@0.20.4

## 0.15.2

### Patch Changes

- Updated dependencies [b8c4b61]
  - @scalar/openapi-parser@0.20.3

## 0.15.1

### Patch Changes

- Updated dependencies [abe3842]
  - @scalar/types@0.2.15
  - @scalar/openapi-parser@0.20.2
  - @scalar/snippetz@0.4.9
  - @scalar/code-highlight@0.1.9

## 0.15.0

### Minor Changes

- a6ae22a: feat: change the way we declare schemas
- 99894bc: feat: correctly validate the schemas
- 5ad329e: feat: openapi auth selector block

### Patch Changes

- ba27329: chore: switch to the new version of typebox
- 3473e08: fix: performance issues on script load
- 63283aa: fix: use hidden properties during validation
- 8680da6: chore: delete loose schemas
- Updated dependencies [40e79b9]
- Updated dependencies [06a46f0]
- Updated dependencies [98c55d0]
- Updated dependencies [792c937]
- Updated dependencies [63283aa]
- Updated dependencies [0e747c7]
- Updated dependencies [99894bc]
  - @scalar/snippetz@0.4.8
  - @scalar/json-magic@0.4.0
  - @scalar/helpers@0.0.9
  - @scalar/types@0.2.14
  - @scalar/openapi-parser@0.20.2
  - @scalar/code-highlight@0.1.9

## 0.14.2

### Patch Changes

- 443c507: feat: make required: null an empty array
- Updated dependencies [88385b1]
- Updated dependencies [50032be]
  - @scalar/json-magic@0.3.1
  - @scalar/types@0.2.13
  - @scalar/openapi-parser@0.20.1
  - @scalar/code-highlight@0.1.9

## 0.14.1

### Patch Changes

- b8776fc: feat: output validation errors in the console

## 0.14.0

### Minor Changes

- b93e1fe: feat(workspace-store): support relative external references
- 5208f06: feat(workspace-store): validate that the bundle produces valid openapi document
- 4d509fb: feat(workspace-store): use the configuration fetcher to bundle the document
- 9be6eec: feat(workspace-store): preprocess documents to make them compliant
- c4bf497: fix(workspace-store): correctly propagate documents from one state to the other
- d8adbed: feat(workspace-store): resolve multi level refs
- 0c80ef0: feat(json-magic): change the way we resolve refs

### Patch Changes

- bbef120: fix: remove extra coerces and cleanUp plugin from bundler
- a1429ca: chore: move to new extensions system for better type safety
- 66b18fc: feat: update the references to handle $refs from the magic proxy
- 0fcd446: feat(workspace-store): performance improvements
- c838a3f: chore: added measurements to workspace store
- Updated dependencies [b93e1fe]
- Updated dependencies [d4adeba]
- Updated dependencies [66b18fc]
- Updated dependencies [5f022b5]
- Updated dependencies [0fcd446]
- Updated dependencies [6a88108]
- Updated dependencies [c418e92]
- Updated dependencies [c4bf497]
- Updated dependencies [d8adbed]
- Updated dependencies [0c80ef0]
  - @scalar/json-magic@0.3.0
  - @scalar/openapi-parser@0.20.0
  - @scalar/helpers@0.0.8
  - @scalar/types@0.2.12
  - @scalar/code-highlight@0.1.9

## 0.13.0

### Minor Changes

- 0d502cb: chore(workspace-store): clean up client store
- 0afc40c: feat(json-magic): introduce type-safe apply function with tracked target type in diff results
- 128af48: feat(workspace-store, json-magic): support `externalValue` fields on example object

### Patch Changes

- Updated dependencies [e203e90]
- Updated dependencies [0afc40c]
- Updated dependencies [128af48]
  - @scalar/openapi-parser@0.19.1
  - @scalar/json-magic@0.2.0
  - @scalar/code-highlight@0.1.9
  - @scalar/helpers@0.0.7
  - @scalar/types@0.2.11

## 0.12.0

### Minor Changes

- 952bde2: feat(json-magic): move json tooling to the new package
- ae8d1b9: feat(workspace-store): rebase document origin with a remote origin
- 2888e18: feat(openapi-parser): partial bundle to a depth

### Patch Changes

- 5301a80: feat: make content reactive and update workspace store
- 8199955: fix(workspace-store): never write overrides back to the intermediate state
- Updated dependencies [952bde2]
- Updated dependencies [2888e18]
  - @scalar/openapi-parser@0.19.0
  - @scalar/json-magic@0.1.0

## 0.11.0

### Minor Changes

- 9924c47: feat(workspace-store): support replacing the whole document
- a0c92d9: feat(workspace-store): create store from workspace specification object

### Patch Changes

- a5534e6: fix: show path parameters on operation
- 6b6c72c: fix: hiddenClients: true and move clients to workspace store
- Updated dependencies [ccf875a]
- Updated dependencies [d4cb86b]
- Updated dependencies [94d6d0c]
- Updated dependencies [c345d2c]
- Updated dependencies [c0d6793]
- Updated dependencies [f3d0216]
  - @scalar/openapi-types@0.3.7
  - @scalar/types@0.2.11
  - @scalar/code-highlight@0.1.9
  - @scalar/openapi-parser@0.18.3
  - @scalar/helpers@0.0.7

## 0.10.2

### Patch Changes

- Updated dependencies [fb62e1b]
- Updated dependencies [1c2b9f3]
  - @scalar/types@0.2.10
  - @scalar/openapi-parser@0.18.2
  - @scalar/code-highlight@0.1.8

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
