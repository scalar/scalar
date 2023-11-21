# @scalar/swagger-editor

## 0.7.6

### Patch Changes

- 8e65ba9: fix: set codemirror peer dependency version
- 36761e4: feat: make the available tabs configurable

## 0.7.5

### Patch Changes

- b6552df: chore: externalize dependencies, optimize bundle size
- 04875a6: fix: remove empty content update deleting rendered refs

## 0.7.4

### Patch Changes

- 801f1b5: feat: improve getting started page

## 0.7.3

### Patch Changes

- ff81f70: refactor: move getting started example to GettingStarted component
- ff81f70: fix: don’t overwrite the CodeMirror content when collaborative editing is enabled

## 0.7.2

### Patch Changes

- f4681d5: feat: add yaml syntax highlighting
- c92a3a3: chore: don’t add heading ids to the rendered Markdown
- 48118ba: feat: add updateContent event to the ApiReference component
- dab853a: chore: remove unused dependencies
- Updated dependencies [f4681d5]
- Updated dependencies [dab853a]
  - @scalar/use-codemirror@0.7.12
  - @scalar/use-modal@0.1.6

## 0.7.1

### Patch Changes

- a7e6c25: fix: externalize remark/rehype dependencies to fix SSG builds

## 0.7.0

### Minor Changes

- 440815a: Add getting started to empty render area

### Patch Changes

- 509db1e: refactor: move all api reference refs and watchers to hooks
- a4f1b08: fix: switching documents with collaborative editing mode enabled
- Updated dependencies [b0835a2]
- Updated dependencies [509db1e]
- Updated dependencies [a4f1b08]
  - @scalar/use-modal@0.1.5
  - @scalar/use-codemirror@0.7.11

## 0.6.30

### Patch Changes

- 8e2e4e5a: fix markdown collisions + prefix the card name

## 0.6.29

### Patch Changes

- db24e103: hotfix: import spec from url

## 0.6.28

### Patch Changes

- 2f0b2f01: refactor: improve the data flow between the reference and the swagger editor

## 0.6.27

### Patch Changes

- a73ee9d8: fix typography on editor headings

## 0.6.26

### Patch Changes

- d5fccba9: add ai writer to swagger editor

## 0.6.25

### Patch Changes

- Updated dependencies [64f8a018]
- Updated dependencies [7c3091c6]
  - @scalar/use-codemirror@0.7.10

## 0.6.24

### Patch Changes

- Updated dependencies [aa24dbe6]
  - @scalar/use-codemirror@0.7.9

## 0.6.23

### Patch Changes

- d87566fd: refactor: new section components, new sidebar
- Updated dependencies [db7f5f57]
- Updated dependencies [d87566fd]
- Updated dependencies [8be53df2]
- Updated dependencies [4eaee866]
- Updated dependencies [06b46553]
  - @scalar/swagger-parser@0.5.5

## 0.6.22

### Patch Changes

- 357a174d: feat: fix import URL, use proxy to fetch files
- 357a174d: feat: click on import url or upload file in getting started opens the modal/dialog now
- Updated dependencies [fd6cf1bb]
  - @scalar/swagger-parser@0.5.4

## 0.6.21

### Patch Changes

- Updated dependencies [fd38deb0]
  - @scalar/themes@0.4.0

## 0.6.20

### Patch Changes

- af4ec8d3: update discord links
- 749f2f3f: fix: initial swagger editor content is parsed
- Updated dependencies [af4ec8d3]
  - @scalar/swagger-parser@0.5.3
  - @scalar/use-codemirror@0.7.8
  - @scalar/themes@0.3.11

## 0.6.19

### Patch Changes

- 1cbcabd7: lots of amazing fixes from when we missed last patch
- Updated dependencies [33604a1b]
- Updated dependencies [1cbcabd7]
- Updated dependencies [d7b12610]
  - @scalar/swagger-parser@0.5.2
  - @scalar/use-codemirror@0.7.7
  - @scalar/use-modal@0.1.4
  - @scalar/themes@0.3.10

## 0.6.18

### Patch Changes

- a7f776ba: fix: restore content from local storage

## 0.6.17

### Patch Changes

- eb0c3201: Lot's of small things + bigger temp fix for the multi content cards
- Updated dependencies [eb0c3201]
  - @scalar/themes@0.3.9

## 0.6.16

### Patch Changes

- 3805e649: remove hover on active header tab

## 0.6.15

### Patch Changes

- Updated dependencies [be239745]
  - @scalar/use-codemirror@0.7.6

## 0.6.14

### Patch Changes

- 99744358: feat: cache swagger editor content in local storage
- 3dd2574d: sidebar toggle not flex aligned + fix folder colors

## 0.6.13

### Patch Changes

- Updated dependencies [7b6c21e5]
  - @scalar/use-modal@0.1.3

## 0.6.12

### Patch Changes

- 46142c0a: reference theme fixes
- Updated dependencies [46142c0a]
  - @scalar/themes@0.3.8

## 0.6.11

### Patch Changes

- 727d7f47: make swagger editor tab state controllable via prop
- 727d7f47: add initial tab state prop to swagger editor

## 0.6.10

### Patch Changes

- Updated dependencies [1d02c811]
  - @scalar/themes@0.3.7

## 0.6.9

### Patch Changes

- b76f4d1e: Reference search + some app hover states
- Updated dependencies [b76f4d1e]
  - @scalar/use-codemirror@0.7.5
  - @scalar/use-modal@0.1.2
  - @scalar/themes@0.3.6

## 0.6.8

### Patch Changes

- Updated dependencies [4985562c]
  - @scalar/use-codemirror@0.7.4
  - @scalar/themes@0.3.5

## 0.6.7

### Patch Changes

- Updated dependencies [58af0623]
  - @scalar/use-codemirror@0.7.3

## 0.6.6

### Patch Changes

- cd5f2685: codemirror colors + font fixes throughout app
- Updated dependencies [cd5f2685]
  - @scalar/themes@0.3.4

## 0.6.5

### Patch Changes

- Updated dependencies [8823d7a1]
  - @scalar/use-codemirror@0.7.2

## 0.6.4

### Patch Changes

- 5363374d: fix broken renderer for swagger editor

## 0.6.3

### Patch Changes

- 449305f4: marketing content section
- 3e912c75: getting started page design
- 048555c6: feat: add CHANGELOG.md to the package
- Updated dependencies [449305f4]
- Updated dependencies [3e912c75]
- Updated dependencies [048555c6]
  - @scalar/use-modal@0.1.1
  - @scalar/swagger-parser@0.5.1
  - @scalar/use-codemirror@0.7.1
  - @scalar/themes@0.3.3

## 0.6.2

### Patch Changes

- 75a69ba7: feat: add `theme` prop and improve theme support
- d6a10e1f: fix: no border for the buttons
- Updated dependencies [75a69ba7]
- Updated dependencies [75a69ba7]
  - @scalar/themes@0.3.2

## 0.6.1

### Patch Changes

- b184bdf2: codemirror themeing and other theme fixes
- 8751c874: Fix background color not being applied below rendered references
- addd9fa2: feat: use `default` prefix for all CSS variables
- 2006aa43: fix: add CSS reset
- Updated dependencies [b184bdf2]
- Updated dependencies [3b1fec80]
- Updated dependencies [addd9fa2]
  - @scalar/use-codemirror@0.7.0

## 0.6.0

### Minor Changes

- 87fda5af: chore: update dependencies

### Patch Changes

- ef080a26: chore: format package.json
- 45645710: feat: show number of connected users
  fix: typo, use API reference without Yjs
  chore: remove useSwaggerEditor, no more global state
- Updated dependencies [ef080a26]
- Updated dependencies [87fda5af]
  - @scalar/swagger-parser@0.5.0
  - @scalar/use-codemirror@0.6.0

## 0.5.6

### Patch Changes

- 81336114: add yjs support
- Updated dependencies [81336114]
  - @scalar/use-codemirror@0.5.4

## 0.5.5

### Patch Changes

- Updated dependencies [068669b6]
  - @scalar/use-codemirror@0.5.3

## 0.5.4

### Patch Changes

- Updated dependencies [ac492d94]
  - @scalar/use-codemirror@0.5.2

## 0.5.3

### Patch Changes

- a0a1590f: feat: make list of global extensions reactive

## 0.5.2

### Patch Changes

- d51aebe5: chore: remove source files from packages
- Updated dependencies [d51aebe5]
  - @scalar/swagger-parser@0.4.3
  - @scalar/use-codemirror@0.5.1

## 0.5.1

### Patch Changes

- Updated dependencies [4165b251]
  - @scalar/swagger-parser@0.4.2

## 0.5.0

### Minor Changes

- 0902d82c: \* feat: register custom CodeMirror extensions
  - feat: configure a status text to show in the Swagger editor
  - clean up: remove custom CSS to overwrite the CodeMirror themes

### Patch Changes

- 10498d9d: chore: add README
- 494083a0: add more information to the package.json
- Updated dependencies [0902d82c]
- Updated dependencies [10498d9d]
- Updated dependencies [494083a0]
  - @scalar/use-codemirror@0.5.0
  - @scalar/swagger-parser@0.4.1

## 0.4.0

### Minor Changes

- 5057e213: make npm packages public :-)

### Patch Changes

- Updated dependencies [5057e213]
  - @scalar/swagger-parser@0.4.0

## 0.3.0

### Minor Changes

- b0f5221: manually releasing all packages to make sure the lastest version is on npm

### Patch Changes

- Updated dependencies [b0f5221]
  - @scalar/swagger-parser@0.3.0

## 0.2.0

### Minor Changes

- a ton of fixes, new fastify plugin

### Patch Changes

- Updated dependencies
  - @scalar/swagger-parser@0.2.0

## 0.1.16

### Patch Changes

- fix: Node polyfill issues (process undefined)
- Updated dependencies
  - @scalar/swagger-parser@0.1.14

## 0.1.15

### Patch Changes

- add offline search and ui improvements
- add offline search, improve ui
- Updated dependencies
- Updated dependencies
  - @scalar/swagger-parser@0.1.13

## 0.1.14

### Patch Changes

- feat: add a standalone version
- Updated dependencies
  - @scalar/swagger-parser@0.1.12

## 0.1.13

### Patch Changes

- fix sidebar height issue
- Updated dependencies
  - @scalar/swagger-parser@0.1.11

## 0.1.12

### Patch Changes

- Updated dependencies
  - @scalar/swagger-parser@0.1.10

## 0.1.11

### Patch Changes

- Updated dependencies
  - @scalar/swagger-parser@0.1.9

## 0.1.10

### Patch Changes

- Updated dependencies
  - @scalar/swagger-parser@0.1.8

## 0.1.9

### Patch Changes

- fix incorrect font sizes

## 0.1.8

### Patch Changes

- css variable fixes and hocuspocusurl prop
- Updated dependencies
  - @scalar/swagger-parser@0.1.7

## 0.1.7

### Patch Changes

- fix: mismatched variables

## 0.1.6

### Patch Changes

- fix: issues with empty responses, minor styling issues
- Updated dependencies
  - @scalar/swagger-parser@0.1.6

## 0.1.5

### Patch Changes

- style: improve default style
- Updated dependencies
  - @scalar/swagger-parser@0.1.5

## 0.1.4

### Patch Changes

- fix: externalize dependencies
- Updated dependencies
  - @scalar/swagger-parser@0.1.4

## 0.1.3

### Patch Changes

- fix: add CSS file to swagger editor
- Updated dependencies
  - @scalar/swagger-parser@0.1.3

## 0.1.2

### Patch Changes

- 7cd41bc: fix: point main entry to dist folder
- Updated dependencies [7cd41bc]
  - @scalar/swagger-parser@0.1.2

## 0.1.1

### Patch Changes

- f46e320: Initial release 👀
- Updated dependencies [f46e320]
  - @scalar/swagger-parser@0.1.1
