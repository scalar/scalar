# @scalar/java-integration

## 0.5.45

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.15**

## 0.5.44

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.14**
  - [#8025](https://github.com/scalar/scalar/pull/8025): fix: use flex-start instead of start for better browser support
  - [#8056](https://github.com/scalar/scalar/pull/8056): fix: hideModels not applying correctly

## 0.5.43

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.13**

## 0.5.42

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.12**
  - [#8035](https://github.com/scalar/scalar/pull/8035): fix: correctly resolve and validate refs

## 0.5.41

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.11**

## 0.5.40

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.10**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

## 0.5.39

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.9**

## 0.5.38

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.8**
  - [#8018](https://github.com/scalar/scalar/pull/8018): fix(agent): clickout close events

## 0.5.37

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.7**
  - [#8017](https://github.com/scalar/scalar/pull/8017): fix: remove agent tooltip

## 0.5.36

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.6**
  - [#8010](https://github.com/scalar/scalar/pull/8010): fix: use proper computed property

## 0.5.35

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.5**
  - [#8007](https://github.com/scalar/scalar/pull/8007): fix: use correct composition data for oneOf property
  - [#8006](https://github.com/scalar/scalar/pull/8006): fix(agent): safari fieldsizing fallback

## 0.5.34

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

## 0.5.33

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.3**

## 0.5.32

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.2**

## 0.5.31

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.1**
  - [#7961](https://github.com/scalar/scalar/pull/7961): fix(agent): make agent ui responsive
  - [#7967](https://github.com/scalar/scalar/pull/7967): fix(agent): remove ui jump on uploading document

## 0.5.30

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.44.0**
  - [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost
  - [#7932](https://github.com/scalar/scalar/pull/7932): feat: use getExample in the references responses
  - [#7931](https://github.com/scalar/scalar/pull/7931): fix(api-reference): account for custom header and sidebar

## 0.5.29

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.17**

## 0.5.28

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.16**
  - [#7901](https://github.com/scalar/scalar/pull/7901): fix(api-reference): don't flex schema enum label

## 0.5.27

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.15**
  - [#7894](https://github.com/scalar/scalar/pull/7894): fix: the import and export of redirect to proxy

## 0.5.26

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.14**

## 0.5.25

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.13**

## 0.5.24

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.12**
  - [#7850](https://github.com/scalar/scalar/pull/7850): fix: remove unused workspace config
  - [#7819](https://github.com/scalar/scalar/pull/7819): feat: hide responses without content

## 0.5.23

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.11**

## 0.5.22

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.10**
  - [#7820](https://github.com/scalar/scalar/pull/7820): fix: correctly restore the auth from persistance
  - [#7814](https://github.com/scalar/scalar/pull/7814): fix: additional properties generate invalid example

## 0.5.21

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

## 0.5.20

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.8**

## 0.5.19

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.7**
  - [#7751](https://github.com/scalar/scalar/pull/7751): fix: auth persistence

## 0.5.18

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.6**
  - [#7761](https://github.com/scalar/scalar/pull/7761): fix: update the hooks when the configuration changes

## 0.5.17

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.5**
  - [#7745](https://github.com/scalar/scalar/pull/7745): fix: add nested array support to references
  - [#7752](https://github.com/scalar/scalar/pull/7752): Export Auth component
  - [#7746](https://github.com/scalar/scalar/pull/7746): fix: allow trailing slashes in path
  - [#7742](https://github.com/scalar/scalar/pull/7742): feat: export auth component + proxy fix

## 0.5.16

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.4**
  - [#7678](https://github.com/scalar/scalar/pull/7678): chore: add test for tagSorter
  - [#7693](https://github.com/scalar/scalar/pull/7693): feat: markdown default line height
  - [#7730](https://github.com/scalar/scalar/pull/7730): fix: ensure path params work on the client

## 0.5.15

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.3**

## 0.5.14

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.2**

## 0.5.13

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.1**
  - [#7673](https://github.com/scalar/scalar/pull/7673): fix: pass in reactive auth config to client

## 0.5.12

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.43.0**
  - [#7661](https://github.com/scalar/scalar/pull/7661): feat: api client v2 integration

## 0.5.11

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.42.0**
  - [#7605](https://github.com/scalar/scalar/pull/7605): feat: api client v2 integration

## 0.5.10

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.41.1**

## 0.5.9

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.41.0**
  - [#7633](https://github.com/scalar/scalar/pull/7633): feat(api-reference): support rendering custom components for paths
  - [#7583](https://github.com/scalar/scalar/pull/7583): feat: show empty schema message for object with no properties
  - [#7597](https://github.com/scalar/scalar/pull/7597): fix: show more button appears even if tags don't have any children

## 0.5.8

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.9**

## 0.5.7

### Patch Changes

#### Updated Dependencies

- **@scalar/api-reference@1.40.8**
  - [#7577](https://github.com/scalar/scalar/pull/7577): fix(api-reference): add padding to card intro in callbacks
  - [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

## 0.5.6

### Patch Changes

- [#7548](https://github.com/scalar/scalar/pull/7548): FINALLY fixed the maven publish job

#### Updated Dependencies

- **@scalar/api-reference@1.40.7**
  - [#7575](https://github.com/scalar/scalar/pull/7575): feat: add support for object examples + hide body when empty
  - [#7550](https://github.com/scalar/scalar/pull/7550): Fix content width in mobile layout

## 0.5.5

### Patch Changes

- [#7512](https://github.com/scalar/scalar/pull/7512) [`4e188bb`](https://github.com/scalar/scalar/commit/4e188bbeaeb1dbc9f2d0318ab92dddbf69f6400a) Thanks [@xC0dex](https://github.com/xC0dex)! - fix maven publish

- Updated dependencies []:
  - @scalar/api-reference@1.40.6

## 0.5.4

### Patch Changes

- Updated dependencies []:
  - @scalar/api-reference@1.40.5

## 0.5.3

### Patch Changes

- Updated dependencies [[`2b46ee2`](https://github.com/scalar/scalar/commit/2b46ee2773023ca348e8691e1123970ca58090e5)]:
  - @scalar/api-reference@1.40.4

## 0.5.2

### Patch Changes

- Updated dependencies [[`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a)]:
  - @scalar/api-reference@1.40.3

## 0.5.1

### Patch Changes

- [#7480](https://github.com/scalar/scalar/pull/7480) [`5cb78d5`](https://github.com/scalar/scalar/commit/5cb78d535802e8107d970373eb4d78b0d367b8ce) Thanks [@xC0dex](https://github.com/xC0dex)! - fix CI publish

- Updated dependencies [[`08d137a`](https://github.com/scalar/scalar/commit/08d137a1d9172bd51a9a401fb0101ddf90d3b1a8), [`f446bbc`](https://github.com/scalar/scalar/commit/f446bbc0b8aec7fa7314603fd48471f06c1318d5), [`b77fa53`](https://github.com/scalar/scalar/commit/b77fa5356a1ad51766b6dd6b20e10c408924a8ff)]:
  - @scalar/api-reference@1.40.2

## 0.5.0

### Minor Changes

- [#7376](https://github.com/scalar/scalar/pull/7376) [`0b85d74`](https://github.com/scalar/scalar/commit/0b85d7491be2eb7306917adf559983d9ab40d2db) Thanks [@xC0dex](https://github.com/xC0dex)! - feat: separate modules for Spring Boot. Please checkout our new documentation!

### Patch Changes

- Updated dependencies [[`9342adc`](https://github.com/scalar/scalar/commit/9342adcd76e26a8e5eff75c1a2abee2c207b1487), [`62b5210`](https://github.com/scalar/scalar/commit/62b521092bafeb8e83e79222e13378c4a19defc8), [`425d8e1`](https://github.com/scalar/scalar/commit/425d8e1aaac26a6ec9a781431e1076ee4db3d027), [`294f9fc`](https://github.com/scalar/scalar/commit/294f9fc6cfd43cdab110deb1c851883509bc2b84)]:
  - @scalar/api-reference@1.40.1
