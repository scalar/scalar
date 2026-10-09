import type { CompiledLanguage, Language, LanguageFn } from 'highlight.js'
import { createLowlight } from 'lowlight'

type Lowlight = ReturnType<typeof createLowlight>

type LanguageRegistry = Readonly<Record<string, LanguageFn>>

const sharedLowlights = new WeakMap<LanguageRegistry, Lowlight>()

/**
 * Throws on registration, so a caller cannot change the grammars other callers
 * share. `rehypeHighlight` registers only when it is given `aliases`.
 */
const rejectRegistration = (): never => {
  throw new Error('A shared lowlight instance is read-only, so register languages and aliases in its registry instead')
}

/**
 * highlight.js marks a grammar as compiled before it compiles it and builds the
 * matcher last, so a grammar that threw while compiling is left without one.
 */
const isHalfCompiled = (grammar: Language): boolean =>
  grammar.isCompiled === true && !(grammar as Partial<CompiledLanguage>).matcher

/**
 * Wraps a lowlight instance that starts again from a fresh one once a grammar
 * fails to compile.
 *
 * A grammar can throw while compiling (for example a Unicode escape that a
 * minifier mangled), and highlight.js then keeps the half-compiled grammar. A
 * later block in a language that embeds it, such as markdown or JSX embedding
 * `xml`, would lose that text instead of failing. The failure does not always
 * reach the caller: highlight.js swallows it when the grammar is embedded two
 * levels deep, such as `xml` in markdown in a Dart doc comment. So each call
 * checks the grammars themselves.
 */
const createSharedLowlight = (languages: LanguageRegistry): Lowlight => {
  let grammars: Language[] = []

  /** The registry, with each grammar object kept as it registers so its compile can be checked */
  const trackedLanguages = Object.fromEntries(
    Object.entries(languages).map(([name, language]): [string, LanguageFn] => [
      name,
      (hljs) => {
        const grammar = language(hljs)
        grammars.push(grammar)
        return grammar
      },
    ]),
  )

  const createTrackedLowlight = (): Lowlight => {
    grammars = []
    return createLowlight(trackedLanguages)
  }

  let lowlight = createTrackedLowlight()

  const resetIfHalfCompiled = <Result>(highlight: () => Result): Result => {
    try {
      return highlight()
    } finally {
      if (grammars.some(isHalfCompiled)) {
        lowlight = createTrackedLowlight()
      }
    }
  }

  return {
    highlight: (language, value, options) => resetIfHalfCompiled(() => lowlight.highlight(language, value, options)),
    highlightAuto: (value, options) => resetIfHalfCompiled(() => lowlight.highlightAuto(value, options)),
    listLanguages: () => lowlight.listLanguages(),
    registered: (aliasOrName) => lowlight.registered(aliasOrName),
    register: rejectRegistration,
    registerAlias: rejectRegistration,
  }
}

/**
 * Returns the lowlight instance for a language registry, shared by every caller
 * that passes the same registry object.
 *
 * Registering and compiling the grammars costs far more than highlighting one
 * block, and an API reference highlights a block for every example. Lowlight
 * takes the class prefix and the detection subset per call, highlight.js resets
 * its matcher state per call, and an instance with a half-compiled grammar is
 * replaced, so sharing an instance does not change the output. The registry is
 * read once, on first use, so languages added to it later are not picked up.
 */
export const getSharedLowlight = (languages: LanguageRegistry): Lowlight => {
  let lowlight = sharedLowlights.get(languages)

  if (!lowlight) {
    lowlight = createSharedLowlight(languages)
    sharedLowlights.set(languages, lowlight)
  }

  return lowlight
}
