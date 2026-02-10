# @scalar/workspace-store

## 0.30.0

### Minor Changes

- [#8077](https://github.com/scalar/scalar/pull/8077): feat: support team workspaces

## 0.29.0

### Minor Changes

- [#8045](https://github.com/scalar/scalar/pull/8045): feat: manage active environments

### Patch Changes

- [#8061](https://github.com/scalar/scalar/pull/8061): fix: do not throw when try to update a non existent document metadata

#### Updated Dependencies

- **@scalar/json-magic@0.10.0**
  - [#8052](https://github.com/scalar/scalar/pull/8052): feat: allow custom LoaderPlugin plugins in dereference

## 0.28.4

### Patch Changes

- [#8047](https://github.com/scalar/scalar/pull/8047): fix: unpack proxy when update an environment

## 0.28.3

### Patch Changes

- [#8035](https://github.com/scalar/scalar/pull/8035): fix: correctly resolve and validate refs
- [#8034](https://github.com/scalar/scalar/pull/8034): fix: allow setting servers which dont exist in the document (from the config)

## 0.28.2

### Patch Changes

- [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

#### Updated Dependencies

- **@scalar/helpers@0.2.11**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

- **@scalar/json-magic@0.9.6**

- **@scalar/object-utils@1.2.25**

- **@scalar/types@0.6.2**

- **@scalar/openapi-upgrader@0.1.8**

- **@scalar/snippetz@0.6.11**

## 0.28.1

### Patch Changes

- [#7823](https://github.com/scalar/scalar/pull/7823): chore: update workspace schema index to support teamUid queries and local

## 0.28.0

### Minor Changes

- [#7970](https://github.com/scalar/scalar/pull/7970): feat: update sidebar when docuemnt title changes

### Patch Changes

- [#7988](https://github.com/scalar/scalar/pull/7988): feat: restore old client search
- [#7963](https://github.com/scalar/scalar/pull/7963): feat: unify is-object helpers

#### Updated Dependencies

- **@scalar/types@0.6.1**
  - [#8000](https://github.com/scalar/scalar/pull/8000): fix(agent): change enabled flag to disabled
  - [#7995](https://github.com/scalar/scalar/pull/7995): feat: enable/disable agent scalar

- **@scalar/json-magic@0.9.5**
  - [#7963](https://github.com/scalar/scalar/pull/7963): feat: unify is-object helpers

- **@scalar/helpers@0.2.10**
  - [#7963](https://github.com/scalar/scalar/pull/7963): feat: unify is-object helpers

- **@scalar/openapi-upgrader@0.1.8**

- **@scalar/snippetz@0.6.10**

- **@scalar/object-utils@1.2.24**

## 0.27.2

### Patch Changes

#### Updated Dependencies

- **@scalar/themes@0.14.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost

- **@scalar/types@0.6.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost

- **@scalar/code-highlight@0.2.2**

- **@scalar/openapi-upgrader@0.1.8**

- **@scalar/snippetz@0.6.9**

## 0.27.1

### Patch Changes

- [#7926](https://github.com/scalar/scalar/pull/7926): Make V2 command palette extensible and improve types

## 0.27.0

### Minor Changes

- [#7905](https://github.com/scalar/scalar/pull/7905): feat: support loading files on the store

### Patch Changes

- [#7906](https://github.com/scalar/scalar/pull/7906): feat: remove parsing from codeinput and move to getExample

#### Updated Dependencies

- **@scalar/json-magic@0.9.4**
  - [#7922](https://github.com/scalar/scalar/pull/7922): fix: resolve $ref entries inside arrays (e.g. oneOf, allOf) in prefixInternalRefRecursive

## 0.26.2

### Patch Changes

- [#7894](https://github.com/scalar/scalar/pull/7894): fix: the import and export of redirect to proxy

#### Updated Dependencies

- **@scalar/helpers@0.2.9**
  - [#7894](https://github.com/scalar/scalar/pull/7894): fix: the import and export of redirect to proxy

- **@scalar/json-magic@0.9.3**

- **@scalar/object-utils@1.2.23**

- **@scalar/types@0.5.10**

- **@scalar/openapi-upgrader@0.1.8**

- **@scalar/snippetz@0.6.8**

## 0.26.1

### Patch Changes

- [#7888](https://github.com/scalar/scalar/pull/7888): fix: more robust parameter upsert and deletion

## 0.26.0

### Minor Changes

- [#7866](https://github.com/scalar/scalar/pull/7866): feat: history per operation support

### Patch Changes

- [#7886](https://github.com/scalar/scalar/pull/7886): fix: unpack proxy when we pop history items

#### Updated Dependencies

- **@scalar/snippetz@0.6.7**
  - [#7866](https://github.com/scalar/scalar/pull/7866): chore: expose har types

- **@scalar/types@0.5.9**
  - [#7866](https://github.com/scalar/scalar/pull/7866): chore: expose har types

- **@scalar/openapi-upgrader@0.1.8**

## 0.25.3

### Patch Changes

- [#7850](https://github.com/scalar/scalar/pull/7850): fix: remove unused workspace config
- [#7868](https://github.com/scalar/scalar/pull/7868): fix: updating path with a variable in it

## 0.25.2

### Patch Changes

#### Updated Dependencies

- **@scalar/snippetz@0.6.6**
  - [#7859](https://github.com/scalar/scalar/pull/7859): fix the use of httpx.AsyncClient async context manager

- **@scalar/openapi-upgrader@0.1.8**
  - [#7842](https://github.com/scalar/scalar/pull/7842): feat: migrate swagger 2.0 responses

## 0.25.1

### Patch Changes

- [#7828](https://github.com/scalar/scalar/pull/7828): fix: switch to upsert params due to race condition

## 0.25.0

### Minor Changes

- [#7753](https://github.com/scalar/scalar/pull/7753): feat: default headers and global cookies

### Patch Changes

- [#7786](https://github.com/scalar/scalar/pull/7786): chore: refactor mutators in workspace store
- [#7763](https://github.com/scalar/scalar/pull/7763): fix: normalize securitySchemes 'scheme'

#### Updated Dependencies

- **@scalar/json-magic@0.9.2**
  - [#7763](https://github.com/scalar/scalar/pull/7763): fix: correctly execute onAfterNodeProcess for ref nodes

## 0.24.10

### Patch Changes

- [#7774](https://github.com/scalar/scalar/pull/7774): Adds exports to V2 client.

## 0.24.9

### Patch Changes

- [#7751](https://github.com/scalar/scalar/pull/7751): fix: auth persistence

#### Updated Dependencies

- **@scalar/helpers@0.2.8**
  - [#7751](https://github.com/scalar/scalar/pull/7751): fix: auth persistence

- **@scalar/json-magic@0.9.1**

- **@scalar/object-utils@1.2.22**

- **@scalar/types@0.5.8**

- **@scalar/openapi-upgrader@0.1.7**

- **@scalar/snippetz@0.6.5**

## 0.24.8

### Patch Changes

- [#7728](https://github.com/scalar/scalar/pull/7728): fix: formBody handling in api client

## 0.24.7

### Patch Changes

- [#7745](https://github.com/scalar/scalar/pull/7745): fix: add nested array support to references

## 0.24.6

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.7**
  - [#7720](https://github.com/scalar/scalar/pull/7720): feat: escape XML in json2xml

- **@scalar/openapi-upgrader@0.1.7**
  - [#7739](https://github.com/scalar/scalar/pull/7739): fix: upgrade form to multipart/form
  - [#7694](https://github.com/scalar/scalar/pull/7694): feat: migrate x-example and x-examples

- **@scalar/json-magic@0.9.0**
  - [#7701](https://github.com/scalar/scalar/pull/7701): Made bundle external document extensions configurable

- **@scalar/object-utils@1.2.21**

- **@scalar/types@0.5.7**

- **@scalar/snippetz@0.6.4**

## 0.24.5

### Patch Changes

- [#7699](https://github.com/scalar/scalar/pull/7699): feat: added ui for oauth2 credentials location

## 0.24.4

### Patch Changes

- [#7661](https://github.com/scalar/scalar/pull/7661): fix: all issues for client modal v2 preparation

#### Updated Dependencies

- **@scalar/helpers@0.2.6**
  - [#7661](https://github.com/scalar/scalar/pull/7661): fix: all issues for client modal v2 preparation

- **@scalar/types@0.5.6**
  - [#7661](https://github.com/scalar/scalar/pull/7661): fix: all issues for client modal v2 preparation

- **@scalar/json-magic@0.8.10**

- **@scalar/object-utils@1.2.20**

- **@scalar/openapi-upgrader@0.1.6**

- **@scalar/snippetz@0.6.3**

## 0.24.3

### Patch Changes

- [#7605](https://github.com/scalar/scalar/pull/7605): fix: all issues for client modal v2 preparation

#### Updated Dependencies

- **@scalar/helpers@0.2.5**
  - [#7605](https://github.com/scalar/scalar/pull/7605): fix: all issues for client modal v2 preparation

- **@scalar/types@0.5.5**
  - [#7605](https://github.com/scalar/scalar/pull/7605): fix: all issues for client modal v2 preparation

- **@scalar/json-magic@0.8.9**

- **@scalar/object-utils@1.2.19**

- **@scalar/openapi-upgrader@0.1.6**

- **@scalar/snippetz@0.6.2**

## 0.24.2

### Patch Changes

- [#7643](https://github.com/scalar/scalar/pull/7643): chore: update typebox

## 0.24.1

### Patch Changes

- [#7580](https://github.com/scalar/scalar/pull/7580): feat: added default auth on client v2
- [#7581](https://github.com/scalar/scalar/pull/7581): fix: npm publish job
- [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2
- [#7568](https://github.com/scalar/scalar/pull/7568): fix: object merge replacing arrays

#### Updated Dependencies

- **@scalar/helpers@0.2.4**
  - [#7581](https://github.com/scalar/scalar/pull/7581): fix: npm publish job
  - [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

- **@scalar/json-magic@0.8.8**
  - [#7581](https://github.com/scalar/scalar/pull/7581): fix: npm publish job

- **@scalar/object-utils@1.2.18**
  - [#7581](https://github.com/scalar/scalar/pull/7581): fix: npm publish job

- **@scalar/snippetz@0.6.1**
  - [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

- **@scalar/types@0.5.4**
  - [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

- **@scalar/openapi-upgrader@0.1.6**

## 0.24.0

### Minor Changes

- [#7564](https://github.com/scalar/scalar/pull/7564): feat: restore cursor position after path/method update
- [#7559](https://github.com/scalar/scalar/pull/7559): feat: set the content-type header when switching body content-type
- [#7549](https://github.com/scalar/scalar/pull/7549): feat: send request animation

### Patch Changes

- [#7530](https://github.com/scalar/scalar/pull/7530): fix: handle operation level servers when adding a new operation
- [#7575](https://github.com/scalar/scalar/pull/7575): feat: add support for object examples + hide body when empty

#### Updated Dependencies

- **@scalar/helpers@0.2.3**
  - [#7575](https://github.com/scalar/scalar/pull/7575): feat: add support for object examples + hide body when empty

- **@scalar/json-magic@0.8.7**

- **@scalar/object-utils@1.2.17**

## 0.23.1

### Patch Changes

- [#7510](https://github.com/scalar/scalar/pull/7510) [`099237a`](https://github.com/scalar/scalar/commit/099237ad9cba4d29dcc5e742e39c3e42429a5817) Thanks [@DemonHa](https://github.com/DemonHa)! - fix: make sure the tabs does not get out of bound

- Updated dependencies [[`93ffb63`](https://github.com/scalar/scalar/commit/93ffb63e9d97c7a4ea810d9eeb95cc416c368806), [`bb52d9a`](https://github.com/scalar/scalar/commit/bb52d9a21e53628270bab93c0f03b5731c9c97c6), [`bb52d9a`](https://github.com/scalar/scalar/commit/bb52d9a21e53628270bab93c0f03b5731c9c97c6)]:
  - @scalar/code-highlight@0.2.2
  - @scalar/types@0.5.3
  - @scalar/snippetz@0.6.0
  - @scalar/openapi-upgrader@0.1.6
  - @scalar/helpers@0.2.2
  - @scalar/json-magic@0.8.6
  - @scalar/object-utils@1.2.16
  - @scalar/themes@0.13.26

## 0.23.0

### Minor Changes

- [#7474](https://github.com/scalar/scalar/pull/7474) [`10318b6`](https://github.com/scalar/scalar/commit/10318b6a59df49905225bdbd9e19044521cd4581) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: implement sidebar actions

### Patch Changes

- [#7467](https://github.com/scalar/scalar/pull/7467) [`f7c24e4`](https://github.com/scalar/scalar/commit/f7c24e4995580649dbc3cb87007a683f5dd91f7c) Thanks [@amritk](https://github.com/amritk)! - feat: client v2 handle path change with routing and conflict

- [#7519](https://github.com/scalar/scalar/pull/7519) [`3f797b6`](https://github.com/scalar/scalar/commit/3f797b67489e07c4f3bf34a39b2175ed2d6f1465) Thanks [@amritk](https://github.com/amritk)! - fix: client request param issues

- Updated dependencies [[`f7c24e4`](https://github.com/scalar/scalar/commit/f7c24e4995580649dbc3cb87007a683f5dd91f7c), [`4ac6227`](https://github.com/scalar/scalar/commit/4ac62278d4205c34a1a302b756ef3632185876cf)]:
  - @scalar/helpers@0.2.2
  - @scalar/themes@0.13.26
  - @scalar/json-magic@0.8.6
  - @scalar/object-utils@1.2.16
  - @scalar/code-highlight@0.2.1

## 0.22.2

### Patch Changes

- [#7506](https://github.com/scalar/scalar/pull/7506) [`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix: use caret version for `yaml`

- [#7489](https://github.com/scalar/scalar/pull/7489) [`21aa62e`](https://github.com/scalar/scalar/commit/21aa62e2ebdd262cb5aa53658c3b659736660722) Thanks [@amritk](https://github.com/amritk)! - feat: added new helpers for building client v2 requests

- Updated dependencies [[`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a), [`21aa62e`](https://github.com/scalar/scalar/commit/21aa62e2ebdd262cb5aa53658c3b659736660722), [`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a)]:
  - @scalar/json-magic@0.8.5
  - @scalar/helpers@0.2.1
  - @scalar/types@0.5.2
  - @scalar/object-utils@1.2.15
  - @scalar/openapi-upgrader@0.1.6
  - @scalar/snippetz@0.5.5

## 0.22.1

### Patch Changes

- [#7476](https://github.com/scalar/scalar/pull/7476) [`8842799`](https://github.com/scalar/scalar/commit/884279984b144082e85b699014e77ed71e9ae6a5) Thanks [@amritk](https://github.com/amritk)! - fix: remove slugging from path in operation id generation

- Updated dependencies [[`9ec8adf`](https://github.com/scalar/scalar/commit/9ec8adfea017333dee5bc3949104232f7dc57f4a)]:
  - @scalar/helpers@0.2.0
  - @scalar/json-magic@0.8.4
  - @scalar/object-utils@1.2.14

## 0.22.0

### Minor Changes

- [#7431](https://github.com/scalar/scalar/pull/7431) [`61c980c`](https://github.com/scalar/scalar/commit/61c980cebef219685a05f3a4cb1e379984922cd4) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: implememnt command palette

- [#7455](https://github.com/scalar/scalar/pull/7455) [`1bc2b45`](https://github.com/scalar/scalar/commit/1bc2b45b6eabd5c5045e77d67f59d202ab04d3fb) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: tabs support on the store

### Patch Changes

- [#7465](https://github.com/scalar/scalar/pull/7465) [`9342adc`](https://github.com/scalar/scalar/commit/9342adcd76e26a8e5eff75c1a2abee2c207b1487) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix: ensure `@scalar/workspace-store` consumers rely only on public exports

- [#7387](https://github.com/scalar/scalar/pull/7387) [`bfd814a`](https://github.com/scalar/scalar/commit/bfd814a4219660face190041cc4845182b56ab03) Thanks [@geoffgscott](https://github.com/geoffgscott)! - hotfix: patch exports from build tooling bug

- [#7416](https://github.com/scalar/scalar/pull/7416) [`86f028d`](https://github.com/scalar/scalar/commit/86f028deb0b456f923edd261f5f4b0fa9b616b7d) Thanks [@amritk](https://github.com/amritk)! - feat: add update method to client v2

- [#7414](https://github.com/scalar/scalar/pull/7414) [`294f9fc`](https://github.com/scalar/scalar/commit/294f9fc6cfd43cdab110deb1c851883509bc2b84) Thanks [@hanspagel](https://github.com/hanspagel)! - feat: show tags without operations

- Updated dependencies [[`781f264`](https://github.com/scalar/scalar/commit/781f2648bc758a251435c3a1e2b126a37f20e44f), [`fa361d2`](https://github.com/scalar/scalar/commit/fa361d2799e358d582fbb224a7b93d5b6e832c0e), [`e04879c`](https://github.com/scalar/scalar/commit/e04879c65602dfb65393876754f5344751b8953d), [`dd8e9dc`](https://github.com/scalar/scalar/commit/dd8e9dc118d3ae98180e2a93bd6ba11e982abbf8), [`bfd814a`](https://github.com/scalar/scalar/commit/bfd814a4219660face190041cc4845182b56ab03), [`781f264`](https://github.com/scalar/scalar/commit/781f2648bc758a251435c3a1e2b126a37f20e44f), [`35af6bf`](https://github.com/scalar/scalar/commit/35af6bfce4bc4ae3d0fc5783ea36e0165e964361), [`86f028d`](https://github.com/scalar/scalar/commit/86f028deb0b456f923edd261f5f4b0fa9b616b7d), [`af54a80`](https://github.com/scalar/scalar/commit/af54a80349269a4269a68f6a372f837177a3537c)]:
  - @scalar/code-highlight@0.2.1
  - @scalar/snippetz@0.5.4
  - @scalar/json-magic@0.8.3
  - @scalar/helpers@0.1.3
  - @scalar/types@0.5.1
  - @scalar/themes@0.13.25
  - @scalar/object-utils@1.2.13
  - @scalar/openapi-upgrader@0.1.5

## 0.21.0

### Minor Changes

- [#7310](https://github.com/scalar/scalar/pull/7310) [`6e1cb89`](https://github.com/scalar/scalar/commit/6e1cb89f71770601a5059449d68b409ffc87d332) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: workspace selector

- [#7366](https://github.com/scalar/scalar/pull/7366) [`1fbd809`](https://github.com/scalar/scalar/commit/1fbd809197bfaef77d7d3cb8cf7b657f397232a7) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: support sidebar rebuild and remove the 'default' tag concept

- [#7384](https://github.com/scalar/scalar/pull/7384) [`3ebff92`](https://github.com/scalar/scalar/commit/3ebff92f29d8d03d626d4000e8323528e794e755) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: collection and document settings and cookies page

### Patch Changes

- [#7392](https://github.com/scalar/scalar/pull/7392) [`d86f1d6`](https://github.com/scalar/scalar/commit/d86f1d6911ecbca70b011a2a0efb6d6e0eca59bb) Thanks [@amritk](https://github.com/amritk)! - fix: move away from wasm hashing algo

- [#7287](https://github.com/scalar/scalar/pull/7287) [`dd5c518`](https://github.com/scalar/scalar/commit/dd5c518a422dddc7948c0253861101cf741b6af0) Thanks [@DemonHa](https://github.com/DemonHa)! - fix: correctly update the parameter examples

- [#7329](https://github.com/scalar/scalar/pull/7329) [`4cda566`](https://github.com/scalar/scalar/commit/4cda566c2dc2cf306e4e3597e292ae1c2dadd78c) Thanks [@DemonHa](https://github.com/DemonHa)! - fix: setting nested proxies directly cases problems

- [#7365](https://github.com/scalar/scalar/pull/7365) [`4059e68`](https://github.com/scalar/scalar/commit/4059e68375d31ec0142a8019b385bc3ac82055fc) Thanks [@amritk](https://github.com/amritk)! - feat: added hot keys to client v2

- Updated dependencies [[`d86f1d6`](https://github.com/scalar/scalar/commit/d86f1d6911ecbca70b011a2a0efb6d6e0eca59bb), [`44aeef0`](https://github.com/scalar/scalar/commit/44aeef01073801165e339163462378b7b62ff68d), [`a68b1af`](https://github.com/scalar/scalar/commit/a68b1afc54b2aa95a224fee89c3266bffed57215), [`cbedfab`](https://github.com/scalar/scalar/commit/cbedfab576502069be27ceacbea145a917214e47), [`a68b1af`](https://github.com/scalar/scalar/commit/a68b1afc54b2aa95a224fee89c3266bffed57215), [`5a108fc`](https://github.com/scalar/scalar/commit/5a108fcbc52ae7957731c23689896ba353b83d3b), [`cded2d6`](https://github.com/scalar/scalar/commit/cded2d6c087418c3c44731d344d0827a87b78b74), [`cbedfab`](https://github.com/scalar/scalar/commit/cbedfab576502069be27ceacbea145a917214e47)]:
  - @scalar/json-magic@0.8.2
  - @scalar/helpers@0.1.2
  - @scalar/types@0.5.0
  - @scalar/object-utils@1.2.12
  - @scalar/themes@0.13.24
  - @scalar/openapi-upgrader@0.1.4
  - @scalar/snippetz@0.5.3
  - @scalar/code-highlight@0.2.0

## 0.20.0

### Minor Changes

- [#7279](https://github.com/scalar/scalar/pull/7279) [`7ccd035`](https://github.com/scalar/scalar/commit/7ccd0351de104f78ef9c6e16538753d302c50d47) Thanks [@DemonHa](https://github.com/DemonHa)! - feat(api-client): integrate new sidebar with v2 routing

### Patch Changes

- [#7305](https://github.com/scalar/scalar/pull/7305) [`c7a4690`](https://github.com/scalar/scalar/commit/c7a4690cec484ee16cee8dcba7ef5cb0fbb98133) Thanks [@amritk](https://github.com/amritk)! - chore: minor auth changes, code re-org, type safety

- Updated dependencies [[`9c9dbba`](https://github.com/scalar/scalar/commit/9c9dbbaa940667303f0ace59469fd78c2a741937), [`4bec1ba`](https://github.com/scalar/scalar/commit/4bec1ba332e919c4ee32dcfbfb07bd8ee42c4d74)]:
  - @scalar/helpers@0.1.1
  - @scalar/json-magic@0.8.1

## 0.19.0

### Minor Changes

- [#7251](https://github.com/scalar/scalar/pull/7251) [`d6154a2`](https://github.com/scalar/scalar/commit/d6154a24d97fc28977def486f99b2eeee52d268c) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: integrate operation page mutators

### Patch Changes

- [#7266](https://github.com/scalar/scalar/pull/7266) [`fddf294`](https://github.com/scalar/scalar/commit/fddf294b00dd8c9eb5c713c338f2ec6e3f62523d) Thanks [@amritk](https://github.com/amritk)! - fix: remove useage of crypto.subtle in all contexts

- Updated dependencies [[`c1ecd0c`](https://github.com/scalar/scalar/commit/c1ecd0c6096f3fbe2e3d8ad3794ea718bb6bce66), [`fddf294`](https://github.com/scalar/scalar/commit/fddf294b00dd8c9eb5c713c338f2ec6e3f62523d), [`c1ecd0c`](https://github.com/scalar/scalar/commit/c1ecd0c6096f3fbe2e3d8ad3794ea718bb6bce66)]:
  - @scalar/json-magic@0.8.0
  - @scalar/helpers@0.1.0

## 0.18.1

### Patch Changes

- [#7226](https://github.com/scalar/scalar/pull/7226) [`bffef40`](https://github.com/scalar/scalar/commit/bffef4092e40d12052f8538267af71bc99b7172f) Thanks [@amritk](https://github.com/amritk)! - feat: added overview page for client v2

## 0.18.0

### Minor Changes

- [#7185](https://github.com/scalar/scalar/pull/7185) [`6ca835e`](https://github.com/scalar/scalar/commit/6ca835e5afd3e8c603e073e7c83f2cdd961a0f69) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: add support for watch mode

- [#7129](https://github.com/scalar/scalar/pull/7129) [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a) Thanks [@geoffgscott](https://github.com/geoffgscott)! - feat: prefix generated navigation ids with the document name

- [#7136](https://github.com/scalar/scalar/pull/7136) [`75ad74c`](https://github.com/scalar/scalar/commit/75ad74c0eee10103b966ce4707e4823d819456a8) Thanks [@DemonHa](https://github.com/DemonHa)! - feat(workspace-store): persistence layer for client store

### Patch Changes

- [#7077](https://github.com/scalar/scalar/pull/7077) [`913607c`](https://github.com/scalar/scalar/commit/913607c7d67236f08f5369408f304440c6c42b22) Thanks [@hanspagel](https://github.com/hanspagel)! - fix: uses scalar proxy as the default

- [#7216](https://github.com/scalar/scalar/pull/7216) [`17817ad`](https://github.com/scalar/scalar/commit/17817addbca916c8d625a03335ae58be3a1c4e4b) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix(workspace-store): remove `async` from synchronous functions

- [#7159](https://github.com/scalar/scalar/pull/7159) [`c22fc4e`](https://github.com/scalar/scalar/commit/c22fc4e5acb49d648014a6100c724a5b33c59cde) Thanks [@amritk](https://github.com/amritk)! - feat: added new layouts for client v2

- [#7129](https://github.com/scalar/scalar/pull/7129) [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Simplify ApiReferences state management and migrate to new shared sidebar component. Eliminates the useSidebar and useNav hooks in favour of event bubbling and centralized state management in ApiReference.vue

- [#7186](https://github.com/scalar/scalar/pull/7186) [`c162bb6`](https://github.com/scalar/scalar/commit/c162bb64b86e698427c1fce36f6d8a2b789e094a) Thanks [@amritk](https://github.com/amritk)! - feat: hooking up event bus to the store

- [#7181](https://github.com/scalar/scalar/pull/7181) [`b64265b`](https://github.com/scalar/scalar/commit/b64265b3e8b447a4d1c6dafaca8135ef69545d98) Thanks [@amritk](https://github.com/amritk)! - chore: type updates to workspace bus

- [#7135](https://github.com/scalar/scalar/pull/7135) [`6aa06b0`](https://github.com/scalar/scalar/commit/6aa06b0f843ae3d8e6771e3c02ac11ee0043a4b1) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix: re-add request method and path to `scalar-open-client` event

- [#7143](https://github.com/scalar/scalar/pull/7143) [`81b0a7a`](https://github.com/scalar/scalar/commit/81b0a7a4245619f03161eae639dc5834b77432b6) Thanks [@amritk](https://github.com/amritk)! - fix: remove ignored parameters

- [#7227](https://github.com/scalar/scalar/pull/7227) [`704fa30`](https://github.com/scalar/scalar/commit/704fa302b2cdbb17b19ca2d742537ca163d58c1c) Thanks [@hwkr](https://github.com/hwkr)! - feat(sidebar): cleanup structure and improve text wrapping

- [#7184](https://github.com/scalar/scalar/pull/7184) [`33edbf2`](https://github.com/scalar/scalar/commit/33edbf2a2648eb72ae49e36dfd289d4d57dc18e0) Thanks [@geoffgscott](https://github.com/geoffgscott)! - move to event bus for internal events

- [#7167](https://github.com/scalar/scalar/pull/7167) [`4fe1643`](https://github.com/scalar/scalar/commit/4fe1643be51f76a8ebdfd75f5675337b8d43418e) Thanks [@amritk](https://github.com/amritk)! - feat: add new event bus to workspace store

- [#7094](https://github.com/scalar/scalar/pull/7094) [`eba18d0`](https://github.com/scalar/scalar/commit/eba18d06267a163a8f91396a66f817100ee59461) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Migrate to workspace store as primary source of truth.

- [#7213](https://github.com/scalar/scalar/pull/7213) [`43bc5e8`](https://github.com/scalar/scalar/commit/43bc5e8b90dc0edf7176d0ddfc64bf3212494458) Thanks [@DemonHa](https://github.com/DemonHa)! - fix: proxy performance issue because of multiple proxies

- Updated dependencies [[`eb022f2`](https://github.com/scalar/scalar/commit/eb022f2c8f93c84a04c0093fefe8a1e05d6ec80d), [`11a6e64`](https://github.com/scalar/scalar/commit/11a6e6405d4f30f001a16d6afda4d2b759c0ed09), [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a), [`134ff5f`](https://github.com/scalar/scalar/commit/134ff5f32aa6842696bf146c7e0817b1662905eb), [`6ca835e`](https://github.com/scalar/scalar/commit/6ca835e5afd3e8c603e073e7c83f2cdd961a0f69), [`da7ab2f`](https://github.com/scalar/scalar/commit/da7ab2fb2e422b9cec2de5faba58ea83dd774808), [`eba18d0`](https://github.com/scalar/scalar/commit/eba18d06267a163a8f91396a66f817100ee59461), [`43bc5e8`](https://github.com/scalar/scalar/commit/43bc5e8b90dc0edf7176d0ddfc64bf3212494458)]:
  - @scalar/types@0.4.0
  - @scalar/openapi-upgrader@0.1.4
  - @scalar/helpers@0.0.13
  - @scalar/json-magic@0.7.0
  - @scalar/snippetz@0.5.2
  - @scalar/themes@0.13.23
  - @scalar/code-highlight@0.2.0

## 0.17.1

### Patch Changes

- 1335923: fix: do not upgrade the document for the original documents
- 07397c8: fix(workspace-store): use `measureSync` for `mergeObjects` metric
- Updated dependencies [3f6d0b9]
- Updated dependencies [2089748]
- Updated dependencies [f3e17d8]
- Updated dependencies [8a7fb2a]
  - @scalar/helpers@0.0.12
  - @scalar/json-magic@0.6.1
  - @scalar/types@0.3.2
  - @scalar/openapi-upgrader@0.1.3
  - @scalar/snippetz@0.5.1
  - @scalar/code-highlight@0.2.0

## 0.17.0

### Minor Changes

- 63ff417: feat: sidebar package
- 5d99cad: feat: operation block

### Patch Changes

- Updated dependencies [e0cdd9a]
- Updated dependencies [1e01464]
  - @scalar/snippetz@0.5.0
  - @scalar/types@0.3.1
  - @scalar/openapi-upgrader@0.1.2
  - @scalar/code-highlight@0.2.0

## 0.16.2

### Patch Changes

- Updated dependencies [008a0f3]
  - @scalar/types@0.3.0
  - @scalar/openapi-upgrader@0.1.1
  - @scalar/snippetz@0.4.11
  - @scalar/code-highlight@0.2.0

## 0.16.1

### Patch Changes

- 2b98503: fix: configuration handling and server list reset on document replacement
- c6736fd: chore: hard code openapi types
- Updated dependencies [4951456]
  - @scalar/json-magic@0.6.0

## 0.16.0

### Minor Changes

- db5b649: feat: auth selector block

### Patch Changes

- b858566: chore: moved api client code sample to new store
- Updated dependencies [6462733]
  - @scalar/json-magic@0.5.2

## 0.15.8

### Patch Changes

- 7be091c: fix: schema format does not allow custom formats
- f0f28a9: feat: migrate sidebar to consume from the new store
- db966b4: chore: remove other string schema formats
- Updated dependencies [41d8600]
  - @scalar/json-magic@0.5.1

## 0.15.7

### Patch Changes

- a1f865c: refactor: use @scalar/openapi-upgrader
- dcf50ef: refactor: move escapeJsonPointer to @scalar/json-magic
- Updated dependencies [6221e4a]
- Updated dependencies [005fba9]
- Updated dependencies [fe46413]
- Updated dependencies [0aa6d26]
- Updated dependencies [2d612e4]
- Updated dependencies [dcf50ef]
- Updated dependencies [02085ef]
  - @scalar/openapi-upgrader@0.1.0
  - @scalar/types@0.2.16
  - @scalar/json-magic@0.5.0
  - @scalar/code-highlight@0.2.0
  - @scalar/snippetz@0.4.10

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
