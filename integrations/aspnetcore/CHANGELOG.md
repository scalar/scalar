# @scalar/aspnetcore

## 2.0.11

### Patch Changes

- @scalar/api-reference@1.25.115

## 2.0.10

### Patch Changes

- Updated dependencies [2497761]
- Updated dependencies [d1325d0]
- Updated dependencies [db3cf68]
- Updated dependencies [f9bf5f1]
  - @scalar/api-reference@1.25.114

## 2.0.9

### Patch Changes

- @scalar/api-reference@1.25.113

## 2.0.8

### Patch Changes

- 3eac1cf: feature: Support {documentName} placeholder in title
- Updated dependencies [be34e7d]
- Updated dependencies [2edbab2]
  - @scalar/api-reference@1.25.112

## 2.0.7

### Patch Changes

- @scalar/api-reference@1.25.111

## 2.0.6

### Patch Changes

- @scalar/api-reference@1.25.110

## 2.0.5

### Patch Changes

- Updated dependencies [09dee7e]
- Updated dependencies [702c386]
- Updated dependencies [a4ec7fa]
  - @scalar/api-reference@1.25.109

## 2.0.4

### Patch Changes

- 77ebe60: fix: HiddenClients behavior and add missing clients and targets
  - @scalar/api-reference@1.25.108

## 2.0.3

### Patch Changes

- d843313: fix: anonymous assets endpoint
- Updated dependencies [a871c83]
  - @scalar/api-reference@1.25.107

## 2.0.2

### Patch Changes

- 5b8975c: fix: Regex in AOT
- Updated dependencies [5501ee3]
- Updated dependencies [6062a69]
- Updated dependencies [1bee104]
- Updated dependencies [b552db5]
  - @scalar/api-reference@1.25.106

## 2.0.1

### Patch Changes

- @scalar/api-reference@1.25.105

## 2.0.0

### Major Changes

- c15cff3: - The `EndpointPathPrefix` property is now obsolete and should no longer be used.

  - Any existing workarounds for sub-path deployment are no longer necessary and should be removed.
  - Introduced a new parameter `endpointPrefix` to replace the obsolete `EndpointPathPrefix` property in ScalarOptions.
  - Automatic handling of sub-path deployments, eliminating the need for manual configurations.
  - Injection of `HttpContext` during options configuration, enabling access to necessary elements from the `HttpContext`.
  - Auto redirect from `/scalar` to `/scalar/` to resolve relative paths correctly.
  - Cache and ETag Header for static assets.
  - More `[StringSyntax]` annotations for a better developer experience.
  - Fixed a typo in `Metadata` to `MetaData`. Now the configuration works as expected.

  For detailed migration steps and further information, please refer to the [migration guide](https://github.com/scalar/scalar/issues/4362).

### Patch Changes

- Updated dependencies [ace02fe]
- Updated dependencies [60cd6f1]
- Updated dependencies [39df543]
- Updated dependencies [e866487]
- Updated dependencies [d2b1525]
  - @scalar/api-reference@1.25.104

## 1.2.76

### Patch Changes

- Updated dependencies [f9f5bdb]
  - @scalar/api-reference@1.25.103

## 1.2.75

### Patch Changes

- Updated dependencies [9e2e8be]
- Updated dependencies [273e927]
- Updated dependencies [0642732]
- Updated dependencies [58d5f6c]
  - @scalar/api-reference@1.25.102

## 1.2.74

### Patch Changes

- @scalar/api-reference@1.25.101

## 1.2.73

### Patch Changes

- Updated dependencies [b291406]
- Updated dependencies [b291406]
- Updated dependencies [c37fb70]
  - @scalar/api-reference@1.25.100

## 1.2.72

### Patch Changes

- @scalar/api-reference@1.25.99

## 1.2.71

### Patch Changes

- @scalar/api-reference@1.25.98

## 1.2.70

### Patch Changes

- @scalar/api-reference@1.25.97

## 1.2.69

### Patch Changes

- @scalar/api-reference@1.25.96

## 1.2.68

### Patch Changes

- Updated dependencies [6890d7e]
- Updated dependencies [bc8f883]
  - @scalar/api-reference@1.25.95

## 1.2.67

### Patch Changes

- Updated dependencies [02b4201]
- Updated dependencies [9cf76af]
  - @scalar/api-reference@1.25.94

## 1.2.66

### Patch Changes

- @scalar/api-reference@1.25.93

## 1.2.65

### Patch Changes

- Updated dependencies [fd80d43]
- Updated dependencies [47d1d82]
  - @scalar/api-reference@1.25.92

## 1.2.64

### Patch Changes

- @scalar/api-reference@1.25.91

## 1.2.63

### Patch Changes

- @scalar/api-reference@1.25.90

## 1.2.62

### Patch Changes

- Updated dependencies [3c7d7dd]
  - @scalar/api-reference@1.25.89

## 1.2.61

### Patch Changes

- Updated dependencies [6407b2b]
- Updated dependencies [c65f3fc]
- Updated dependencies [c65f3fc]
- Updated dependencies [c65f3fc]
  - @scalar/api-reference@1.25.88

## 1.2.60

### Patch Changes

- @scalar/api-reference@1.25.87

## 1.2.59

### Patch Changes

- Updated dependencies [c263aaf]
  - @scalar/api-reference@1.25.86

## 1.2.58

### Patch Changes

- @scalar/api-reference@1.25.85

## 1.2.57

### Patch Changes

- de024a5: fix: Typo in ScalarTarget.JavaScript
  - @scalar/api-reference@1.25.84

## 1.2.56

### Patch Changes

- Updated dependencies [7a2b32d]
- Updated dependencies [c78beda]
  - @scalar/api-reference@1.25.83

## 1.2.55

### Patch Changes

- Updated dependencies [bd84466]
  - @scalar/api-reference@1.25.82

## 1.2.54

### Patch Changes

- Updated dependencies [fbef0c3]
- Updated dependencies [fbef0c3]
- Updated dependencies [fbef0c3]
- Updated dependencies [fbef0c3]
- Updated dependencies [fbef0c3]
  - @scalar/api-reference@1.25.81

## 1.2.53

### Patch Changes

- Updated dependencies [a109244]
  - @scalar/api-reference@1.25.80

## 1.2.52

### Patch Changes

- Updated dependencies [cbc70ae]
- Updated dependencies [eea1822]
  - @scalar/api-reference@1.25.79

## 1.2.51

### Patch Changes

- 1ae0286: feat: Add Layout option
  - @scalar/api-reference@1.25.78

## 1.2.50

### Patch Changes

- Updated dependencies [3eb0d11]
  - @scalar/api-reference@1.25.77

## 1.2.49

### Patch Changes

- @scalar/api-reference@1.25.76

## 1.2.48

### Patch Changes

- Updated dependencies [f955985]
- Updated dependencies [c2be791]
  - @scalar/api-reference@1.25.75

## 1.2.47

### Patch Changes

- Updated dependencies [13432e7]
  - @scalar/api-reference@1.25.74

## 1.2.46

### Patch Changes

- b8de0e2: feat: Add HideClientButton configuration property
- Updated dependencies [e199e9b]
- Updated dependencies [e199e9b]
- Updated dependencies [ab5f0a0]
- Updated dependencies [c2f5f08]
- Updated dependencies [ab5f0a0]
  - @scalar/api-reference@1.25.73

## 1.2.45

### Patch Changes

- Updated dependencies [7605d6f]
- Updated dependencies [c9b6873]
- Updated dependencies [baaad1c]
- Updated dependencies [c984ac8]
  - @scalar/api-reference@1.25.72

## 1.2.44

### Patch Changes

- @scalar/api-reference@1.25.71

## 1.2.43

### Patch Changes

- Updated dependencies [8004539]
- Updated dependencies [9d23f95]
- Updated dependencies [9002259]
  - @scalar/api-reference@1.25.70

## 1.2.42

### Patch Changes

- Updated dependencies [1b06f64]
- Updated dependencies [fda0e5c]
  - @scalar/api-reference@1.25.69

## 1.2.41

### Patch Changes

- Updated dependencies [daa2663]
- Updated dependencies [f67c3bc]
  - @scalar/api-reference@1.25.68

## 1.2.40

### Patch Changes

- Updated dependencies [594a96c]
- Updated dependencies [0adbfd5]
- Updated dependencies [9b4def7]
- Updated dependencies [2a6117e]
  - @scalar/api-reference@1.25.67

## 1.2.39

### Patch Changes

- @scalar/api-reference@1.25.66

## 1.2.38

### Patch Changes

- Updated dependencies [bfad6dc]
- Updated dependencies [c8fae11]
- Updated dependencies [6894b7d]
  - @scalar/api-reference@1.25.65

## 1.2.37

### Patch Changes

- Updated dependencies [49ccdee]
- Updated dependencies [49ccdee]
  - @scalar/api-reference@1.25.64

## 1.2.36

### Patch Changes

- Updated dependencies [ac55d0f]
  - @scalar/api-reference@1.25.63

## 1.2.35

### Patch Changes

- Updated dependencies [ca05270]
  - @scalar/api-reference@1.25.62

## 1.2.34

### Patch Changes

- baaafe8: fix: Use relative path for assets
  - @scalar/api-reference@1.25.61

## 1.2.33

### Patch Changes

- Updated dependencies [a40999d]
- Updated dependencies [b89da58]
  - @scalar/api-reference@1.25.60

## 1.2.32

### Patch Changes

- Updated dependencies [f9808d3]
  - @scalar/api-reference@1.25.59

## 1.2.31

### Patch Changes

- Updated dependencies [132997b]
  - @scalar/api-reference@1.25.58

## 1.2.30

### Patch Changes

- @scalar/api-reference@1.25.57

## 1.2.29

### Patch Changes

- @scalar/api-reference@1.25.56

## 1.2.28

### Patch Changes

- 764b1c3: feat: Add StringSyntax attribute to urls
- Updated dependencies [5d8c90b]
- Updated dependencies [f764640]
  - @scalar/api-reference@1.25.55

## 1.2.27

### Patch Changes

- @scalar/api-reference@1.25.54

## 1.2.26

### Patch Changes

- Updated dependencies [fb798c8]
- Updated dependencies [cf4e9c4]
- Updated dependencies [6108625]
- Updated dependencies [cfe9b85]
- Updated dependencies [6599473]
- Updated dependencies [bb3dc9d]
- Updated dependencies [0e19781]
- Updated dependencies [ac0f8f1]
  - @scalar/api-reference@1.25.53

## 1.2.25

### Patch Changes

- @scalar/api-reference@1.25.52

## 1.2.24

### Patch Changes

- Updated dependencies [369c2c2]
- Updated dependencies [ada8545]
- Updated dependencies [56a48d1]
- Updated dependencies [ada8545]
  - @scalar/api-reference@1.25.51

## 1.2.23

### Patch Changes

- Updated dependencies [77256f4]
  - @scalar/api-reference@1.25.50

## 1.2.22

### Patch Changes

- Updated dependencies [5995f57]
- Updated dependencies [a265153]
- Updated dependencies [69bda25]
  - @scalar/api-reference@1.25.49

## 1.2.21

### Patch Changes

- @scalar/api-reference@1.25.48

## 1.2.20

### Patch Changes

- a8a051d: feat: Add DotNetFlag configuration property

## 1.2.19

### Patch Changes

- Updated dependencies [70846c1]
- Updated dependencies [3e2b1e1]
  - @scalar/api-reference@1.25.47

## 1.2.18

### Patch Changes

- Updated dependencies [b4a93ab]
  - @scalar/api-reference@1.25.46

## 1.2.17

### Patch Changes

- @scalar/api-reference@1.25.45

## 1.2.16

### Patch Changes

- @scalar/api-reference@1.25.44

## 1.2.15

### Patch Changes

- @scalar/api-reference@1.25.43

## 1.2.14

### Patch Changes

- Updated dependencies [6bbb815]
  - @scalar/api-reference@1.25.42

## 1.2.13

### Patch Changes

- Updated dependencies [a80a931]
  - @scalar/api-reference@1.25.41

## 1.2.12

### Patch Changes

- @scalar/api-reference@1.25.40

## 1.2.11

### Patch Changes

- @scalar/api-reference@1.25.39

## 1.2.10

### Patch Changes

- ec9f654: feat: use a bundled js asset, remove external resource
- dbbe38f: feat: add framework identifier for debugging purposes
- Updated dependencies [dbbe38f]
- Updated dependencies [59d3931]
  - @scalar/api-reference@1.25.38

## 1.2.9

### Patch Changes

- f744812: feat: Add OperationSorter option

## 1.2.8

### Patch Changes

- 8cd95c2: fix: changelog lint issue

## 1.2.7

### Patch Changes

- 3ebe5ee: chore(scalar.aspnetcore): clean up tests and github actions

## 1.2.6

### Patch Changes

- 03511b7: chore: automatic release
