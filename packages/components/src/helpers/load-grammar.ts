import { grammarFor } from '@scalar/highlight/compat'
import { loadLanguage, loadLanguages, resolveLanguageName } from '@scalar/highlight/lazy'
import { ref } from 'vue'

/**
 * Bumped every time a grammar finishes loading.
 *
 * Grammars are downloaded on demand rather than bundled up front, because a
 * page only ever highlights a handful of the forty or so we ship. A block whose
 * grammar is still missing renders as plain text and reads this counter, so it
 * renders again once a grammar arrives. One shared counter, rather than a
 * watcher per block, because an API reference page renders hundreds of blocks.
 */
const loadedGrammars = ref(0)

/** Languages whose grammar is downloading, so hundreds of blocks start one load between them. */
const pending = new Set<string>()

/**
 * Whether the grammar for a language is registered, starting its download when it is not.
 *
 * Call it while rendering. When it returns `false` for a language we have a
 * grammar for, it has also subscribed the caller to the shared load counter, so
 * the caller renders again once the grammar arrives. Takes highlight.js
 * vocabulary, aliases included (`js`, `ts`, `py`, `sh`), the same names
 * `syntaxHighlight` and `toHast` accept. Plain text and names we have no grammar
 * for return `false` without loading anything. A failed download leaves the
 * block plain rather than throwing into the render, and the next render that
 * asks for it tries again.
 */
export const ensureGrammar = (name: string): boolean => {
  if (grammarFor(name)) {
    return true
  }

  if (!resolveLanguageName(name)) {
    return false
  }

  // Read so the caller renders again when this (or any) grammar finishes loading
  void loadedGrammars.value

  if (!pending.has(name)) {
    pending.add(name)
    loadLanguage(name).then(
      () => {
        pending.delete(name)
        loadedGrammars.value++
      },
      () => {
        pending.delete(name)
      },
    )
  }

  return false
}

/**
 * Loads the grammars for a set of languages, for a host to await before mounting.
 *
 * Code blocks highlight on their first render when their grammar is already
 * registered, so a server-rendered page hydrates without a mismatch if the
 * client awaits this for the languages the page shows. Unknown names and plain
 * text are skipped, and a grammar that fails to load leaves its blocks plain.
 */
export const preloadGrammars = async (names: Iterable<string>): Promise<void> => {
  const known = [...new Set(names)].filter((name) => !grammarFor(name) && resolveLanguageName(name))
  if (!known.length) {
    return
  }

  await loadLanguages(...known).catch(() => undefined)
  // Blocks that already rendered plain, such as a Markdown block that rendered once during server
  // prefetch to learn its languages, render again with the new grammars
  loadedGrammars.value++
}
