# @scalar/agent-chat

## 0.5.8

### Patch Changes

#### Updated Dependencies

- **@scalar/workspace-store@0.31.1**
  - [#8114](https://github.com/scalar/scalar/pull/8114): feat(workspace-store): sync path variables on ingress
  - [#8094](https://github.com/scalar/scalar/pull/8094): feat: open client to the correct example name

- **@scalar/api-client@2.26.1**
  - [#8072](https://github.com/scalar/scalar/pull/8072): fix: add `ModalClientContainer` to unify logic and styles across `Modal` and `ApiClientModal`.
  - [#8094](https://github.com/scalar/scalar/pull/8094): feat: open client to the correct example name

- **@scalar/components@0.19.1**

## 0.5.7

### Patch Changes

#### Updated Dependencies

- **@scalar/api-client@2.26.0**
  - [#8069](https://github.com/scalar/scalar/pull/8069): Added full width and height classes to the DataTableCheckbox input so it renders correctly on Safari.
  - [#8108](https://github.com/scalar/scalar/pull/8108): feat: unify the api client desktop and web layout
  - [#8095](https://github.com/scalar/scalar/pull/8095): feat: support loading files into the store
  - [#8079](https://github.com/scalar/scalar/pull/8079): fix(api-client): handle object values for form-urlencoded body
  - [#8081](https://github.com/scalar/scalar/pull/8081): feat(components): improve ScalarCodeBlock copy UI
  - [#8086](https://github.com/scalar/scalar/pull/8086): fix(api-reference): inconsistent styles throughout api-reference
  - [#8048](https://github.com/scalar/scalar/pull/8048): chore: improve save modal
  - [#8110](https://github.com/scalar/scalar/pull/8110): feat: support file plugin on the import document palette
  - [#8111](https://github.com/scalar/scalar/pull/8111): fix: move useColorMode hook to the app component

- **@scalar/workspace-store@0.31.0**
  - [#8095](https://github.com/scalar/scalar/pull/8095): feat: support loading files into the store
  - [#8096](https://github.com/scalar/scalar/pull/8096): feat: store relative urls/paths against base under the url mappings

- **@scalar/json-magic@0.11.0**
  - [#8095](https://github.com/scalar/scalar/pull/8095): feat: support loading files into the store
  - [#8096](https://github.com/scalar/scalar/pull/8096): feat: store relative urls/paths against base under the url mappings

- **@scalar/components@0.19.0**
  - [#8081](https://github.com/scalar/scalar/pull/8081): feat(components): improve ScalarCodeBlock copy UI
  - [#8065](https://github.com/scalar/scalar/pull/8065): feat(components): add editor to ScalarMenu and optionally remove docs

## 0.5.6

### Patch Changes

#### Updated Dependencies

- **@scalar/workspace-store@0.30.0**
  - [#8077](https://github.com/scalar/scalar/pull/8077): feat: support team workspaces

- **@scalar/api-client@2.25.0**
  - [#8077](https://github.com/scalar/scalar/pull/8077): feat: support team workspaces

- **@scalar/components@0.18.0**
  - [#8077](https://github.com/scalar/scalar/pull/8077): feat: support team workspaces

## 0.5.5

### Patch Changes

#### Updated Dependencies

- **@scalar/api-client@2.24.0**
  - [#7989](https://github.com/scalar/scalar/pull/7989): fix: prevent API client modal from disappearing on reopen in Safari
  - [#8049](https://github.com/scalar/scalar/pull/8049): fix: gracefully handle import errors when importing from command palette
  - [#8061](https://github.com/scalar/scalar/pull/8061): fix: correctly display watch mode toggle state
  - [#8062](https://github.com/scalar/scalar/pull/8062): fix: correctly handle redirect after the document deletion
  - [#8070](https://github.com/scalar/scalar/pull/8070): chore: remove the import modal and change the workspace picker to support groups
  - [#8045](https://github.com/scalar/scalar/pull/8045): feat: manage active environments

- **@scalar/json-magic@0.10.0**
  - [#8052](https://github.com/scalar/scalar/pull/8052): feat: allow custom LoaderPlugin plugins in dereference

- **@scalar/workspace-store@0.29.0**
  - [#8061](https://github.com/scalar/scalar/pull/8061): fix: do not throw when try to update a non existent document metadata
  - [#8045](https://github.com/scalar/scalar/pull/8045): feat: manage active environments

- **@scalar/components@0.17.6**
  - [#8070](https://github.com/scalar/scalar/pull/8070): chore: remove the import modal and change the workspace picker to support groups

## 0.5.4

### Patch Changes

#### Updated Dependencies

- **@scalar/workspace-store@0.28.4**
  - [#8047](https://github.com/scalar/scalar/pull/8047): fix: unpack proxy when update an environment

- **@scalar/api-client@2.23.4**
  - [#8058](https://github.com/scalar/scalar/pull/8058): fix: correctly drop changes when modal closes
  - [#8059](https://github.com/scalar/scalar/pull/8059): fix: harden auth secret extraction plus tests

- **@scalar/components@0.17.5**

## 0.5.3

### Patch Changes

- [#8043](https://github.com/scalar/scalar/pull/8043): fix: :deep selector for bun build

#### Updated Dependencies

- **@scalar/workspace-store@0.28.3**
  - [#8035](https://github.com/scalar/scalar/pull/8035): fix: correctly resolve and validate refs
  - [#8034](https://github.com/scalar/scalar/pull/8034): fix: allow setting servers which dont exist in the document (from the config)

- **@scalar/api-client@2.23.3**
  - [#8035](https://github.com/scalar/scalar/pull/8035): fix: correctly resolve and validate refs
  - [#8033](https://github.com/scalar/scalar/pull/8033): fix: add failsafe to incorrect array parameter style
  - [#8043](https://github.com/scalar/scalar/pull/8043): fix: :deep selector for bun build

- **@scalar/components@0.17.4**

## 0.5.2

### Patch Changes

- [#8027](https://github.com/scalar/scalar/pull/8027): feat(agent): add client side request tool

#### Updated Dependencies

- **@scalar/api-client@2.23.2**
  - [#8027](https://github.com/scalar/scalar/pull/8027): feat(agent): add client side request tool

## 0.5.1

### Patch Changes

- [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store
- [#8028](https://github.com/scalar/scalar/pull/8028): feat(agent-chat): registry upload flow

#### Updated Dependencies

- **@scalar/workspace-store@0.28.2**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

- **@scalar/api-client@2.23.1**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store
  - [#7992](https://github.com/scalar/scalar/pull/7992): feat: hide code snippets without clients

- **@scalar/helpers@0.2.11**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

- **@scalar/components@0.17.3**

- **@scalar/json-magic@0.9.6**

- **@scalar/types@0.6.2**

## 0.4.8

### Patch Changes

- [#8020](https://github.com/scalar/scalar/pull/8020): chore(agent): tweak info message copy

## 0.4.7

### Patch Changes

#### Updated Dependencies

- **@scalar/api-client@2.23.0**
  - [#8005](https://github.com/scalar/scalar/pull/8005): feat: import modal for client v2

## 0.4.6

### Patch Changes

#### Updated Dependencies

- **@scalar/api-client@2.22.3**
  - [#8004](https://github.com/scalar/scalar/pull/8004): fix: do not add a content type of none
  - [#7934](https://github.com/scalar/scalar/pull/7934): fix: z-index issues in addressBar

- **@scalar/components@0.17.2**
  - [#7934](https://github.com/scalar/scalar/pull/7934): fix: z-index issues in addressBar

- **@scalar/workspace-store@0.28.1**
  - [#7823](https://github.com/scalar/scalar/pull/7823): chore: update workspace schema index to support teamUid queries and local

## 0.4.5

### Patch Changes

- [#7976](https://github.com/scalar/scalar/pull/7976): Clean-up chat form logic
- [#8002](https://github.com/scalar/scalar/pull/8002): feat(agent): add inline agent chat
- [#7995](https://github.com/scalar/scalar/pull/7995): feat: enable/disable agent scalar

#### Updated Dependencies

- **@scalar/types@0.6.1**
  - [#8000](https://github.com/scalar/scalar/pull/8000): fix(agent): change enabled flag to disabled
  - [#7995](https://github.com/scalar/scalar/pull/7995): feat: enable/disable agent scalar

- **@scalar/api-client@2.22.2**
  - [#7998](https://github.com/scalar/scalar/pull/7998): Made the inputs to useCommandPalette state reactive
  - [#7988](https://github.com/scalar/scalar/pull/7988): feat: restore old client search
  - [#8002](https://github.com/scalar/scalar/pull/8002): feat(agent): add inline agent chat
  - [#7784](https://github.com/scalar/scalar/pull/7784): fix: resolve oauth2 relative URLs against relative server URLs
  - [#7971](https://github.com/scalar/scalar/pull/7971): fix: improve sidebar click behavior

- **@scalar/workspace-store@0.28.0**
  - [#7970](https://github.com/scalar/scalar/pull/7970): feat: update sidebar when docuemnt title changes
  - [#7988](https://github.com/scalar/scalar/pull/7988): feat: restore old client search
  - [#7963](https://github.com/scalar/scalar/pull/7963): feat: unify is-object helpers

- **@scalar/json-magic@0.9.5**
  - [#7963](https://github.com/scalar/scalar/pull/7963): feat: unify is-object helpers

- **@scalar/helpers@0.2.10**
  - [#7963](https://github.com/scalar/scalar/pull/7963): feat: unify is-object helpers

- **@scalar/components@0.17.1**

## 0.4.3

### Patch Changes

- [#7974](https://github.com/scalar/scalar/pull/7974): fix(agent): change agent share to source

## 0.4.2

### Patch Changes

- [#7962](https://github.com/scalar/scalar/pull/7962): fix(agent): add flag for agent share flow

## 0.4.1

### Patch Changes

- [#7960](https://github.com/scalar/scalar/pull/7960): fix: update agent pricing per message
- [#7966](https://github.com/scalar/scalar/pull/7966): feat(agent): add remaining message information
- [#7961](https://github.com/scalar/scalar/pull/7961): fix(agent): make agent ui responsive
- [#7967](https://github.com/scalar/scalar/pull/7967): fix(agent): remove ui jump on uploading document

#### Updated Dependencies

- **@scalar/api-client@2.22.1**
  - [#7965](https://github.com/scalar/scalar/pull/7965): Adds exports for creating external actions

## 0.4.0

### Minor Changes

- [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost

### Patch Changes

#### Updated Dependencies

- **@scalar/api-client@2.22.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost
  - [#7929](https://github.com/scalar/scalar/pull/7929): fix: revert changes to the document when closing the modal
  - [#7932](https://github.com/scalar/scalar/pull/7932): feat: use getExample in the references responses

- **@scalar/components@0.17.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost

- **@scalar/themes@0.14.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost

- **@scalar/types@0.6.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost

- **@scalar/workspace-store@0.27.2**
