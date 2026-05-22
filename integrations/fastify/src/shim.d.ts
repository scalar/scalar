/**
 * The Scalar JavaScript bundle is generated at build time by
 * `scripts/inline-standalone.js` into `assets/standalone.generated.ts`.
 *
 * This ambient declaration lets type-checking succeed before that file has
 * been generated. Once it exists, the generated module is used instead.
 */
declare module '*standalone.generated' {
  export const scalarJs: string
}
