import { grammarFor } from '@scalar/highlight/compat'
import { loadLanguage, resolveLanguageName } from '@scalar/highlight/lazy'
import { shallowReactive } from 'vue'

/**
 * Languages whose grammar finished loading, by the name a block asked for.
 *
 * Grammars are downloaded on demand rather than bundled up front, because a
 * page only ever highlights a handful of the forty or so we ship. A block
 * renders as plain text first and reads this set while it highlights, so it
 * renders again once its grammar arrives. Every code block and Markdown block
 * on the page shares the one set, so each grammar downloads once.
 */
const loadedLanguages = shallowReactive(new Set<string>())

/**
 * Whether the grammar for a language has finished loading.
 *
 * Call it while rendering: reading the set is what makes Vue render again when
 * the grammar arrives. A grammar that some other module registered up front is
 * already highlighted without it.
 */
export const isGrammarLoaded = (name: string): boolean => loadedLanguages.has(name)

/**
 * Starts loading the grammar for a language, unless it is already here or we
 * have none for it.
 *
 * Takes highlight.js vocabulary, aliases included (`js`, `ts`, `py`, `sh`), the
 * same names `syntaxHighlight` and `toHast` accept.
 */
export const loadGrammar = (name: string): void => {
  if (loadedLanguages.has(name) || grammarFor(name) || !resolveLanguageName(name)) {
    return
  }

  loadLanguage(name).then(
    () => loadedLanguages.add(name),
    // A grammar that fails to download leaves the block as plain text, which is
    // still readable. The next block in that language tries again.
    () => undefined,
  )
}
