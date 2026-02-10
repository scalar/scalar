# @scalar/aspire

## 0.8.45

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.15**

## 0.8.44

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.14**
  - [#8025](https://github.com/scalar/scalar/pull/8025): fix: use flex-start instead of start for better browser support
  - [#8056](https://github.com/scalar/scalar/pull/8056): fix: hideModels not applying correctly

## 0.8.43

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.13**

## 0.8.42

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.12**
  - [#8035](https://github.com/scalar/scalar/pull/8035): fix: correctly resolve and validate refs

## 0.8.41

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.11**

## 0.8.40

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.10**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

- **@scalar/dotnet-shared@0.1.1**

## 0.8.39

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.9**

## 0.8.38

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.8**
  - [#8018](https://github.com/scalar/scalar/pull/8018): fix(agent): clickout close events

## 0.8.37

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.7**
  - [#8017](https://github.com/scalar/scalar/pull/8017): fix: remove agent tooltip

## 0.8.36

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.6**
  - [#8010](https://github.com/scalar/scalar/pull/8010): fix: use proper computed property

## 0.8.35

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.5**
  - [#8007](https://github.com/scalar/scalar/pull/8007): fix: use correct composition data for oneOf property
  - [#8006](https://github.com/scalar/scalar/pull/8006): fix(agent): safari fieldsizing fallback

## 0.8.34

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.4**
  - [#8000](https://github.com/scalar/scalar/pull/8000): fix(agent): change enabled flag to disabled
  - [#7979](https://github.com/scalar/scalar/pull/7979): fix: prevent re-rendering of already-ready items in lazy-bus queue

    Restores the readyQueue guard in addToPendingQueue to prevent items that are
    already rendered from being re-added to the pending queue. This fixes a
    performance regression introduced in #7497 where large API specs would
    experience severe slowdowns due to items being reprocessed on every scroll
    or interaction.

    The fix maintains the callback functionality from #7497 by still allowing
    items to be added to the priority queue (for callback triggering), but
    processQueue now skips adding items that are already in readyQueue.

  - [#8002](https://github.com/scalar/scalar/pull/8002): feat(agent): add inline agent chat
  - [#7985](https://github.com/scalar/scalar/pull/7985): fix(api-reference): set fallback for mobile header sticky offset
  - [#7784](https://github.com/scalar/scalar/pull/7784): fix: resolve oauth2 relative URLs against relative server URLs
  - [#7995](https://github.com/scalar/scalar/pull/7995): feat: enable/disable agent scalar
  - [#7977](https://github.com/scalar/scalar/pull/7977): fix(api-reference): apply sidebar width variable

- **@scalar/dotnet-shared@0.1.1**

## 0.8.33

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.3**

## 0.8.32

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.2**

## 0.8.31

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.1**
  - [#7961](https://github.com/scalar/scalar/pull/7961): fix(agent): make agent ui responsive
  - [#7967](https://github.com/scalar/scalar/pull/7967): fix(agent): remove ui jump on uploading document

## 0.8.30

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost
  - [#7932](https://github.com/scalar/scalar/pull/7932): feat: use getExample in the references responses
  - [#7931](https://github.com/scalar/scalar/pull/7931): fix(api-reference): account for custom header and sidebar

- **@scalar/dotnet-shared@0.1.1**

## 0.8.29

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.17**

## 0.8.28

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.16**
  - [#7901](https://github.com/scalar/scalar/pull/7901): fix(api-reference): don't flex schema enum label

## 0.8.27

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.15**
  - [#7894](https://github.com/scalar/scalar/pull/7894): fix: the import and export of redirect to proxy

- **@scalar/dotnet-shared@0.1.1**

## 0.8.26

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.14**

## 0.8.25

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.13**

- **@scalar/dotnet-shared@0.1.1**

## 0.8.24

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.12**
  - [#7850](https://github.com/scalar/scalar/pull/7850): fix: remove unused workspace config
  - [#7819](https://github.com/scalar/scalar/pull/7819): feat: hide responses without content

## 0.8.23

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.11**

- **@scalar/dotnet-shared@0.1.1**

## 0.8.22

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.10**
  - [#7820](https://github.com/scalar/scalar/pull/7820): fix: correctly restore the auth from persistance
  - [#7814](https://github.com/scalar/scalar/pull/7814): fix: additional properties generate invalid example

## 0.8.21

### Patch Changes

- [#7810](https://github.com/scalar/scalar/pull/7810): docs: update documentation domain

#### Updated Dependencies

- **@scalar/api-reference@1.43.9**
  - [#7781](https://github.com/scalar/scalar/pull/7781): fix: remove unused dependencies
    - `@floating-ui/vue`
    - `@scalar/json-magic`
    - `@scalar/object-utils`
    - `@scalar/openapi-upgrader`
    - `js-base64`
    - `type-fest`
    - `zod`

  - [#7778](https://github.com/scalar/scalar/pull/7778): fix: do not persist auth when the option is off
  - [#7802](https://github.com/scalar/scalar/pull/7802): fix: can not search in classic layout
  - [#7810](https://github.com/scalar/scalar/pull/7810): docs: update documentation domain

## 0.8.20

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.8**

## 0.8.19

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.7**
  - [#7751](https://github.com/scalar/scalar/pull/7751): fix: auth persistence

- **@scalar/dotnet-shared@0.1.1**

## 0.8.18

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.6**
  - [#7761](https://github.com/scalar/scalar/pull/7761): fix: update the hooks when the configuration changes

## 0.8.17

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.5**
  - [#7745](https://github.com/scalar/scalar/pull/7745): fix: add nested array support to references
  - [#7752](https://github.com/scalar/scalar/pull/7752): Export Auth component
  - [#7746](https://github.com/scalar/scalar/pull/7746): fix: allow trailing slashes in path
  - [#7742](https://github.com/scalar/scalar/pull/7742): feat: export auth component + proxy fix

## 0.8.16

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.4**
  - [#7678](https://github.com/scalar/scalar/pull/7678): chore: add test for tagSorter
  - [#7693](https://github.com/scalar/scalar/pull/7693): feat: markdown default line height
  - [#7730](https://github.com/scalar/scalar/pull/7730): fix: ensure path params work on the client

- **@scalar/dotnet-shared@0.1.1**

## 0.8.15

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.3**

## 0.8.14

### Patch Changes

- [#7698](https://github.com/scalar/scalar/pull/7698): feat: update Docker Hub description

#### Updated Dependencies

- **@scalar/api-reference@1.43.2**

## 0.8.13

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.1**
  - [#7673](https://github.com/scalar/scalar/pull/7673): fix: pass in reactive auth config to client

## 0.8.12

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.0**
  - [#7661](https://github.com/scalar/scalar/pull/7661): feat: api client v2 integration

- **@scalar/dotnet-shared@0.1.1**

## 0.8.11

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.42.0**
  - [#7605](https://github.com/scalar/scalar/pull/7605): feat: api client v2 integration

- **@scalar/dotnet-shared@0.1.1**

## 0.8.10

### Patch Changes

#### Updated Dependencies

- **@scalar/dotnet-shared@0.1.1**

- **@scalar/api-reference@1.41.1**

## 0.8.9

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.41.0**
  - [#7633](https://github.com/scalar/scalar/pull/7633): feat(api-reference): support rendering custom components for paths
  - [#7583](https://github.com/scalar/scalar/pull/7583): feat: show empty schema message for object with no properties
  - [#7597](https://github.com/scalar/scalar/pull/7597): fix: show more button appears even if tags don't have any children

## 0.8.8

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.9**

## 0.8.7

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.8**
  - [#7577](https://github.com/scalar/scalar/pull/7577): fix(api-reference): add padding to card intro in callbacks
  - [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

- **@scalar/dotnet-shared@0.1.1**

## 0.8.6

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.7**
  - [#7575](https://github.com/scalar/scalar/pull/7575): feat: add support for object examples + hide body when empty
  - [#7550](https://github.com/scalar/scalar/pull/7550): Fix content width in mobile layout

## 0.8.5

### Patch Changes

- [#7511](https://github.com/scalar/scalar/pull/7511) [`54096c2`](https://github.com/scalar/scalar/commit/54096c24e1e5a434dd99f20a7c80ec1c4bfb27d6) Thanks [@xC0dex](https://github.com/xC0dex)! - fix: enum serialization

- Updated dependencies []:
  - @scalar/api-reference@1.40.6
  - @scalar/dotnet-shared@0.1.1

## 0.8.4

### Patch Changes

- Updated dependencies []:
  - @scalar/api-reference@1.40.5

## 0.8.3

### Patch Changes

- Updated dependencies [[`2b46ee2`](https://github.com/scalar/scalar/commit/2b46ee2773023ca348e8691e1123970ca58090e5)]:
  - @scalar/api-reference@1.40.4

## 0.8.2

### Patch Changes

- Updated dependencies [[`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a)]:
  - @scalar/api-reference@1.40.3
  - @scalar/dotnet-shared@0.1.1

## 0.8.1

### Patch Changes

- Updated dependencies [[`08d137a`](https://github.com/scalar/scalar/commit/08d137a1d9172bd51a9a401fb0101ddf90d3b1a8), [`f446bbc`](https://github.com/scalar/scalar/commit/f446bbc0b8aec7fa7314603fd48471f06c1318d5), [`b77fa53`](https://github.com/scalar/scalar/commit/b77fa5356a1ad51766b6dd6b20e10c408924a8ff)]:
  - @scalar/api-reference@1.40.2

## 0.8.0

### Minor Changes

- [#7433](https://github.com/scalar/scalar/pull/7433) [`d9103c2`](https://github.com/scalar/scalar/commit/d9103c209bde14f3b39a24afb956f6585fc90f81) Thanks [@xC0dex](https://github.com/xC0dex)! - feat: support .NET 10

### Patch Changes

- Updated dependencies [[`9342adc`](https://github.com/scalar/scalar/commit/9342adcd76e26a8e5eff75c1a2abee2c207b1487), [`62b5210`](https://github.com/scalar/scalar/commit/62b521092bafeb8e83e79222e13378c4a19defc8), [`425d8e1`](https://github.com/scalar/scalar/commit/425d8e1aaac26a6ec9a781431e1076ee4db3d027), [`294f9fc`](https://github.com/scalar/scalar/commit/294f9fc6cfd43cdab110deb1c851883509bc2b84)]:
  - @scalar/api-reference@1.40.1
  - @scalar/dotnet-shared@0.1.1

## 0.7.4

### Patch Changes

- [#7313](https://github.com/scalar/scalar/pull/7313) [`64a33a4`](https://github.com/scalar/scalar/commit/64a33a4a08755f48e4839a7e7e20187f14de8ab2) Thanks [@xC0dex](https://github.com/xC0dex)! - feat: add support for showDeveloperTools configuration

- [#7312](https://github.com/scalar/scalar/pull/7312) [`fe58c16`](https://github.com/scalar/scalar/commit/fe58c16460a7ee46aa8bbc4a74211abcfdb66509) Thanks [@xC0dex](https://github.com/xC0dex)! - feat: add telemetry option

- Updated dependencies [[`44aeef0`](https://github.com/scalar/scalar/commit/44aeef01073801165e339163462378b7b62ff68d), [`5a108fc`](https://github.com/scalar/scalar/commit/5a108fcbc52ae7957731c23689896ba353b83d3b), [`cded2d6`](https://github.com/scalar/scalar/commit/cded2d6c087418c3c44731d344d0827a87b78b74), [`64a33a4`](https://github.com/scalar/scalar/commit/64a33a4a08755f48e4839a7e7e20187f14de8ab2), [`3ebff92`](https://github.com/scalar/scalar/commit/3ebff92f29d8d03d626d4000e8323528e794e755), [`fe58c16`](https://github.com/scalar/scalar/commit/fe58c16460a7ee46aa8bbc4a74211abcfdb66509)]:
  - @scalar/api-reference@1.40.0
  - @scalar/dotnet-shared@0.1.1

## 0.7.3

### Patch Changes

- Updated dependencies [[`4bec1ba`](https://github.com/scalar/scalar/commit/4bec1ba332e919c4ee32dcfbfb07bd8ee42c4d74), [`7859105`](https://github.com/scalar/scalar/commit/7859105f857633c8f3c945d67a21f7225844ed12)]:
  - @scalar/api-reference@1.39.3

## 0.7.2

### Patch Changes

- Updated dependencies [[`2377b76`](https://github.com/scalar/scalar/commit/2377b76d050f8de70037b17a32d0dd1181d3311d)]:
  - @scalar/api-reference@1.39.2

## 0.7.1

### Patch Changes

- [#7254](https://github.com/scalar/scalar/pull/7254) [`0f82b22`](https://github.com/scalar/scalar/commit/0f82b223dd9d5314d2a26266afe2852996dc1594) Thanks [@xC0dex](https://github.com/xC0dex)! - ci: now publish correctly

- Updated dependencies [[`1d987e9`](https://github.com/scalar/scalar/commit/1d987e9977b145b2657bc5f8d6a67d2add958826), [`eb96d5c`](https://github.com/scalar/scalar/commit/eb96d5c1dfabde0681552ffc6ab77952c47775bb)]:
  - @scalar/api-reference@1.39.1

## 0.7.0

### Minor Changes

- [#7096](https://github.com/scalar/scalar/pull/7096) [`f754dc1`](https://github.com/scalar/scalar/commit/f754dc1bff8dcbe04748dd103d1ed9763a977503) Thanks [@xC0dex](https://github.com/xC0dex)! - feat: use shared .NET code

### Patch Changes

- Updated dependencies [[`3ecf139`](https://github.com/scalar/scalar/commit/3ecf139d1a8e7a4dd49d471fa5f74c572442ae35), [`eb022f2`](https://github.com/scalar/scalar/commit/eb022f2c8f93c84a04c0093fefe8a1e05d6ec80d), [`6f60b8d`](https://github.com/scalar/scalar/commit/6f60b8dd1cf17185ea56b1f3bcbe811acc14010b), [`23a5628`](https://github.com/scalar/scalar/commit/23a5628e73d43739e3786703c0fe539c19697733), [`6aa06b0`](https://github.com/scalar/scalar/commit/6aa06b0f843ae3d8e6771e3c02ac11ee0043a4b1), [`f754dc1`](https://github.com/scalar/scalar/commit/f754dc1bff8dcbe04748dd103d1ed9763a977503), [`a796162`](https://github.com/scalar/scalar/commit/a79616220d5deb0117c2d6d191b465b36ba6ccd0), [`0d9c945`](https://github.com/scalar/scalar/commit/0d9c945a696ea8b826d86f7b48ec6de4d85e64f0), [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a), [`d9e911a`](https://github.com/scalar/scalar/commit/d9e911aad3a7fe25cc173bfc7865d990f30880c6), [`81b0a7a`](https://github.com/scalar/scalar/commit/81b0a7a4245619f03161eae639dc5834b77432b6), [`8a5a6a0`](https://github.com/scalar/scalar/commit/8a5a6a052cc05b0902b05052c80cc429ebc5a730), [`33edbf2`](https://github.com/scalar/scalar/commit/33edbf2a2648eb72ae49e36dfd289d4d57dc18e0), [`eba18d0`](https://github.com/scalar/scalar/commit/eba18d06267a163a8f91396a66f817100ee59461), [`0d9c945`](https://github.com/scalar/scalar/commit/0d9c945a696ea8b826d86f7b48ec6de4d85e64f0)]:
  - @scalar/api-reference@1.39.0
  - @scalar/dotnet-shared@0.1.0

## 0.6.0

### Minor Changes

- 50db06d: feat: auto generated ScalarClient and ScalarTarget enums
- a0ba899: feat: all new fluent extension methods

### Patch Changes

- Updated dependencies [ef98f35]
- Updated dependencies [f8efecd]
- Updated dependencies [9c65f51]
  - @scalar/api-reference@1.38.1

## 0.5.4

### Patch Changes

- cde3c0f: feat: support showOperationId configuration
- Updated dependencies [debdcf6]
- Updated dependencies [a747da6]
- Updated dependencies [1e01464]
- Updated dependencies [90d54b6]
  - @scalar/api-reference@1.38.0

## 0.5.3

### Patch Changes

- Updated dependencies [008a0f3]
- Updated dependencies [f833196]
  - @scalar/api-reference@1.37.0

## 0.5.2

### Patch Changes

- Updated dependencies [894343a]
- Updated dependencies [9b7f5e4]
- Updated dependencies [8ad6af0]
- Updated dependencies [395e822]
- Updated dependencies [2b98503]
- Updated dependencies [c6736fd]
- Updated dependencies [5e268a4]
- Updated dependencies [e8915c6]
- Updated dependencies [a46a700]
  - @scalar/api-reference@1.36.3

## 0.5.1

### Patch Changes

- Updated dependencies [0b3c6fa]
  - @scalar/api-reference@1.36.2

## 0.5.0

### Minor Changes

- f6883f5: feat: rename standalone.js to scalar.js

### Patch Changes

- Updated dependencies [77337d3]
  - @scalar/api-reference@1.36.1

## 0.4.11

### Patch Changes

- Updated dependencies [2362df9]
- Updated dependencies [f0f28a9]
- Updated dependencies [003bb98]
- Updated dependencies [dd98fdc]
  - @scalar/api-reference@1.36.0

## 0.4.10

### Patch Changes

- 5377b1b: feat: add direct download type
- Updated dependencies [6e92423]
- Updated dependencies [005fba9]
- Updated dependencies [724052c]
- Updated dependencies [a1f865c]
- Updated dependencies [6ee88cd]
- Updated dependencies [b5321f1]
- Updated dependencies [dcf50ef]
  - @scalar/api-reference@1.35.7

## 0.4.9

### Patch Changes

- 422f01d: feat: add SchemaPropertyOrder and OrderRequiredPropertiesFirst configuration support
- Updated dependencies [b6a59bd]
- Updated dependencies [8f2a2f2]
  - @scalar/api-reference@1.35.6

## 0.4.8

### Patch Changes

- Updated dependencies [4e7e8a9]
  - @scalar/api-reference@1.35.5

## 0.4.7

### Patch Changes

- @scalar/api-reference@1.35.4

## 0.4.6

### Patch Changes

- Updated dependencies [821717b]
- Updated dependencies [821717b]
- Updated dependencies [425a954]
  - @scalar/api-reference@1.35.3

## 0.4.5

### Patch Changes

- @scalar/api-reference@1.35.2

## 0.4.4

### Patch Changes

- @scalar/api-reference@1.35.1

## 0.4.3

### Patch Changes

- 7267103: feat: add default favicon
- 792c937: Configurable option for sidebar to show method path instead of method summary.
- d1c8441: feat: support default OpenAPI document
- 3473e08: fix: performance issues on script load
- Updated dependencies [714b197]
- Updated dependencies [792c937]
- Updated dependencies [f918582]
- Updated dependencies [549eb02]
- Updated dependencies [3473e08]
- Updated dependencies [a6ae22a]
- Updated dependencies [94e4762]
- Updated dependencies [d5c1d0c]
- Updated dependencies [2077f01]
- Updated dependencies [0e747c7]
- Updated dependencies [697f1d0]
- Updated dependencies [5ad329e]
  - @scalar/api-reference@1.35.0

## 0.4.2

### Patch Changes

- Updated dependencies [50032be]
- Updated dependencies [88385b1]
  - @scalar/api-reference@1.34.6

## 0.4.1

### Patch Changes

- Updated dependencies [86d29c1]
  - @scalar/api-reference@1.34.5

## 0.4.0

### Minor Changes

- e4279e4: feat: support HTTPS
- 508c04a: feat: use environment callback instead of hooks

### Patch Changes

- 2f05f7d: feat: support multiple scalar resources
- a995f15: feat: support async configuration
- Updated dependencies [bbef120]
- Updated dependencies [24883ab]
- Updated dependencies [a1429ca]
- Updated dependencies [e499aee]
- Updated dependencies [845e850]
- Updated dependencies [66b18fc]
- Updated dependencies [6eb7c4f]
- Updated dependencies [4e06829]
- Updated dependencies [5f022b5]
- Updated dependencies [2b89e6f]
- Updated dependencies [6a88108]
- Updated dependencies [c838a3f]
- Updated dependencies [75d84ed]
- Updated dependencies [929df42]
- Updated dependencies [0804cfc]
  - @scalar/api-reference@1.34.4

## 0.3.3

### Patch Changes

- b023f39: fix: added missing clients and targets
- Updated dependencies [97f199a]
- Updated dependencies [0d502cb]
- Updated dependencies [3de82ac]
- Updated dependencies [58b9321]
- Updated dependencies [2c74892]
  - @scalar/api-reference@1.34.3

## 0.3.2

### Patch Changes

- Updated dependencies [83625c6]
  - @scalar/api-reference@1.34.2

## 0.3.1

### Patch Changes

- Updated dependencies [4d05839]
  - @scalar/api-reference@1.34.1

## 0.3.0

### Minor Changes

- ee56c38: chore: support aspire 9.4.0

### Patch Changes

- Updated dependencies [f838a47]
- Updated dependencies [94b5d0a]
- Updated dependencies [0f4a784]
- Updated dependencies [5301a80]
- Updated dependencies [8113963]
- Updated dependencies [2888e18]
- Updated dependencies [fb0c254]
  - @scalar/api-reference@1.34.0

## 0.2.0

### Minor Changes

- d793e38: feat: support publish of scalar aspire
- 1228311: feat: allow publish and service discovery

### Patch Changes

- ccf875a: feat: support x-scalar-credentials-location extension
- Updated dependencies [14a737c]
- Updated dependencies [628d44c]
- Updated dependencies [092626d]
- Updated dependencies [9c157f1]
- Updated dependencies [ce9b7ff]
- Updated dependencies [f65f1fc]
- Updated dependencies [4ea9dab]
- Updated dependencies [8d24b91]
- Updated dependencies [7031d9c]
- Updated dependencies [1913f97]
- Updated dependencies [0f41af6]
- Updated dependencies [2e2f50a]
- Updated dependencies [956a2d1]
- Updated dependencies [7ee81f4]
- Updated dependencies [94d6d0c]
- Updated dependencies [d29c455]
- Updated dependencies [319fb56]
- Updated dependencies [24c9d4c]
- Updated dependencies [c0d6793]
- Updated dependencies [6953c9f]
- Updated dependencies [72924f6]
- Updated dependencies [6f12d2e]
- Updated dependencies [8795629]
- Updated dependencies [515162c]
- Updated dependencies [f3d0216]
- Updated dependencies [7555e44]
- Updated dependencies [af22451]
- Updated dependencies [a5534e6]
- Updated dependencies [6b6c72c]
  - @scalar/api-reference@1.33.0

## 0.1.11

### Patch Changes

- 2194535: fix: docker build
- Updated dependencies [3eb8171]
- Updated dependencies [60c7bef]
- Updated dependencies [716a83a]
- Updated dependencies [9b4417b]
- Updated dependencies [2ace00b]
- Updated dependencies [fb62e1b]
- Updated dependencies [cac47ea]
- Updated dependencies [2ace00b]
  - @scalar/api-reference@1.32.10

## 0.1.10

### Patch Changes

- Updated dependencies [8c6f6fe]
  - @scalar/api-reference@1.32.9

## 0.1.9

### Patch Changes

- 591562f: feat: add support for x-scalar-security-body extension
- Updated dependencies [a04cc15]
- Updated dependencies [b5bcce7]
- Updated dependencies [97721b5]
- Updated dependencies [9978a16]
- Updated dependencies [8a67f4f]
  - @scalar/api-reference@1.32.8

## 0.1.8

### Patch Changes

- db64eac: ci: improved ci build
- Updated dependencies [a85480e]
- Updated dependencies [1a6c0a4]
- Updated dependencies [9be7ca9]
- Updated dependencies [c2ff19e]
- Updated dependencies [7325520]
- Updated dependencies [134c455]
  - @scalar/api-reference@1.32.7

## 0.1.7

### Patch Changes

- 9daf5da: feat: support x-tokenName extension
- Updated dependencies [6a7509a]
- Updated dependencies [80acf84]
  - @scalar/api-reference@1.32.6

## 0.1.6

### Patch Changes

- Updated dependencies [5de7e25]
  - @scalar/api-reference@1.32.5

## 0.1.5

### Patch Changes

- ede220d: feat: add support for multi-platform docker build
- Updated dependencies [b420f18]
- Updated dependencies [e8f1856]
- Updated dependencies [cacadd5]
- Updated dependencies [ad2e3e6]
- Updated dependencies [cacadd5]
- Updated dependencies [495588a]
- Updated dependencies [67d8b9a]
- Updated dependencies [93b1140]
- Updated dependencies [4295067]
- Updated dependencies [8457fde]
- Updated dependencies [2dc9f8d]
- Updated dependencies [cacadd5]
- Updated dependencies [0474f02]
- Updated dependencies [7ea11c1]
- Updated dependencies [bd3b6d4]
- Updated dependencies [3fdc2f2]
  - @scalar/api-reference@1.32.4

## 0.1.4

### Patch Changes

- Updated dependencies [08e1e84]
  - @scalar/api-reference@1.32.3

## 0.1.3

### Patch Changes

- 8d63f89: chore: minor improvements
- Updated dependencies [4e0caa1]
- Updated dependencies [4d29320]
- Updated dependencies [2d7f995]
  - @scalar/api-reference@1.32.2

## 0.1.2

### Patch Changes

- Updated dependencies [98ff011]
  - @scalar/api-reference@1.32.1

## 0.1.1

### Patch Changes

- 500d079: docs: improve documentation
- Updated dependencies [533469b]
- Updated dependencies [a70bcce]
- Updated dependencies [6ac48c8]
- Updated dependencies [8d8e427]
- Updated dependencies [b7ff99a]
- Updated dependencies [fed71e0]
- Updated dependencies [a983428]
- Updated dependencies [3393c83]
  - @scalar/api-reference@1.32.0

## 0.1.0

### Minor Changes

- a974b26: feat(Scalar.Aspire): initial .NET Aspire integration

### Patch Changes

- Updated dependencies [c907685]
- Updated dependencies [cd7e1b1]
- Updated dependencies [3abe906]
- Updated dependencies [42bc960]
- Updated dependencies [1468280]
  - @scalar/api-reference@1.31.18
