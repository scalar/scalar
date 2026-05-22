import { scalarJs } from '../assets/standalone.generated'

/**
 * Return the bundled Scalar API Reference JavaScript.
 *
 * The standalone bundle is inlined as a string at build time (see
 * `scripts/inline-standalone.js`), so it stays part of the published module
 * graph and keeps working when the integration is bundled by a downstream
 * build.
 *
 * @see https://github.com/scalar/scalar/issues/3566
 */
export function getJavaScriptFile(): string {
  return scalarJs
}
