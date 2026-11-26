import { createSharedLoader } from '@scalar/helpers/general/create-shared-loader'
import { grammarFor } from '@scalar/highlight/compat'
import { type BundledLanguage, loadLanguage, resolveLanguageName } from '@scalar/highlight/lazy'
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

/**
 * Downloads a grammar once and bumps the counter when it arrives.
 *
 * Keyed by the resolved language rather than the name a block asked for, so `js`, `javascript` and
 * `ts` blocks wait on one download between them, and hundreds of blocks attach one handler rather
 * than one each. A failed download is forgotten, so the next render that asks tries again.
 */
const downloads = createSharedLoader((language: BundledLanguage) =>
  loadLanguage(language).then(() => {
    loadedGrammars.value++
  }),
)

/**
 * The bundled language a block would have to download to highlight `name`, if any.
 *
 * Returns `undefined` for plain text and names we have no grammar for, and
 * also when the grammar is registered already but `grammarFor` still cannot
 * find it under this name. Loading cannot help with that last one, and
 * treating it as loadable would make every finished load re-render the block,
 * which would ask again, forever.
 */
const loadableLanguage = (name: string): BundledLanguage | undefined => {
  const resolved = resolveLanguageName(name)
  return resolved && !grammarFor(resolved) ? resolved : undefined
}

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

  const language = loadableLanguage(name)
  if (!language) {
    return false
  }

  // Read so the caller renders again when this (or any) grammar finishes loading
  void loadedGrammars.value

  // A failed download leaves the block plain rather than throwing into the render
  downloads.load(language).catch(() => undefined)

  return false
}

/**
 * Loads the grammars for a set of languages, for a host to await before mounting.
 *
 * Code blocks highlight on their first render when their grammar is already
 * registered, so a server-rendered page hydrates without a mismatch if the
 * client awaits this for the languages the page shows. Unknown names and plain
 * text are skipped. It waits for every download to settle, so one grammar that
 * fails to load leaves only its own blocks plain, and it never rejects.
 */
export const preloadGrammars = async (names: Iterable<string>): Promise<void> => {
  const languages = new Set<BundledLanguage>()
  for (const name of names) {
    const language = grammarFor(name) ? undefined : loadableLanguage(name)
    if (language) {
      languages.add(language)
    }
  }

  if (!languages.size) {
    return
  }

  const results = await Promise.allSettled([...languages].map((language) => loadLanguage(language)))

  // Blocks that already rendered plain, such as a Markdown block that rendered once during server
  // prefetch to learn its languages, render again with the new grammars
  if (results.some((result) => result.status === 'fulfilled')) {
    loadedGrammars.value++
  }
}

/**
 * The language of a code block, read from its classes the way `rehypeHighlight` reads them.
 *
 * The first `no-highlight`, `lang-*` or `language-*` class wins, so a block the
 * Markdown renderer left alone is not counted, and `lang-python` counts the same
 * as `language-python`.
 */
const languageOf = (code: Element): string | undefined => {
  for (const className of code.classList) {
    if (className === 'no-highlight' || className === 'nohighlight') {
      return undefined
    }
    if (className.startsWith('lang-')) {
      return className.slice('lang-'.length)
    }
    if (className.startsWith('language-')) {
      return className.slice('language-'.length)
    }
  }

  return undefined
}

/**
 * Languages of the highlighted code in server-rendered markup, to pass to `preloadGrammars`.
 *
 * Hydrating patches `v-html`, so a code block whose grammar has not loaded yet
 * would replace the server's highlighted markup with plain text, and only turn
 * highlighted again once its grammar arrives. Highlighted code carries its
 * language in a class, so the markup itself says which grammars the first
 * client render needs.
 *
 * @example
 * await preloadGrammars(getRenderedLanguages(document.getElementById('app')!))
 */
export const getRenderedLanguages = (root: ParentNode): string[] => {
  const languages = new Set<string>()

  for (const code of root.querySelectorAll('code.hljs')) {
    const language = languageOf(code)
    if (language) {
      languages.add(language)
    }
  }

  return [...languages]
}
