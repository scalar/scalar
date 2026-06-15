import { createHighlighterCore } from '@shikijs/core'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import type { HighlighterCore } from '@shikijs/types'

import { type ShikiLanguage, languageLoaders, resolveLanguage } from './languages'
import { scalarTheme } from './theme'

/** The language id used for plain (unhighlighted) text. Built into Shiki. */
export const PLAIN_TEXT = 'text'

/**
 * A single shared highlighter instance, created lazily.
 *
 * Only the Shiki core, the JavaScript regex engine, and the Scalar theme are
 * loaded up front. Grammars are added on demand via {@link loadLanguage}. The
 * JavaScript engine avoids shipping and downloading the Oniguruma WASM blob,
 * which keeps the initial cost small.
 */
let highlighterPromise: Promise<HighlighterCore> | null = null

const getHighlighter = (): Promise<HighlighterCore> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [scalarTheme],
      langs: [],
      // `forgiving` keeps highlighting working even when a grammar uses an
      // Oniguruma-only regex feature the JavaScript engine cannot compile.
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    })
  }

  return highlighterPromise
}

/** Grammars that have already been registered on the shared highlighter. */
const loadedLanguages = new Set<ShikiLanguage>()

/** In-flight grammar loads, so the same grammar is only fetched once. */
const loadingLanguages = new Map<ShikiLanguage, Promise<void>>()

const ensureLanguageLoaded = async (highlighter: HighlighterCore, id: ShikiLanguage): Promise<void> => {
  if (loadedLanguages.has(id)) {
    return
  }

  let loading = loadingLanguages.get(id)

  if (!loading) {
    loading = languageLoaders[id]()
      .then((module) => highlighter.loadLanguage(module.default))
      .then(() => {
        loadedLanguages.add(id)
      })
      .finally(() => {
        loadingLanguages.delete(id)
      })

    loadingLanguages.set(id, loading)
  }

  await loading
}

/**
 * Resolve the input language, lazily load its grammar, and return the id to
 * highlight with. Falls back to plain text for unknown languages or when a
 * grammar fails to load.
 */
export const loadLanguage = async (lang: string): Promise<string> => {
  const id = resolveLanguage(lang)

  if (!id) {
    return PLAIN_TEXT
  }

  const highlighter = await getHighlighter()

  try {
    await ensureLanguageLoaded(highlighter, id)
    return id
  } catch {
    return PLAIN_TEXT
  }
}

/** Return the shared highlighter, creating it on first use. */
export const getShikiHighlighter = (): Promise<HighlighterCore> => getHighlighter()
