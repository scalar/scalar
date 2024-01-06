# @scalar/api-reference

## 1.12.8

### Patch Changes

- 859977f8: feat: Add dynamic content type selection for request body

## 1.12.7

### Patch Changes

- 0b66933d: fix: declare theme font for buttons and fix regressed font weight
- Updated dependencies [0b66933d]
  - @scalar/swagger-editor@0.9.2

## 1.12.6

### Patch Changes

- 87ed7f01: fix: markdown second level margin issue

## 1.12.5

### Patch Changes

- 4513c725: feat: add intro flare for gradients

## 1.12.4

### Patch Changes

- 06f800cc: fix: regression ui bugs
- Updated dependencies [06f800cc]
  - @scalar/api-client@0.8.6

## 1.12.3

### Patch Changes

- bf29f8df: fix: add text/plain support
- Updated dependencies [bf29f8df]
  - @scalar/api-client@0.8.5

## 1.12.2

### Patch Changes

- 0f9791b7: fix: add null check to cookies and proper withCredentials set on cookie addition
- Updated dependencies [0f9791b7]
  - @scalar/api-client@0.8.4

## 1.12.1

### Patch Changes

- 54be5027: fix: make fuse data reactive
- 6c4d608f: refactor: scope all sidebar styles

## 1.12.0

### Minor Changes

- 1c4f4c88: feat: classic layout polish

### Patch Changes

- 432d16fe: feat: add an OpenAuth2 interface
- Updated dependencies [1c4f4c88]
- Updated dependencies [2d7e3e6e]
  - @scalar/components@0.2.0
  - @scalar/swagger-editor@0.9.1

## 1.11.1

### Patch Changes

- 855a6713: fix: remove caching of configuration when updating spec as prop
- 5f270ca4: chore: export stores and helpers
- 6cbb5a65: refactor: use Schema component to render parameters and response body

## 1.11.0

### Minor Changes

- 1972947f: chore: removed yjs and hocus pocus from swagger editor

### Patch Changes

- e99eb215: fix: align mobile navigation to header
- cf30daa2: fix: add JSON.stringify to undici body
- 4b28e96c: style: add position sticky to endpoints overview
- Updated dependencies [1972947f]
  - @scalar/swagger-editor@0.9.0

## 1.10.2

### Patch Changes

- 70f33ea2: fix: references mobile menu position relative bug

## 1.10.1

### Patch Changes

- 01afd152: fix: sidebar on mobile doesnt close once changing active item

## 1.10.0

### Minor Changes

- f2a7a214: feat: remove border from introduction card headings

### Patch Changes

- 5efb80bb: feat: add undici example requests
- 8436e115: feat: classic introduction layout
- 5d6b539b: feat: toggle parameters to include/exclude them in/from the request
- c24583ba: feat: show schema description in parameter item
- a1319e8b: Switched internal component library to use ScalarComponents instead
- d1caa4ee: fix: self contain app and toast containers + size changing fix
- Updated dependencies [5d6b539b]
- Updated dependencies [a1319e8b]
- Updated dependencies [d1caa4ee]
  - @scalar/api-client@0.8.3
  - @scalar/components@0.1.0
  - @scalar/swagger-editor@0.8.4
  - @scalar/swagger-parser@0.5.13
  - @scalar/use-codemirror@0.7.16
  - @scalar/use-modal@0.2.1
  - @scalar/themes@0.5.1
  - @scalar/use-toasts@0.5.11
  - @scalar/use-clipboard@0.5.11

## 1.9.2

### Patch Changes

- 648e5a98: chore: don’t add optional parameters to the client

## 1.9.1

### Patch Changes

- edb02e76: fix: windows select menu not updating on prefers color scheme
- Updated dependencies [edb02e76]
  - @scalar/api-client@0.8.2

## 1.9.0

### Minor Changes

- c45ae5e8: feat: add accordion layout for schema models

### Patch Changes

- d7da3147: fix: remove duplicate slash in example and client

## 1.8.0

### Minor Changes

- f9bfa97: feat: add buttons to header for classic layout

### Patch Changes

- d45f5a5: fix: handle root path in request generation
- Updated dependencies [f9bfa97]
  - @scalar/swagger-editor@0.8.3
  - @scalar/use-toasts@0.5.10
  - @scalar/use-clipboard@0.5.10

## 1.7.1

### Patch Changes

- 4423876: chore: make Axios the default client for Node.js
- 4423876: chore: remove unirest and node-fetch from the client lists

## 1.7.0

### Minor Changes

- 4f2fcc3: feat: classic layout content

### Patch Changes

- Updated dependencies [4f2fcc3]
  - @scalar/swagger-editor@0.8.2

## 1.6.1

### Patch Changes

- f87910d: feat: prefill path, header, cookie, query parameters from the spec
- Updated dependencies [f87910d]
  - @scalar/api-client@0.8.1

## 1.6.0

### Minor Changes

- c04c2ea: feat: show references sidebar slot content in api client sidebar

### Patch Changes

- 90ffeb5: refactor: extract layout type into component
- 98e01a2: fix: prevent css leakage from references reset
- 654333a: fix: oneOf rules for arrays are ignored
- 84c0c77: chore: change Download OpenAPI Spec button text
- 4e5d00e: style: visualize deprecated operations
- Updated dependencies [98e01a2]
- Updated dependencies [c04c2ea]
  - @scalar/swagger-editor@0.8.1

## 1.5.0

### Minor Changes

- f38bb61: chore: remove swagger editor tabs

### Patch Changes

- 349589a: feat: expose spec content updates
- Updated dependencies [349589a]
- Updated dependencies [f38bb61]
  - @scalar/api-client@0.8.0
  - @scalar/swagger-editor@0.8.0
  - @scalar/use-modal@0.2.0
  - @scalar/themes@0.5.0

## 1.4.0

### Minor Changes

- b974eeb: feat: swagger UI style layout

### Patch Changes

- b65840b: refactor: keep track of the collapsed sidebar items in @scalar/api-reference
- 95fbc01: fix: hono middleware fails to read configuration.spec.content
- b65840b: fix: URL doesn’t match the active sidebar item
- Updated dependencies [b65840b]
  - @scalar/api-client@0.7.37

## 1.3.0

### Minor Changes

- 37b974c: feat: expose footer slot on standalone component

### Patch Changes

- b77d087: feat: add a customCss property to the configuration object

## 1.2.7

### Patch Changes

- Updated dependencies [bc23e62]
  - @scalar/api-client@0.7.36

## 1.2.6

### Patch Changes

- ed7cc0d: fix: remove leaky header css
- Updated dependencies [2251ea5]
- Updated dependencies [fdaabfe]
- Updated dependencies [fdaabfe]
  - @scalar/swagger-editor@0.7.11
  - @scalar/api-client@0.7.35

## 1.2.5

### Patch Changes

- 35dffe4: chore: include @scalar dependencies in the bundle
- 5c66be8: chore: replace imports pointing to src with relative paths
- Updated dependencies [35dffe4]
- Updated dependencies [5c66be8]
  - @scalar/use-keyboard-event@0.5.6
  - @scalar/swagger-editor@0.7.10
  - @scalar/swagger-parser@0.5.12
  - @scalar/use-codemirror@0.7.15
  - @scalar/use-clipboard@0.5.9
  - @scalar/use-tooltip@0.5.7
  - @scalar/api-client@0.7.34
  - @scalar/use-toasts@0.5.9
  - @scalar/use-modal@0.1.9

## 1.2.4

### Patch Changes

- c3b215f: chore: no pinned peer dependency versions
- Updated dependencies [c3b215f]
  - @scalar/use-keyboard-event@0.5.5
  - @scalar/swagger-editor@0.7.9
  - @scalar/use-codemirror@0.7.14
  - @scalar/use-tooltip@0.5.6
  - @scalar/api-client@0.7.33
  - @scalar/use-toasts@0.5.8
  - @scalar/use-modal@0.1.8
  - @scalar/themes@0.4.2
  - @scalar/use-clipboard@0.5.8

## 1.2.3

### Patch Changes

- 55246e5: chore: rewrite all package.jsons (including their prod, dev and peer dependency requirements)
- f2941f5: feat: add `metaData` to the configuration to pass meta tags (title, opengraph data …)
- Updated dependencies [55246e5]
  - @scalar/use-keyboard-event@0.5.4
  - @scalar/swagger-editor@0.7.8
  - @scalar/swagger-parser@0.5.11
  - @scalar/use-codemirror@0.7.13
  - @scalar/use-clipboard@0.5.7
  - @scalar/use-tooltip@0.5.5
  - @scalar/api-client@0.7.32
  - @scalar/use-toasts@0.5.7
  - @scalar/use-modal@0.1.7
  - @scalar/themes@0.4.1

## 1.2.2

### Patch Changes

- 81490fb: feat: pass global parameters and parameters to the api client
- 18bb6a4: fix: offset sections by header height for scrolling

## 1.2.1

### Patch Changes

- fa34e17: fix: set search modal variant
- 9e6cc67: fix: don't handle search shortcut if component is deactivated

## 1.2.0

### Minor Changes

- edb09a0: refactor: expose slot props for reference base component

### Patch Changes

- 678e383: fix: no authentication shouldn’t render an empty form
- c51124f: feat: add anchors to headings

## 1.1.7

### Patch Changes

- Updated dependencies [1a2afb6]
  - @scalar/swagger-editor@0.7.7

## 1.1.6

### Patch Changes

- 36761e4: feat: make the available tabs configurable
- Updated dependencies [8e65ba9]
- Updated dependencies [36761e4]
  - @scalar/swagger-editor@0.7.6

## 1.1.5

### Patch Changes

- b8dc5a5: fix: show path parameters in the parameter tables
- Updated dependencies [b6552df]
- Updated dependencies [b8dc5a5]
- Updated dependencies [04875a6]
  - @scalar/swagger-editor@0.7.5
  - @scalar/swagger-parser@0.5.10

## 1.1.4

### Patch Changes

- 752dcf3: feat: add support for models with top level anyOf, allOf, oneOf …
- Updated dependencies [a1575f2]
  - @scalar/swagger-parser@0.5.9

## 1.1.3

### Patch Changes

- 75df2d2: feat: use bearer auth as the fallback for http auth
- c97e8e6: chore: add form tag to auth credentials
- 52c20e5: style: no text transform for model names
- b1fe23c: feat: add support for oneOf in response schemas
  feat: add support for allOf in response schemas
- 1208a7f: feat: add support for Swagger 2.0 host and schemes configuration
- Updated dependencies [3d6027c]
  - @scalar/swagger-parser@0.5.8

## 1.1.2

### Patch Changes

- d062fd9: fix: deep linking in api references

## 1.1.1

### Patch Changes

- 5eb5dcf: refactor: bring back footer slot

## 1.1.0

### Minor Changes

- 77dce14: refactor(references)!: remove deprecated component props
  refactor(references): extract references code into base component
  feat(references): expose new props for references base component

### Patch Changes

- d3205e5: feat: support request bodies with other mime types than JSON
- aa2a575: fix: cards overlapping header
- Updated dependencies [801f1b5]
  - @scalar/swagger-editor@0.7.4

## 1.0.6

### Patch Changes

- 366b142: fix: ignore proxy when swagger spec is a path
- e1dc955: fix: add fallback to name for models if no xml attribute passed
- Updated dependencies [ceb7952]
  - @scalar/api-client@0.7.31

## 1.0.5

### Patch Changes

- ff81f70: refactor: move getting started example to GettingStarted component
- 5da1fc6: security: update axios from 1.5.0 to 1.6.1
- ff81f70: fix: don’t overwrite the CodeMirror content when collaborative editing is enabled
- Updated dependencies [ff81f70]
- Updated dependencies [5da1fc6]
- Updated dependencies [ff81f70]
  - @scalar/swagger-editor@0.7.3
  - @scalar/api-client@0.7.30

## 1.0.4

### Patch Changes

- 7fb2302: feat: detect variables in URLs
- 54098d7: chore: better fallbacks for the operation.name
- dd06807: fix: optional chain for request bodies
- 551aa7d: fix: mobile sidebar always open by default
- 7fb2302: fix: show server variables for single URLs too
- 3eff44f: fix: show description component only when a description is specified
- f0dca6c: fix: add fallback if no summary or key is provided for examples
- Updated dependencies [54098d7]
- Updated dependencies [7fb2302]
  - @scalar/swagger-parser@0.5.7
  - @scalar/api-client@0.7.29

## 1.0.3

### Patch Changes

- c92a3a3: fix: active state for the headings taken from the description
- 57cea1a: fix: don’t show a version badge if no version is defined
- dce99ae: fix: removed deleted icons from type definition
- 009a720: fix: add missing http logo
- 48118ba: feat: add updateContent event to the ApiReference component
- dab853a: chore: remove unused dependencies
- Updated dependencies [f4681d5]
- Updated dependencies [c92a3a3]
- Updated dependencies [48118ba]
- Updated dependencies [dab853a]
  - @scalar/swagger-editor@0.7.2
  - @scalar/use-codemirror@0.7.12
  - @scalar/swagger-parser@0.5.6
  - @scalar/api-client@0.7.28
  - @scalar/use-modal@0.1.6

## 1.0.2

### Patch Changes

- a7e6c25: fix: externalize remark/rehype dependencies to fix SSG builds
- 4253b4a: fix: move footer below sidebar and editor when toggled
- Updated dependencies [a7e6c25]
  - @scalar/swagger-editor@0.7.1

## 1.0.1

### Patch Changes

- 68edf8c: feat: add oas version and spec version to title
- e482ce0: fix: don’t overwrite the content if there is nothing configured
- 6af9829: refactor: add a ApiReferenceLayout component to offer slots for everything
- 6bdc65b: Exported ApiReferenceLayout as separate component

## 1.0.0

### Minor Changes

- 440815a: Add getting started to empty render area

### Patch Changes

- 94d2fe4: fix: don’t show a security scheme select when there is only one
- b0835a2: users not using themed css fallbacks
- c470db5: make --theme priority over --default-theme in misc places
- 5243ae4: make search modal hotkey configurable
- 509db1e: refactor: move all api reference refs and watchers to hooks
- Updated dependencies [b0835a2]
- Updated dependencies [440815a]
- Updated dependencies [c470db5]
- Updated dependencies [da431d9]
- Updated dependencies [3c6f54f]
- Updated dependencies [509db1e]
- Updated dependencies [a4f1b08]
  - @scalar/use-modal@0.1.5
  - @scalar/swagger-editor@0.7.0
  - @scalar/api-client@0.7.27
  - @scalar/use-codemirror@0.7.11

## 0.8.10

### Patch Changes

- 8c15df74: remove extra borders + fix spacing when only 1 server child

## 0.8.9

### Patch Changes

- 9c7a5722: feat: make the server selectable
  feat: add inputs for server variables
  feat: pass configured server environment to example requests
  feat: pass configured server environment to the api client
  refactor: new helpers to generate the request data for the example request and the client
- a5df4a5b: fix: don’t show generated example responses if there’s an example
- Updated dependencies [9c7a5722]
  - @scalar/api-client@0.7.26

## 0.8.8

### Patch Changes

- 8e2e4e5a: fix markdown collisions + prefix the card name
- Updated dependencies [8e2e4e5a]
  - @scalar/swagger-editor@0.6.30
  - @scalar/api-client@0.7.25

## 0.8.7

### Patch Changes

- db24e103: hotfix: import spec from url
- Updated dependencies [db24e103]
  - @scalar/swagger-editor@0.6.29

## 0.8.6

### Patch Changes

- c75b13b1: hotfix: load the swagger editor even if it’s not used

## 0.8.5

### Patch Changes

- 2f0b2f01: fix: add deprecated footerBelowSidebar again (use configuration object instead)
- 2f0b2f01: feat: add download spec button
- 2f0b2f01: refactor: improve the data flow between the reference and the swagger editor
- 2f0b2f01: refactor: move json helpers to separate files
- Updated dependencies [2f0b2f01]
- Updated dependencies [2f0b2f01]
  - @scalar/swagger-editor@0.6.28
  - @scalar/api-client@0.7.24

## 0.8.4

### Patch Changes

- Updated dependencies [a73ee9d8]
  - @scalar/swagger-editor@0.6.27

## 0.8.3

### Patch Changes

- d5fccba9: add ai writer to swagger editor
- Updated dependencies [d5fccba9]
  - @scalar/swagger-editor@0.6.26

## 0.8.2

### Patch Changes

- 3b042270: fix: active state for operations with multiple tags
- 4685f391: feat: introducing the new universal configuration object
- 8ac1ad69: chore: use different heading levels
- 28191084: feat: add security schemes to the reference
- e01134d4: style: use horizontal ellipsis to indicate strings in example responses
- Updated dependencies [64f8a018]
- Updated dependencies [ce04794a]
- Updated dependencies [7c3091c6]
  - @scalar/use-codemirror@0.7.10
  - @scalar/api-client@0.7.23
  - @scalar/swagger-editor@0.6.25

## 0.8.1

### Patch Changes

- 7ed5c61a: fix: add target blank to markdown links

## 0.8.0

### Minor Changes

- 2eba4010: Refactor and simplify API references layout

### Patch Changes

- 9d352b13: fix: make the sidebar work with tags without operations
- b71c4db7: feat: example objects in arrays for example responses
- 01109c6f: feat: use min value as the default for generated example responses
- Updated dependencies [df74d017]
- Updated dependencies [75d12f56]
- Updated dependencies [2eba4010]
  - @scalar/api-client@0.7.22
  - @scalar/use-toasts@0.5.6
  - @scalar/use-clipboard@0.5.6

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
