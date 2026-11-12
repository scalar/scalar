# TypeScript migration

Release metadata checked on 2026-11-12 against npm publication timestamps, with a five-day cutoff of 2026-11-07. Keep `minimumReleaseAge: 7200` and its exclusions unchanged.

## Compiler choice

TypeScript 7.0.2 (published 2026-07-08) is the latest eligible stable release. TypeScript 7.1 is still a prerelease. Upgrade the JavaScript compiler from 5.9.3 to 6.0.3 (published 2026-04-16) first. TypeScript 7.0 does not expose the compiler API used by Vue/Volar, ESLint, declaration generation, `@scalar/ts-to-openapi`, and `@scalar/nextjs-openapi`.

Do not override peer dependencies or alias TypeScript 7 into these consumers. The existing native-preview checker is independent of the JavaScript compiler. Replacing that checker and migrating its `tsgo` commands is a separate step from changing the compiler API used for published builds.

## Compatibility and intentional holds

| Dependency                                    | Decision                      | Reason                                                                                                                                                                               |
| --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript                                    | 6.0.3                         | Last eligible 6.x release; retains the JavaScript compiler API and supports Node >=14.17.                                                                                            |
| vue-tsc / @vue/language-core                  | Keep 3.3.11                   | Current Vue checker uses Volar's JavaScript compiler integration. Its TypeScript peer is >=5; validate it with 6 rather than interpreting that open-ended range as native 7 support. |
| typescript-eslint / @typescript-eslint/parser | Keep 8.71.2                   | Already supports TypeScript >=4.8.4 <6.1.0. Latest 8.72.2 was published November 9 and is ineligible; 8.72.1 adds no support for TypeScript 7.                                       |
| ts-jest                                       | Keep 29.4.15                  | Latest eligible release, accepts TypeScript >=4.3 <7 and uses the JavaScript compiler API.                                                                                           |
| @microsoft/api-extractor                      | 7.60.1                        | Published October 30; uses TypeScript 6.0.3 internally, whereas 7.59.4 uses 5.9.3. Keep the declaration parser aligned with the emitting compiler.                                   |
| vite-plugin-dts                               | Keep 5.1.2                    | Latest eligible release; validate bundled declarations with API Extractor 7.60.1.                                                                                                    |
| tsup                                          | Keep 9.0.0                    | Existing Nest integration declaration bundler; do not widen its existing Node requirement or replace the build pipeline.                                                             |
| typescript-language-server                    | Keep 6.0.2                    | Uses tsserver from the JavaScript compiler. A native compiler is not a drop-in language service replacement.                                                                         |
| Nest CLI / schematics                         | Keep 11.x                     | Nest CLI 12 changes the build stack and latest schematics requires ^22.22.3 or ^24.15.0 or >=26.0.0. This is unnecessary for the root compiler upgrade.                              |
| Nuxt module builder / unbuild / tsconfck      | Keep TypeScript 5.9.3 locally | Their installed peers require ^5.8.3, ^5.9.2 and ^5.0.0 respectively. Even the latest module builder 1.0.4 still requires ^5.9.3.                                                    |
| OpenAPI type legacy consumer test             | TypeScript 5.9.3 test alias   | Retain node10 consumer coverage without disabling TypeScript 6 deprecation diagnostics; modern consumer cases use 6.0.3.                                                             |
| React Webpack example                         | TypeScript 5.9.3              | Preserve its ES5 output and node10 resolution. TypeScript 6 deprecates these; changing its target would change the example's runtime contract.                                       |

Nest examples retain CommonJS output through Node16 module resolution, with isolated compilation for ts-jest and separate full type checks. Their build root remains `src`, while the test configuration covers the project root. Incremental build metadata stays inside `dist` so Nest's output cleanup also invalidates its cache before rebuilding.

No Node engine declarations or JavaScript targets are raised. Explicit `rootDir` values preserve the previously inferred `dist/` layout. Alias paths remain relative to their configuration files without deprecated `baseUrl`.

## Validation and public compatibility

The preparation phase was validated on TypeScript 5.9.3 before changing the compiler. Explicit build roots produce exactly the same declaration paths and contents as the baseline.

After upgrading, compare emitted JavaScript and declarations against the pre-upgrade build. The schema callback annotation changes only an equivalent named type import. Next.js declaration generation is limited to public sources: its exported handler declarations are unchanged, and unrelated ambient declarations from tests and build tooling are no longer bundled. External-consumer regressions check handler overloads with full library checking.

Recursive validation fixtures now declare their recursive schema types explicitly, keeping the existing assertions. Observer test doubles include the DOM library's `scrollMargin` member. Vite consumers load `vite/client` types for stylesheet imports, and Docusaurus declares its bundler-managed CSS imports. Compiler diagnostics, peer checks, and release-age checks remain enabled.

## Sources

- [TypeScript 7 announcement and compiler API limitation](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [TypeScript 6 migration requirements](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
- [ESLint TypeScript support](https://typescript-eslint.io/users/dependency-versions/)
- [ts-jest prerequisites](https://github.com/kulshekhar/ts-jest)
- npm release metadata for [TypeScript](https://registry.npmjs.org/typescript), [API Extractor](https://registry.npmjs.org/@microsoft%2fapi-extractor), and [Vue tooling](https://registry.npmjs.org/vue-tsc).
