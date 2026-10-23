/**
 * What the lowlight pipeline in `@scalar/code-highlight` rendered, frozen.
 *
 * The compat layer exists to replace that package, and the differential tests
 * used to import it and run both pipelines side by side. Once nothing in the
 * repository used it any more it was deleted, so its output was captured here
 * from the last version of it, over the same sample corpus and edge cases.
 *
 * The reference can no longer be regenerated, so each entry carries a hash of
 * the source it was rendered from. Editing a sample in `samples.ts` would
 * otherwise compare our output for the new source against lowlight's for the
 * old one, which fails in a way that looks like a grammar bug. A stale entry
 * throws instead, and the fix is a deliberate choice: revert the sample, or
 * drop that language from the reference and say why.
 */
import fixture from './reference.json'

/** One sample as the lowlight pipeline rendered it. */
type Rendered = {
  /** FNV-1a of the source, so a changed sample cannot silently drift. */
  hash: string
  /** `syntaxHighlight(code, { lang })`, verbatim. */
  html: string
  /** The `<code …>` opening tag with `lineNumbers: true`, gutter variables included. */
  lineEnvelope: string
  /** Text of each `<span class="line">` with `lineNumbers: true`. */
  lineTexts: string[]
}

/** 32-bit FNV-1a, in hex. Not for security, only to notice an edited sample. */
const hashSource = (code: string): string => {
  let hash = 0x811c9dc5
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Languages the reference pipeline had a grammar for.
 *
 * A sample in any other language rendered as plain escaped text there, so it
 * has nothing to differ against. `mojo` is the only one in the corpus.
 */
export const REFERENCE_LANGUAGES: ReadonlySet<string> = new Set(fixture.languages)

/** Every key of `standardLanguages` in `@scalar/code-highlight`. */
export const REFERENCE_STANDARD_LANGUAGES: readonly string[] = fixture.standardLanguages

const lookup = (table: Record<string, Rendered>, key: string, code: string): Rendered => {
  const entry = table[key]
  if (!entry) {
    throw new Error(
      `No lowlight reference for ${JSON.stringify(key)}. It cannot be regenerated, see test/reference.ts.`,
    )
  }
  if (entry.hash !== hashSource(code)) {
    throw new Error(
      `The source for ${JSON.stringify(key)} changed after its lowlight reference was frozen, see test/reference.ts.`,
    )
  }
  return entry
}

/** The lowlight rendering of one entry in `samples.ts`. */
export const referenceSample = (lang: string, code: string): Rendered => {
  return lookup(fixture.samples, lang, code)
}

/** The lowlight rendering of one of the compat edge cases, keyed by its name. */
export const referenceEdgeCase = (name: string, code: string): Rendered => {
  return lookup(fixture.edgeCases, name, code)
}
