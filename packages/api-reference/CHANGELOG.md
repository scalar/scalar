# @scalar/api-reference

## 0.7.11

### Patch Changes

- 1f064818: added scrolling to the sidebar on highlight
- 1bd5fb80: feat: add syntax highlighting to the markdown renderer

## 0.7.10

### Patch Changes

- c1cb507d: fix: search modal not scrolling to proper endpoints
- d1fcd043: ensure endpoint parent tag is open before trying to scroll

## 0.7.9

### Patch Changes

- 45ac0aaa: fix missing property description

## 0.7.8

### Patch Changes

- ab348cb5: Mobile improvements and layout fixes + consitency improvements
- 211ed1c7: polish up the models
- ca2689b6: feat: add example request body to example request generator
- ae247253: refactor: move generateRequest helpers to @scalar/api-reference
- 5896b08d: fix: add missing null check to jsonRequest requestBody
- Updated dependencies [ab348cb5]
- Updated dependencies [aa24dbe6]
- Updated dependencies [ae247253]
  - @scalar/api-client@0.7.21
  - @scalar/use-codemirror@0.7.9
  - @scalar/swagger-editor@0.6.24

## 0.7.7

### Patch Changes

- 0495c0f9: feat: show models ("schemas") in the reference
- 528df9d1: feat: add support for oneOf, anyOf, allOf, not schema rules
- 8915c5cf: fix: add null check to tag operations in sidebar
- d755d34e: fix: default show endpoint when tags have one endpoint
- a161c962: fix: better deal with empty descriptions
- 7e7ea175: feat: use default value in schemas for example responses

## 0.7.6

### Patch Changes

- d87566fd: refactor: new section components, new sidebar
- 43628366: Fix overflow and scrolling issues for API client
- 6131fa72: chore: update README
- dd8df965: feat: add requestbody to api client if json schema available
- 52534317: Fix references not respecting height on mobile Safari
- Updated dependencies [db7f5f57]
- Updated dependencies [d87566fd]
- Updated dependencies [8be53df2]
- Updated dependencies [4eaee866]
- Updated dependencies [43628366]
- Updated dependencies [06b46553]
- Updated dependencies [dd8df965]
  - @scalar/swagger-parser@0.5.5
  - @scalar/swagger-editor@0.6.23
  - @scalar/api-client@0.7.20

## 0.7.5

### Patch Changes

- fd875bc7: feat: show headings with a higher depth in the sidebar
- 28cce042: fix: externalize markdown plugins to not break SSG
- Updated dependencies [28cce042]
  - @scalar/api-client@0.7.19

## 0.7.4

### Patch Changes

- 51029c1d: add interactive params, headers and variables
- Updated dependencies [51029c1d]
  - @scalar/api-client@0.7.18

## 0.7.3

### Patch Changes

- 99936ab8: feat: add markdown headings to the sidebar
- 08e8f637: style: improve markdown code blocks

## 0.7.2

### Patch Changes

- fd6cf1bb: fix: too much recursion
- 357a174d: feat: fix import URL, use proxy to fetch files
- Updated dependencies [fd6cf1bb]
- Updated dependencies [357a174d]
- Updated dependencies [357a174d]
  - @scalar/swagger-parser@0.5.4
  - @scalar/swagger-editor@0.6.22

## 0.7.1

### Patch Changes

- 3c2bc6a9: style: update the search modal style

## 0.7.0

### Minor Changes

- fd38deb0: Add mobile menu and breadcrumbs

### Patch Changes

- Updated dependencies [fd38deb0]
  - @scalar/themes@0.4.0
  - @scalar/api-client@0.7.17
  - @scalar/swagger-editor@0.6.21

## 0.6.23

### Patch Changes

- af4ec8d3: update discord links
- e643b56e: Fix incorrectly named css variables
- c6ac9ff4: fix search modal reactivity
- 749f2f3f: fix: initial swagger editor content is parsed
- 91b09499: Fix breadcrums throwing error for specs without operations in tags
- Updated dependencies [af4ec8d3]
- Updated dependencies [749f2f3f]
  - @scalar/use-keyboard-event@0.5.3
  - @scalar/swagger-editor@0.6.20
  - @scalar/swagger-parser@0.5.3
  - @scalar/use-codemirror@0.7.8
  - @scalar/use-clipboard@0.5.5
  - @scalar/use-tooltip@0.5.4
  - @scalar/api-client@0.7.16
  - @scalar/use-toasts@0.5.5
  - @scalar/themes@0.3.11

## 0.6.22

### Patch Changes

- d4789991: fix: populate search fuse data immediately

## 0.6.21

### Patch Changes

- ea110ca0: feat: export SearchModal component
- 1cbcabd7: lots of amazing fixes from when we missed last patch
- 9d22b4ca: fix: make the base urls reactive
- 437c4b01: amazing sprint fixes
- Updated dependencies [33604a1b]
- Updated dependencies [1cbcabd7]
- Updated dependencies [d7b12610]
  - @scalar/swagger-parser@0.5.2
  - @scalar/api-client@0.7.15
  - @scalar/use-keyboard-event@0.5.2
  - @scalar/swagger-editor@0.6.19
  - @scalar/use-codemirror@0.7.7
  - @scalar/use-clipboard@0.5.4
  - @scalar/use-tooltip@0.5.3
  - @scalar/use-toasts@0.5.4
  - @scalar/use-modal@0.1.4
  - @scalar/themes@0.3.10

## 0.6.20

### Patch Changes

- 37353dd1: feat: add `data-proxy-url` to the HTML API
- Updated dependencies [a7f776ba]
  - @scalar/swagger-editor@0.6.18

## 0.6.19

### Patch Changes

- eb0c3201: Lot's of small things + bigger temp fix for the multi content cards
- Updated dependencies [eb0c3201]
  - @scalar/swagger-editor@0.6.17
  - @scalar/api-client@0.7.14
  - @scalar/themes@0.3.9

## 0.6.18

### Patch Changes

- Updated dependencies [3805e649]
  - @scalar/swagger-editor@0.6.16

## 0.6.17

### Patch Changes

- Updated dependencies [be239745]
  - @scalar/use-codemirror@0.7.6
  - @scalar/api-client@0.7.13
  - @scalar/swagger-editor@0.6.15

## 0.6.16

### Patch Changes

- 0f87c35d: feat: add dark mode toggle 👀
- 3dd2574d: sidebar toggle not flex aligned + fix folder colors
- Updated dependencies [30aee7d1]
- Updated dependencies [99744358]
- Updated dependencies [24deb723]
- Updated dependencies [3dd2574d]
  - @scalar/api-client@0.7.12
  - @scalar/swagger-editor@0.6.14

## 0.6.15

### Patch Changes

- 7b6c21e5: request history ui and some other small type changes
- Updated dependencies [7b6c21e5]
  - @scalar/api-client@0.7.11
  - @scalar/use-modal@0.1.3
  - @scalar/swagger-editor@0.6.13

## 0.6.14

### Patch Changes

- 46142c0a: reference theme fixes
- Updated dependencies [46142c0a]
  - @scalar/swagger-editor@0.6.12
  - @scalar/api-client@0.7.10
  - @scalar/themes@0.3.8

## 0.6.13

### Patch Changes

- 727d7f47: make swagger editor tab state controllable via prop
- Updated dependencies [727d7f47]
- Updated dependencies [727d7f47]
  - @scalar/swagger-editor@0.6.11

## 0.6.12

### Patch Changes

- Updated dependencies [4b4bc4d7]
- Updated dependencies [30d54d16]
- Updated dependencies [48df28ef]
- Updated dependencies [1d02c811]
  - @scalar/api-client@0.7.9
  - @scalar/themes@0.3.7
  - @scalar/swagger-editor@0.6.10

## 0.6.11

### Patch Changes

- b76f4d1e: Reference search + some app hover states
- Updated dependencies [b76f4d1e]
  - @scalar/swagger-editor@0.6.9
  - @scalar/use-codemirror@0.7.5
  - @scalar/api-client@0.7.8
  - @scalar/use-modal@0.1.2
  - @scalar/themes@0.3.6

## 0.6.10

### Patch Changes

- 07b99141: api client in refs touch ups
- Updated dependencies [07b99141]
  - @scalar/api-client@0.7.7

## 0.6.9

### Patch Changes

- 4985562c: polish codemirror theme colors
- Updated dependencies [4985562c]
  - @scalar/use-codemirror@0.7.4
  - @scalar/themes@0.3.5
  - @scalar/api-client@0.7.6
  - @scalar/swagger-editor@0.6.8

## 0.6.8

### Patch Changes

- Updated dependencies [58af0623]
  - @scalar/use-codemirror@0.7.3
  - @scalar/api-client@0.7.5
  - @scalar/swagger-editor@0.6.7

## 0.6.7

### Patch Changes

- cd5f2685: codemirror colors + font fixes throughout app
- Updated dependencies [cd5f2685]
  - @scalar/swagger-editor@0.6.6
  - @scalar/api-client@0.7.4
  - @scalar/use-toasts@0.5.3
  - @scalar/themes@0.3.4
  - @scalar/use-clipboard@0.5.3

## 0.6.6

### Patch Changes

- 8823d7a1: cleanup ui
- Updated dependencies [8823d7a1]
  - @scalar/use-codemirror@0.7.2
  - @scalar/api-client@0.7.3
  - @scalar/swagger-editor@0.6.5

## 0.6.5

### Patch Changes

- Updated dependencies [5363374d]
  - @scalar/swagger-editor@0.6.4

## 0.6.4

### Patch Changes

- 449305f4: marketing content section
- 3e912c75: getting started page design
- 048555c6: feat: add CHANGELOG.md to the package
- df62875a: fix: don’t render tags without endpoints, use path as fallback for the endpoint heading
- Updated dependencies [449305f4]
- Updated dependencies [3e912c75]
- Updated dependencies [048555c6]
  - @scalar/swagger-editor@0.6.3
  - @scalar/api-client@0.7.2
  - @scalar/use-modal@0.1.1
  - @scalar/use-keyboard-event@0.5.1
  - @scalar/swagger-parser@0.5.1
  - @scalar/use-codemirror@0.7.1
  - @scalar/use-clipboard@0.5.2
  - @scalar/use-tooltip@0.5.2
  - @scalar/use-toasts@0.5.2
  - @scalar/themes@0.3.3

## 0.6.3

### Patch Changes

- 75a69ba7: feat: add `theme` prop and improve theme support
- effc1f31: feat: add new HTML API based on script tags
  chore: deprecate old div based HTML API
- 75a69ba7: refactor: rename @scalar/default-theme to @scalar/themes, add more themes
- b03a09c7: chore: remove Vite env proxy variable
- 11270915: fix: use higher z-index values
- Updated dependencies [75a69ba7]
- Updated dependencies [d6a10e1f]
- Updated dependencies [75a69ba7]
  - @scalar/swagger-editor@0.6.2
  - @scalar/api-client@0.7.1
  - @scalar/themes@0.3.2

## 0.6.2

### Patch Changes

- b184bdf2: codemirror themeing and other theme fixes
- e9861139: feat: pass an already parsed OpenAPI spec to the ApiReference component
- 8751c874: Fix background color not being applied below rendered references
- addd9fa2: feat: use `default` prefix for all CSS variables
- Updated dependencies [b184bdf2]
- Updated dependencies [6caceb45]
- Updated dependencies [8751c874]
- Updated dependencies [3b1fec80]
- Updated dependencies [addd9fa2]
- Updated dependencies [2006aa43]
  - @scalar/swagger-editor@0.6.1
  - @scalar/use-codemirror@0.7.0
  - @scalar/default-theme@0.3.1
  - @scalar/api-client@0.7.0
  - @scalar/use-tooltip@0.5.1
  - @scalar/use-toasts@0.5.1
  - @scalar/use-clipboard@0.5.1

## 0.6.1

### Patch Changes

- 5a5e760f: fix: use .js as file extension for the browser build

## 0.6.0

### Minor Changes

- 87fda5af: chore: update dependencies

### Patch Changes

- ef080a26: chore: format package.json
- 9d925e1c: feat: add browser build to the package
- 2cfc8786: feat: add a ton more clients to render example requests
- Updated dependencies [ef080a26]
- Updated dependencies [87fda5af]
- Updated dependencies [45645710]
  - @scalar/use-keyboard-event@0.5.0
  - @scalar/swagger-editor@0.6.0
  - @scalar/swagger-parser@0.5.0
  - @scalar/use-codemirror@0.6.0
  - @scalar/themes@0.3.0
  - @scalar/use-clipboard@0.5.0
  - @scalar/use-tooltip@0.5.0
  - @scalar/api-client@0.6.0
  - @scalar/use-toasts@0.5.0

## 0.5.6

### Patch Changes

- 81336114: add yjs support
- Updated dependencies [81336114]
  - @scalar/swagger-editor@0.5.6
  - @scalar/use-codemirror@0.5.4
  - @scalar/api-client@0.5.5

## 0.5.5

### Patch Changes

- Updated dependencies [068669b6]
  - @scalar/use-codemirror@0.5.3
  - @scalar/api-client@0.5.4
  - @scalar/swagger-editor@0.5.5

## 0.5.4

### Patch Changes

- Updated dependencies [ac492d94]
  - @scalar/use-codemirror@0.5.2
  - @scalar/api-client@0.5.3
  - @scalar/swagger-editor@0.5.4

## 0.5.3

### Patch Changes

- Updated dependencies [a0a1590f]
  - @scalar/swagger-editor@0.5.3

## 0.5.2

### Patch Changes

- d51aebe5: chore: remove source files from packages
- Updated dependencies [d51aebe5]
  - @scalar/use-keyboard-event@0.4.2
  - @scalar/swagger-editor@0.5.2
  - @scalar/swagger-parser@0.4.3
  - @scalar/use-codemirror@0.5.1
  - @scalar/use-clipboard@0.4.2
  - @scalar/use-tooltip@0.4.2
  - @scalar/api-client@0.5.2

## 0.5.1

### Patch Changes

- 4165b251: feat: improve rendering of complex swagger files
- Updated dependencies [e49cdc3a]
- Updated dependencies [4165b251]
  - @scalar/api-client@0.5.1
  - @scalar/swagger-parser@0.4.2
  - @scalar/swagger-editor@0.5.1

## 0.5.0

### Minor Changes

- 0902d82c: \* refactor: add the CodeMirror component to @scalar/use-codemirror, use it everywhere
  - feat: allow to pass forceDarkMode to the CodeMirror component

### Patch Changes

- 10498d9d: chore: add README
- 494083a0: add more information to the package.json
- Updated dependencies [0902d82c]
- Updated dependencies [0902d82c]
- Updated dependencies [10498d9d]
- Updated dependencies [494083a0]
  - @scalar/swagger-editor@0.5.0
  - @scalar/use-codemirror@0.5.0
  - @scalar/api-client@0.5.0
  - @scalar/use-keyboard-event@0.4.1
  - @scalar/swagger-parser@0.4.1
  - @scalar/themes@0.2.1
  - @scalar/use-clipboard@0.4.1
  - @scalar/use-tooltip@0.4.1
  - @scalar/use-toasts@0.4.1

## 0.4.0

### Minor Changes

- 5057e213: make npm packages public :-)

### Patch Changes

- Updated dependencies [5057e213]
  - @scalar/api-client@0.4.0
  - @scalar/themes@0.2.0
  - @scalar/swagger-editor@0.4.0
  - @scalar/swagger-parser@0.4.0
  - @scalar/use-clipboard@0.4.0
  - @scalar/use-keyboard-event@0.4.0
  - @scalar/use-toasts@0.4.0
  - @scalar/use-tooltip@0.4.0

## 0.3.4

### Patch Changes

- Updated dependencies [027012c8]
  - @scalar/api-client@0.3.4

## 0.3.3

### Patch Changes

- 6420305b: fix: only require nunjucks where it’s needed
- Updated dependencies [6420305b]
  - @scalar/api-client@0.3.3

## 0.3.2

### Patch Changes

- de4ff38: feat: add a new @scalar/themes package to import the variables and custom scrollbar CSS
- Updated dependencies [de4ff38]
  - @scalar/themes@0.1.1
  - @scalar/api-client@0.3.2

## 0.3.1

### Patch Changes

- 0f345e4: fix: import CSS file from component, makes sure the CSS is included in the build
- Updated dependencies [0f345e4]
  - @scalar/api-client@0.3.1

## 0.3.0

### Minor Changes

- b0f5221: manually releasing all packages to make sure the lastest version is on npm

### Patch Changes

- Updated dependencies [b0f5221]
  - @scalar/api-client@0.3.0
  - @scalar/swagger-editor@0.3.0
  - @scalar/swagger-parser@0.3.0
  - @scalar/use-clipboard@0.3.0
  - @scalar/use-keyboard-event@0.3.0
  - @scalar/use-toasts@0.3.0
  - @scalar/use-tooltip@0.3.0

## 0.2.1

### Patch Changes

- 41b06cb: fix: scope search modal keyboard events
- Updated dependencies [41b06cb]
  - @scalar/use-keyboard-event@0.2.1
  - @scalar/api-client@0.2.1

## 0.2.0

### Minor Changes

- a ton of fixes, new fastify plugin

### Patch Changes

- Updated dependencies
  - @scalar/api-client@0.2.0
  - @scalar/swagger-editor@0.2.0
  - @scalar/swagger-parser@0.2.0
  - @scalar/use-clipboard@0.2.0
  - @scalar/use-keyboard-event@0.2.0
  - @scalar/use-tooltip@0.2.0

## 0.1.31

### Patch Changes

- fix: Node polyfill issues (process undefined)
- Updated dependencies
  - @scalar/api-client@0.1.21
  - @scalar/swagger-editor@0.1.16
  - @scalar/swagger-parser@0.1.14

## 0.1.30

### Patch Changes

- add offline search and ui improvements
- add offline search, improve ui
- Updated dependencies
- Updated dependencies
  - @scalar/api-client@0.1.20
  - @scalar/swagger-editor@0.1.15
  - @scalar/swagger-parser@0.1.13

## 0.1.29

### Patch Changes

- feat: add a standalone version
- Updated dependencies
  - @scalar/api-client@0.1.19
  - @scalar/swagger-editor@0.1.14
  - @scalar/swagger-parser@0.1.12

## 0.1.28

### Patch Changes

- add: language selector supersede classes

## 0.1.27

### Patch Changes

- fix sidebar height issue
- Updated dependencies
  - @scalar/api-client@0.1.18
  - @scalar/swagger-editor@0.1.13

## 0.1.26

### Patch Changes

- fix: add server null check

## 0.1.25

### Patch Changes

- fix empty servers edge case

## 0.1.24

### Patch Changes

- add slots to modal

## 0.1.23

### Patch Changes

- @scalar/swagger-editor@0.1.12

## 0.1.22

### Patch Changes

- @scalar/swagger-editor@0.1.11

## 0.1.21

### Patch Changes

- @scalar/swagger-editor@0.1.10

## 0.1.20

### Patch Changes

- fix incorrect font sizes
- Updated dependencies
  - @scalar/api-client@0.1.17
  - @scalar/swagger-editor@0.1.9

## 0.1.19

### Patch Changes

- add missing hocuspocus url prop

## 0.1.18

### Patch Changes

- css variable fixes and hocuspocusurl prop
- Updated dependencies
  - @scalar/api-client@0.1.16
  - @scalar/swagger-editor@0.1.8

## 0.1.17

### Patch Changes

- fix: mismatched variables
- Updated dependencies
  - @scalar/api-client@0.1.15
  - @scalar/swagger-editor@0.1.7

## 0.1.16

### Patch Changes

- update font weights
- Updated dependencies
  - @scalar/api-client@0.1.14

## 0.1.15

### Patch Changes

- fix: use scalar fonts
- Updated dependencies
  - @scalar/api-client@0.1.13

## 0.1.14

### Patch Changes

- add useClientStore export
- Updated dependencies
  - @scalar/api-client@0.1.12

## 0.1.13

### Patch Changes

- add store export
- Updated dependencies
  - @scalar/api-client@0.1.11

## 0.1.12

### Patch Changes

- add force show to client
- Updated dependencies
  - @scalar/api-client@0.1.10

## 0.1.11

### Patch Changes

- Updated dependencies
  - @scalar/api-client@0.1.9

## 0.1.10

### Patch Changes

- Updated dependencies
  - @scalar/api-client@0.1.8

## 0.1.9

### Patch Changes

- fix variables and missing styles
- Updated dependencies
  - @scalar/api-client@0.1.7

## 0.1.8

### Patch Changes

- 0d8f0f0: fix layout changes

## 0.1.7

### Patch Changes

- fix: issues with empty responses, minor styling issues
- Updated dependencies
  - @scalar/api-client@0.1.6
  - @scalar/swagger-editor@0.1.6

## 0.1.6

### Patch Changes

- style: improve default style
- Updated dependencies
  - @scalar/api-client@0.1.5
  - @scalar/swagger-editor@0.1.5

## 0.1.5

### Patch Changes

- fix: externalize dependencies
- Updated dependencies
  - @scalar/api-client@0.1.4
  - @scalar/swagger-editor@0.1.4
  - @scalar/use-clipboard@0.1.4
  - @scalar/use-tooltip@0.1.4

## 0.1.4

### Patch Changes

- fix: add CSS file to swagger editor
- Updated dependencies
  - @scalar/api-client@0.1.3
  - @scalar/swagger-editor@0.1.3
  - @scalar/use-clipboard@0.1.3
  - @scalar/use-codemirror@0.1.3
  - @scalar/use-tooltip@0.1.3

## 0.1.3

### Patch Changes

- e6f4941: fix: basic default styles

## 0.1.2

### Patch Changes

- 7cd41bc: fix: point main entry to dist folder
- Updated dependencies [7cd41bc]
  - @scalar/api-client@0.1.2
  - @scalar/swagger-editor@0.1.2
  - @scalar/use-clipboard@0.1.2
  - @scalar/use-codemirror@0.1.2
  - @scalar/use-tooltip@0.1.2

## 0.1.1

### Patch Changes

- f46e320: Initial release 👀
- Updated dependencies [f46e320]
  - @scalar/api-client@0.1.1
  - @scalar/swagger-editor@0.1.1
  - @scalar/use-clipboard@0.1.1
  - @scalar/use-codemirror@0.1.1
  - @scalar/use-tooltip@0.1.1
