import type { RegExpEngine } from 'ajv/dist/types/index.js'

/**
 * Compile a schema `pattern` for Ajv, with the unicode flag when the pattern allows it and without it otherwise.
 *
 * OpenAPI reads `pattern` as an ECMA-262 regular expression, where escapes such as `\-` outside a class, `\_`
 * or `\ ` are valid. Ajv compiles every pattern with the `u` flag, which turns those escapes into syntax
 * errors, so a single zip code or phone number pattern made the whole body, or every parameter of its
 * location, fail open. A pattern that parses with `u` keeps it, so `\p{L}` and astral characters still match
 * the way they did, and a pattern that parses in neither mode still throws as before.
 */
export const compilePattern = Object.assign(
  (pattern: string, flags: string): RegExp => {
    try {
      return new RegExp(pattern, flags)
    } catch {
      return new RegExp(pattern, flags.replace('u', ''))
    }
  },
  // Only read when Ajv generates standalone code, which the mock server never does.
  { code: 'compilePattern' },
) satisfies RegExpEngine
