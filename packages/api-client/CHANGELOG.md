# @scalar/api-client

## 0.8.8

### Patch Changes

- 0e0f34b3: fix: cleanup safari bugs

## 0.8.7

### Patch Changes

- c171c9d9: fix: request body doesn’t reset on navigating to a request without a body
- Updated dependencies [c171c9d9]
  - @scalar/use-codemirror@0.7.17

## 0.8.6

### Patch Changes

- 06f800cc: fix: regression ui bugs

## 0.8.5

### Patch Changes

- bf29f8df: fix: add text/plain support

## 0.8.4

### Patch Changes

- 0f9791b7: fix: add null check to cookies and proper withCredentials set on cookie addition

## 0.8.3

### Patch Changes

- 5d6b539b: feat: toggle parameters to include/exclude them in/from the request
- a1319e8b: Switched internal component library to use ScalarComponents instead
- Updated dependencies [a1319e8b]
  - @scalar/use-codemirror@0.7.16
  - @scalar/use-modal@0.2.1
  - @scalar/themes@0.5.1

## 0.8.2

### Patch Changes

- edb02e76: fix: windows select menu not updating on prefers color scheme

## 0.8.1

### Patch Changes

- f87910d: feat: prefill path, header, cookie, query parameters from the spec

## 0.8.0

### Minor Changes

- f38bb61: chore: remove swagger editor tabs

### Patch Changes

- 349589a: feat: expose spec content updates
- Updated dependencies [f38bb61]
  - @scalar/use-modal@0.2.0
  - @scalar/themes@0.5.0

## 0.7.37

### Patch Changes

- b65840b: refactor: keep track of the collapsed sidebar items in @scalar/api-reference

## 0.7.36

### Patch Changes

- bc23e62: fix: don’t trim / from the path, if it’s the only character

## 0.7.35

### Patch Changes

- fdaabfe: fix: surface proxy internal service errors
- fdaabfe: fix: catch axios errors and show them in the response

## 0.7.34

### Patch Changes

- 35dffe4: chore: include @scalar dependencies in the bundle
- Updated dependencies [35dffe4]
  - @scalar/use-keyboard-event@0.5.6
  - @scalar/use-codemirror@0.7.15
  - @scalar/use-modal@0.1.9

## 0.7.33

### Patch Changes

- c3b215f: chore: no pinned peer dependency versions
- Updated dependencies [c3b215f]
  - @scalar/use-keyboard-event@0.5.5
  - @scalar/use-codemirror@0.7.14
  - @scalar/use-modal@0.1.8
  - @scalar/themes@0.4.2

## 0.7.32

### Patch Changes

- 55246e5: chore: rewrite all package.jsons (including their prod, dev and peer dependency requirements)
- Updated dependencies [55246e5]
  - @scalar/use-keyboard-event@0.5.4
  - @scalar/use-codemirror@0.7.13
  - @scalar/use-modal@0.1.7
  - @scalar/themes@0.4.1

## 0.7.31

### Patch Changes

- ceb7952: fix: show non 200 responses when not using the proxy

## 0.7.30

### Patch Changes

- 5da1fc6: security: update axios from 1.5.0 to 1.6.1

## 0.7.29

### Patch Changes

- 7fb2302: chore: add findVariables helper

## 0.7.28

### Patch Changes

- dab853a: chore: remove unused dependencies
- Updated dependencies [f4681d5]
- Updated dependencies [dab853a]
  - @scalar/use-codemirror@0.7.12
  - @scalar/use-modal@0.1.6

## 0.7.27

### Patch Changes

- c470db5: make --theme priority over --default-theme in misc places
- da431d9: fix: minor styling issues in the macOS native web view
- 3c6f54f: refactor: sendRequest with and without proxy
- 509db1e: refactor: move all api reference refs and watchers to hooks
- Updated dependencies [b0835a2]
- Updated dependencies [509db1e]
- Updated dependencies [a4f1b08]
  - @scalar/use-modal@0.1.5
  - @scalar/use-codemirror@0.7.11

## 0.7.26

### Patch Changes

- 9c7a5722: feat: add a dedicated cookie panel

## 0.7.25

### Patch Changes

- 8e2e4e5a: fix markdown collisions + prefix the card name

## 0.7.24

### Patch Changes

- 2f0b2f01: refactor: move json helpers to separate files

## 0.7.23

### Patch Changes

- 64f8a018: fix: make inputs consistent
- ce04794a: fix: issue where browser froze with JSON being passed into codemirror body
- Updated dependencies [64f8a018]
- Updated dependencies [7c3091c6]
  - @scalar/use-codemirror@0.7.10

## 0.7.22

### Patch Changes

- df74d017: fix: read response body from non-proxied requests
- 75d12f56: fix: don’t overwrite the address on small screens

## 0.7.21

### Patch Changes

- ab348cb5: Mobile improvements and layout fixes + consitency improvements
- aa24dbe6: fix: api client reset CSS
- ae247253: refactor: move generateRequest helpers to @scalar/api-reference
- Updated dependencies [aa24dbe6]
  - @scalar/use-codemirror@0.7.9

## 0.7.20

### Patch Changes

- d87566fd: refactor: new section components, new sidebar
- 43628366: Fix overflow and scrolling issues for API client
- dd8df965: feat: add requestbody to api client if json schema available

## 0.7.19

### Patch Changes

- 28cce042: fix: externalize markdown plugins to not break SSG

## 0.7.18

### Patch Changes

- 51029c1d: add interactive params, headers and variables

## 0.7.17

### Patch Changes

- Updated dependencies [fd38deb0]
  - @scalar/themes@0.4.0

## 0.7.16

### Patch Changes

- af4ec8d3: update discord links
- Updated dependencies [af4ec8d3]
  - @scalar/use-keyboard-event@0.5.3
  - @scalar/use-codemirror@0.7.8
  - @scalar/themes@0.3.11

## 0.7.15

### Patch Changes

- 33604a1b: chore: fix types
- 1cbcabd7: lots of amazing fixes from when we missed last patch
- Updated dependencies [1cbcabd7]
  - @scalar/use-keyboard-event@0.5.2
  - @scalar/use-codemirror@0.7.7
  - @scalar/use-modal@0.1.4
  - @scalar/themes@0.3.10

## 0.7.14

### Patch Changes

- eb0c3201: Lot's of small things + bigger temp fix for the multi content cards
- Updated dependencies [eb0c3201]
  - @scalar/themes@0.3.9

## 0.7.13

### Patch Changes

- Updated dependencies [be239745]
  - @scalar/use-codemirror@0.7.6

## 0.7.12

### Patch Changes

- 30aee7d1: feat: detect JSON in the body and automatically add a JSON content-type header to the request
- 24deb723: feat: add basic authentication and bearer authentication

## 0.7.11

### Patch Changes

- 7b6c21e5: request history ui and some other small type changes
- Updated dependencies [7b6c21e5]
  - @scalar/use-modal@0.1.3

## 0.7.10

### Patch Changes

- 46142c0a: reference theme fixes
- Updated dependencies [46142c0a]
  - @scalar/themes@0.3.8

## 0.7.9

### Patch Changes

- 4b4bc4d7: fix: update the URL
- 30d54d16: feat: make request method selectable
- 48df28ef: feat: disable send button if URL is empty
- Updated dependencies [1d02c811]
  - @scalar/themes@0.3.7

## 0.7.8

### Patch Changes

- b76f4d1e: Reference search + some app hover states
- Updated dependencies [b76f4d1e]
  - @scalar/use-codemirror@0.7.5
  - @scalar/use-modal@0.1.2
  - @scalar/themes@0.3.6

## 0.7.7

### Patch Changes

- 07b99141: api client in refs touch ups

## 0.7.6

### Patch Changes

- Updated dependencies [4985562c]
  - @scalar/use-codemirror@0.7.4
  - @scalar/themes@0.3.5

## 0.7.5

### Patch Changes

- Updated dependencies [58af0623]
  - @scalar/use-codemirror@0.7.3

## 0.7.4

### Patch Changes

- cd5f2685: codemirror colors + font fixes throughout app
- Updated dependencies [cd5f2685]
  - @scalar/themes@0.3.4

## 0.7.3

### Patch Changes

- 8823d7a1: cleanup ui
- Updated dependencies [8823d7a1]
  - @scalar/use-codemirror@0.7.2

## 0.7.2

### Patch Changes

- 449305f4: marketing content section
- 048555c6: feat: add CHANGELOG.md to the package
- Updated dependencies [449305f4]
- Updated dependencies [3e912c75]
- Updated dependencies [048555c6]
  - @scalar/use-modal@0.1.1
  - @scalar/use-keyboard-event@0.5.1
  - @scalar/use-codemirror@0.7.1
  - @scalar/themes@0.3.3

## 0.7.1

### Patch Changes

- 75a69ba7: feat: add `theme` prop and improve theme support
- 75a69ba7: refactor: rename @scalar/default-theme to @scalar/themes, add more themes
- Updated dependencies [75a69ba7]
- Updated dependencies [75a69ba7]
  - @scalar/themes@0.3.2

## 0.7.0

### Minor Changes

- 3b1fec80: feat: show response body preview for json and html, add html syntax highlighting, no preview for unknown content

### Patch Changes

- 6caceb45: - feat: send query parameters
  - feat: add a readOnly prop to the <APIClient /> component
  - fix: removed broken button loading state, replaced with boring loader animation
  - fix: z-index issue with API client, search and the request history
  - refactor: replace font sizes with variables, fix some minor font size issues
  - remove default User-Agent header (browser doesn’t like setting the User-Agent header)
  - chore: moved FlowModal to its own package
- addd9fa2: feat: use `default` prefix for all CSS variables
- Updated dependencies [b184bdf2]
- Updated dependencies [3b1fec80]
- Updated dependencies [addd9fa2]
  - @scalar/use-codemirror@0.7.0
  - @scalar/default-theme@0.3.1

## 0.6.0

### Minor Changes

- 87fda5af: chore: update dependencies

### Patch Changes

- ef080a26: chore: format package.json
- Updated dependencies [ef080a26]
- Updated dependencies [87fda5af]
  - @scalar/use-keyboard-event@0.5.0
  - @scalar/use-codemirror@0.6.0
  - @scalar/themes@0.3.0

## 0.5.5

### Patch Changes

- Updated dependencies [81336114]
  - @scalar/use-codemirror@0.5.4

## 0.5.4

### Patch Changes

- Updated dependencies [068669b6]
  - @scalar/use-codemirror@0.5.3

## 0.5.3

### Patch Changes

- Updated dependencies [ac492d94]
  - @scalar/use-codemirror@0.5.2

## 0.5.2

### Patch Changes

- d51aebe5: chore: remove source files from packages
- Updated dependencies [d51aebe5]
  - @scalar/use-keyboard-event@0.4.2
  - @scalar/use-codemirror@0.5.1

## 0.5.1

### Patch Changes

- e49cdc3a: chore: remove nunjucks as a dependency

## 0.5.0

### Minor Changes

- 0902d82c: \* refactor: add the CodeMirror component to @scalar/use-codemirror, use it everywhere
  - feat: allow to pass forceDarkMode to the CodeMirror component

### Patch Changes

- 10498d9d: chore: add README
- 494083a0: add more information to the package.json
- Updated dependencies [0902d82c]
- Updated dependencies [10498d9d]
- Updated dependencies [494083a0]
  - @scalar/use-codemirror@0.5.0
  - @scalar/use-keyboard-event@0.4.1
  - @scalar/themes@0.2.1

## 0.4.0

### Minor Changes

- 5057e213: make npm packages public :-)

### Patch Changes

- Updated dependencies [5057e213]
  - @scalar/themes@0.2.0
  - @scalar/use-codemirror@0.4.0
  - @scalar/use-keyboard-event@0.4.0

## 0.3.4

### Patch Changes

- 027012c8: fix: make nunjucks an external dependency

## 0.3.3

### Patch Changes

- 6420305b: fix: only require nunjucks where it’s needed
- Updated dependencies [6420305b]
  - @scalar/use-codemirror@0.3.1

## 0.3.2

### Patch Changes

- de4ff38: feat: add a new @scalar/themes package to import the variables and custom scrollbar CSS
- Updated dependencies [de4ff38]
  - @scalar/themes@0.1.1

## 0.3.1

### Patch Changes

- 0f345e4: fix: import CSS file from component, makes sure the CSS is included in the build

## 0.3.0

### Minor Changes

- b0f5221: manually releasing all packages to make sure the lastest version is on npm

### Patch Changes

- Updated dependencies [b0f5221]
  - @scalar/use-codemirror@0.3.0
  - @scalar/use-keyboard-event@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [41b06cb]
  - @scalar/use-keyboard-event@0.2.1

## 0.2.0

### Minor Changes

- a ton of fixes, new fastify plugin

### Patch Changes

- Updated dependencies
  - @scalar/use-codemirror@0.2.0
  - @scalar/use-keyboard-event@0.2.0

## 0.1.21

### Patch Changes

- fix: Node polyfill issues (process undefined)

## 0.1.20

### Patch Changes

- add offline search and ui improvements
- add offline search, improve ui

## 0.1.19

### Patch Changes

- feat: add a standalone version

## 0.1.18

### Patch Changes

- fix sidebar height issue

## 0.1.17

### Patch Changes

- fix incorrect font sizes

## 0.1.16

### Patch Changes

- css variable fixes and hocuspocusurl prop

## 0.1.15

### Patch Changes

- fix: mismatched variables

## 0.1.14

### Patch Changes

- update font weights

## 0.1.13

### Patch Changes

- fix: use scalar fonts

## 0.1.12

### Patch Changes

- add useClientStore export

## 0.1.11

### Patch Changes

- add store export

## 0.1.10

### Patch Changes

- add force show to client

## 0.1.9

### Patch Changes

- update scalar variables

## 0.1.8

### Patch Changes

- remove hardcoded colors

## 0.1.7

### Patch Changes

- fix variables and missing styles

## 0.1.6

### Patch Changes

- fix: issues with empty responses, minor styling issues

## 0.1.5

### Patch Changes

- style: improve default style

## 0.1.4

### Patch Changes

- fix: externalize dependencies
- Updated dependencies
  - @scalar/use-codemirror@0.1.4
  - @scalar/use-keyboard-event@0.1.4

## 0.1.3

### Patch Changes

- fix: add CSS file to swagger editor
- Updated dependencies
  - @scalar/use-codemirror@0.1.3
  - @scalar/use-keyboard-event@0.1.3

## 0.1.2

### Patch Changes

- 7cd41bc: fix: point main entry to dist folder
- Updated dependencies [7cd41bc]
  - @scalar/use-codemirror@0.1.2
  - @scalar/use-keyboard-event@0.1.2

## 0.1.1

### Patch Changes

- f46e320: Initial release 👀
- Updated dependencies [f46e320]
  - @scalar/use-codemirror@0.1.1
  - @scalar/use-keyboard-event@0.1.1
