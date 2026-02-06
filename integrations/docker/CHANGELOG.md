# @scalarapi/docker-api-reference

## 0.4.54

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.15**

## 0.4.53

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.14**
  - [#8025](https://github.com/scalar/scalar/pull/8025): fix: use flex-start instead of start for better browser support
  - [#8056](https://github.com/scalar/scalar/pull/8056): fix: hideModels not applying correctly

## 0.4.52

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.13**

## 0.4.51

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.12**
  - [#8035](https://github.com/scalar/scalar/pull/8035): fix: correctly resolve and validate refs

## 0.4.50

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.11**

## 0.4.49

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.10**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

## 0.4.48

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.9**

## 0.4.47

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.8**
  - [#8018](https://github.com/scalar/scalar/pull/8018): fix(agent): clickout close events

## 0.4.46

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.7**
  - [#8017](https://github.com/scalar/scalar/pull/8017): fix: remove agent tooltip

## 0.4.45

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.6**
  - [#8010](https://github.com/scalar/scalar/pull/8010): fix: use proper computed property

## 0.4.44

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.5**
  - [#8007](https://github.com/scalar/scalar/pull/8007): fix: use correct composition data for oneOf property
  - [#8006](https://github.com/scalar/scalar/pull/8006): fix(agent): safari fieldsizing fallback

## 0.4.43

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

## 0.4.42

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.3**

## 0.4.41

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.2**

## 0.4.40

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.1**
  - [#7961](https://github.com/scalar/scalar/pull/7961): fix(agent): make agent ui responsive
  - [#7967](https://github.com/scalar/scalar/pull/7967): fix(agent): remove ui jump on uploading document

## 0.4.39

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost
  - [#7932](https://github.com/scalar/scalar/pull/7932): feat: use getExample in the references responses
  - [#7931](https://github.com/scalar/scalar/pull/7931): fix(api-reference): account for custom header and sidebar

## 0.4.38

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.17**

## 0.4.37

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.16**
  - [#7901](https://github.com/scalar/scalar/pull/7901): fix(api-reference): don't flex schema enum label

## 0.4.36

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.15**
  - [#7894](https://github.com/scalar/scalar/pull/7894): fix: the import and export of redirect to proxy

## 0.4.35

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.14**

## 0.4.34

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.13**

## 0.4.33

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.12**
  - [#7850](https://github.com/scalar/scalar/pull/7850): fix: remove unused workspace config
  - [#7819](https://github.com/scalar/scalar/pull/7819): feat: hide responses without content

## 0.4.32

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.11**

## 0.4.31

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.10**
  - [#7820](https://github.com/scalar/scalar/pull/7820): fix: correctly restore the auth from persistance
  - [#7814](https://github.com/scalar/scalar/pull/7814): fix: additional properties generate invalid example

## 0.4.30

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

## 0.4.29

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.8**

## 0.4.28

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.7**
  - [#7751](https://github.com/scalar/scalar/pull/7751): fix: auth persistence

## 0.4.27

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.6**
  - [#7761](https://github.com/scalar/scalar/pull/7761): fix: update the hooks when the configuration changes

## 0.4.26

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.5**
  - [#7745](https://github.com/scalar/scalar/pull/7745): fix: add nested array support to references
  - [#7752](https://github.com/scalar/scalar/pull/7752): Export Auth component
  - [#7746](https://github.com/scalar/scalar/pull/7746): fix: allow trailing slashes in path
  - [#7742](https://github.com/scalar/scalar/pull/7742): feat: export auth component + proxy fix

## 0.4.25

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.4**
  - [#7678](https://github.com/scalar/scalar/pull/7678): chore: add test for tagSorter
  - [#7693](https://github.com/scalar/scalar/pull/7693): feat: markdown default line height
  - [#7730](https://github.com/scalar/scalar/pull/7730): fix: ensure path params work on the client

## 0.4.24

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.3**

## 0.4.23

### Patch Changes

- [#7698](https://github.com/scalar/scalar/pull/7698): feat: update Docker Hub description

#### Updated Dependencies

- **@scalar/api-reference@1.43.2**

## 0.4.22

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.1**
  - [#7673](https://github.com/scalar/scalar/pull/7673): fix: pass in reactive auth config to client

## 0.4.21

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.0**
  - [#7661](https://github.com/scalar/scalar/pull/7661): feat: api client v2 integration

## 0.4.20

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.42.0**
  - [#7605](https://github.com/scalar/scalar/pull/7605): feat: api client v2 integration

## 0.4.19

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.41.1**

## 0.4.18

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.41.0**
  - [#7633](https://github.com/scalar/scalar/pull/7633): feat(api-reference): support rendering custom components for paths
  - [#7583](https://github.com/scalar/scalar/pull/7583): feat: show empty schema message for object with no properties
  - [#7597](https://github.com/scalar/scalar/pull/7597): fix: show more button appears even if tags don't have any children

## 0.4.17

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.9**

## 0.4.16

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.8**
  - [#7577](https://github.com/scalar/scalar/pull/7577): fix(api-reference): add padding to card intro in callbacks
  - [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

## 0.4.15

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.7**
  - [#7575](https://github.com/scalar/scalar/pull/7575): feat: add support for object examples + hide body when empty
  - [#7550](https://github.com/scalar/scalar/pull/7550): Fix content width in mobile layout

## 0.4.14

### Patch Changes

- Updated dependencies []:
  - @scalar/api-reference@1.40.6

## 0.4.13

### Patch Changes

- Updated dependencies []:
  - @scalar/api-reference@1.40.5

## 0.4.12

### Patch Changes

- Updated dependencies [[`2b46ee2`](https://github.com/scalar/scalar/commit/2b46ee2773023ca348e8691e1123970ca58090e5)]:
  - @scalar/api-reference@1.40.4

## 0.4.11

### Patch Changes

- Updated dependencies [[`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a)]:
  - @scalar/api-reference@1.40.3

## 0.4.10

### Patch Changes

- Updated dependencies [[`08d137a`](https://github.com/scalar/scalar/commit/08d137a1d9172bd51a9a401fb0101ddf90d3b1a8), [`f446bbc`](https://github.com/scalar/scalar/commit/f446bbc0b8aec7fa7314603fd48471f06c1318d5), [`b77fa53`](https://github.com/scalar/scalar/commit/b77fa5356a1ad51766b6dd6b20e10c408924a8ff)]:
  - @scalar/api-reference@1.40.2

## 0.4.9

### Patch Changes

- Updated dependencies [[`9342adc`](https://github.com/scalar/scalar/commit/9342adcd76e26a8e5eff75c1a2abee2c207b1487), [`62b5210`](https://github.com/scalar/scalar/commit/62b521092bafeb8e83e79222e13378c4a19defc8), [`425d8e1`](https://github.com/scalar/scalar/commit/425d8e1aaac26a6ec9a781431e1076ee4db3d027), [`294f9fc`](https://github.com/scalar/scalar/commit/294f9fc6cfd43cdab110deb1c851883509bc2b84)]:
  - @scalar/api-reference@1.40.1

## 0.4.8

### Patch Changes

- [#7321](https://github.com/scalar/scalar/pull/7321) [`6e084d1`](https://github.com/scalar/scalar/commit/6e084d1511a1d4318cb517d6c3c25f23ab0a2f78) Thanks [@xC0dex](https://github.com/xC0dex)! - ci: separate build and publish jobs

- Updated dependencies [[`44aeef0`](https://github.com/scalar/scalar/commit/44aeef01073801165e339163462378b7b62ff68d), [`5a108fc`](https://github.com/scalar/scalar/commit/5a108fcbc52ae7957731c23689896ba353b83d3b), [`cded2d6`](https://github.com/scalar/scalar/commit/cded2d6c087418c3c44731d344d0827a87b78b74), [`3ebff92`](https://github.com/scalar/scalar/commit/3ebff92f29d8d03d626d4000e8323528e794e755)]:
  - @scalar/api-reference@1.40.0

## 0.4.7

### Patch Changes

- Updated dependencies [[`4bec1ba`](https://github.com/scalar/scalar/commit/4bec1ba332e919c4ee32dcfbfb07bd8ee42c4d74), [`7859105`](https://github.com/scalar/scalar/commit/7859105f857633c8f3c945d67a21f7225844ed12)]:
  - @scalar/api-reference@1.39.3

## 0.4.6

### Patch Changes

- Updated dependencies [[`2377b76`](https://github.com/scalar/scalar/commit/2377b76d050f8de70037b17a32d0dd1181d3311d)]:
  - @scalar/api-reference@1.39.2

## 0.4.5

### Patch Changes

- Updated dependencies [[`1d987e9`](https://github.com/scalar/scalar/commit/1d987e9977b145b2657bc5f8d6a67d2add958826), [`eb96d5c`](https://github.com/scalar/scalar/commit/eb96d5c1dfabde0681552ffc6ab77952c47775bb)]:
  - @scalar/api-reference@1.39.1

## 0.4.4

### Patch Changes

- Updated dependencies [[`3ecf139`](https://github.com/scalar/scalar/commit/3ecf139d1a8e7a4dd49d471fa5f74c572442ae35), [`eb022f2`](https://github.com/scalar/scalar/commit/eb022f2c8f93c84a04c0093fefe8a1e05d6ec80d), [`6f60b8d`](https://github.com/scalar/scalar/commit/6f60b8dd1cf17185ea56b1f3bcbe811acc14010b), [`23a5628`](https://github.com/scalar/scalar/commit/23a5628e73d43739e3786703c0fe539c19697733), [`6aa06b0`](https://github.com/scalar/scalar/commit/6aa06b0f843ae3d8e6771e3c02ac11ee0043a4b1), [`a796162`](https://github.com/scalar/scalar/commit/a79616220d5deb0117c2d6d191b465b36ba6ccd0), [`0d9c945`](https://github.com/scalar/scalar/commit/0d9c945a696ea8b826d86f7b48ec6de4d85e64f0), [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a), [`d9e911a`](https://github.com/scalar/scalar/commit/d9e911aad3a7fe25cc173bfc7865d990f30880c6), [`81b0a7a`](https://github.com/scalar/scalar/commit/81b0a7a4245619f03161eae639dc5834b77432b6), [`8a5a6a0`](https://github.com/scalar/scalar/commit/8a5a6a052cc05b0902b05052c80cc429ebc5a730), [`33edbf2`](https://github.com/scalar/scalar/commit/33edbf2a2648eb72ae49e36dfd289d4d57dc18e0), [`eba18d0`](https://github.com/scalar/scalar/commit/eba18d06267a163a8f91396a66f817100ee59461), [`0d9c945`](https://github.com/scalar/scalar/commit/0d9c945a696ea8b826d86f7b48ec6de4d85e64f0)]:
  - @scalar/api-reference@1.39.0

## 0.4.3

### Patch Changes

- Updated dependencies [ef98f35]
- Updated dependencies [f8efecd]
- Updated dependencies [9c65f51]
  - @scalar/api-reference@1.38.1

## 0.4.2

### Patch Changes

- Updated dependencies [debdcf6]
- Updated dependencies [a747da6]
- Updated dependencies [1e01464]
- Updated dependencies [90d54b6]
  - @scalar/api-reference@1.38.0

## 0.4.1

### Patch Changes

- Updated dependencies [008a0f3]
- Updated dependencies [f833196]
  - @scalar/api-reference@1.37.0

## 0.4.0

### Minor Changes

- 400a72b: feat: support for mounting OpenAPI documents

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

## 0.3.1

### Patch Changes

- Updated dependencies [0b3c6fa]
  - @scalar/api-reference@1.36.2

## 0.3.0

### Minor Changes

- f6883f5: feat: rename standalone.js to scalar.js

### Patch Changes

- Updated dependencies [77337d3]
  - @scalar/api-reference@1.36.1

## 0.2.34

### Patch Changes

- Updated dependencies [2362df9]
- Updated dependencies [f0f28a9]
- Updated dependencies [003bb98]
- Updated dependencies [dd98fdc]
  - @scalar/api-reference@1.36.0

## 0.2.33

### Patch Changes

- Updated dependencies [6e92423]
- Updated dependencies [005fba9]
- Updated dependencies [724052c]
- Updated dependencies [a1f865c]
- Updated dependencies [6ee88cd]
- Updated dependencies [b5321f1]
- Updated dependencies [dcf50ef]
  - @scalar/api-reference@1.35.7

## 0.2.32

### Patch Changes

- Updated dependencies [b6a59bd]
- Updated dependencies [8f2a2f2]
  - @scalar/api-reference@1.35.6

## 0.2.31

### Patch Changes

- Updated dependencies [4e7e8a9]
  - @scalar/api-reference@1.35.5

## 0.2.30

### Patch Changes

- @scalar/api-reference@1.35.4

## 0.2.29

### Patch Changes

- Updated dependencies [821717b]
- Updated dependencies [821717b]
- Updated dependencies [425a954]
  - @scalar/api-reference@1.35.3

## 0.2.28

### Patch Changes

- @scalar/api-reference@1.35.2

## 0.2.27

### Patch Changes

- @scalar/api-reference@1.35.1

## 0.2.26

### Patch Changes

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

## 0.2.25

### Patch Changes

- Updated dependencies [50032be]
- Updated dependencies [88385b1]
  - @scalar/api-reference@1.34.6

## 0.2.24

### Patch Changes

- Updated dependencies [86d29c1]
  - @scalar/api-reference@1.34.5

## 0.2.23

### Patch Changes

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

## 0.2.22

### Patch Changes

- Updated dependencies [97f199a]
- Updated dependencies [0d502cb]
- Updated dependencies [3de82ac]
- Updated dependencies [58b9321]
- Updated dependencies [2c74892]
  - @scalar/api-reference@1.34.3

## 0.2.21

### Patch Changes

- Updated dependencies [83625c6]
  - @scalar/api-reference@1.34.2

## 0.2.20

### Patch Changes

- Updated dependencies [4d05839]
  - @scalar/api-reference@1.34.1

## 0.2.19

### Patch Changes

- Updated dependencies [f838a47]
- Updated dependencies [94b5d0a]
- Updated dependencies [0f4a784]
- Updated dependencies [5301a80]
- Updated dependencies [8113963]
- Updated dependencies [2888e18]
- Updated dependencies [fb0c254]
  - @scalar/api-reference@1.34.0

## 0.2.18

### Patch Changes

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

## 0.2.17

### Patch Changes

- Updated dependencies [3eb8171]
- Updated dependencies [60c7bef]
- Updated dependencies [716a83a]
- Updated dependencies [9b4417b]
- Updated dependencies [2ace00b]
- Updated dependencies [fb62e1b]
- Updated dependencies [cac47ea]
- Updated dependencies [2ace00b]
  - @scalar/api-reference@1.32.10

## 0.2.16

### Patch Changes

- Updated dependencies [8c6f6fe]
  - @scalar/api-reference@1.32.9

## 0.2.15

### Patch Changes

- Updated dependencies [a04cc15]
- Updated dependencies [b5bcce7]
- Updated dependencies [97721b5]
- Updated dependencies [9978a16]
- Updated dependencies [8a67f4f]
  - @scalar/api-reference@1.32.8

## 0.2.14

### Patch Changes

- Updated dependencies [a85480e]
- Updated dependencies [1a6c0a4]
- Updated dependencies [9be7ca9]
- Updated dependencies [c2ff19e]
- Updated dependencies [7325520]
- Updated dependencies [134c455]
  - @scalar/api-reference@1.32.7

## 0.2.13

### Patch Changes

- Updated dependencies [6a7509a]
- Updated dependencies [80acf84]
  - @scalar/api-reference@1.32.6

## 0.2.12

### Patch Changes

- Updated dependencies [5de7e25]
  - @scalar/api-reference@1.32.5

## 0.2.11

### Patch Changes

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

## 0.2.10

### Patch Changes

- Updated dependencies [08e1e84]
  - @scalar/api-reference@1.32.3

## 0.2.9

### Patch Changes

- Updated dependencies [4e0caa1]
- Updated dependencies [4d29320]
- Updated dependencies [2d7f995]
  - @scalar/api-reference@1.32.2

## 0.2.8

### Patch Changes

- Updated dependencies [98ff011]
  - @scalar/api-reference@1.32.1

## 0.2.7

### Patch Changes

- 0d76a1f: chore: improved ci
- Updated dependencies [533469b]
- Updated dependencies [a70bcce]
- Updated dependencies [6ac48c8]
- Updated dependencies [8d8e427]
- Updated dependencies [b7ff99a]
- Updated dependencies [fed71e0]
- Updated dependencies [a983428]
- Updated dependencies [3393c83]
  - @scalar/api-reference@1.32.0

## 0.2.6

### Patch Changes

- Updated dependencies [c907685]
- Updated dependencies [cd7e1b1]
- Updated dependencies [3abe906]
- Updated dependencies [42bc960]
- Updated dependencies [1468280]
  - @scalar/api-reference@1.31.18

## 0.2.5

### Patch Changes

- Updated dependencies [ca18c0b]
  - @scalar/api-reference@1.31.17

## 0.2.4

### Patch Changes

- Updated dependencies [699df60]
  - @scalar/api-reference@1.31.16

## 0.2.3

### Patch Changes

- Updated dependencies [5f08a45]
- Updated dependencies [287eae4]
- Updated dependencies [161733e]
  - @scalar/api-reference@1.31.15

## 0.2.2

### Patch Changes

- Updated dependencies [0a94952]
- Updated dependencies [0e67143]
  - @scalar/api-reference@1.31.14

## 0.2.1

### Patch Changes

- Updated dependencies [482aaf5]
- Updated dependencies [a567796]
  - @scalar/api-reference@1.31.13

## 0.2.0

### Minor Changes

- 0a4990f: feat(docker): initial API Reference for docker

### Patch Changes

- Updated dependencies [796f87f]
  - @scalar/api-reference@1.31.12
