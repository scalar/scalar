import { compile } from './compile'
import type { CompiledGrammar, Grammar } from './types'

/**
 * Language registry.
 *
 * Registering is cheap — grammars are compiled on first use, not on import —
 * so a bundle that registers ten languages and highlights one only pays for
 * the one.
 */
const sources = new Map<string, Grammar>()
const cache = new Map<string, CompiledGrammar>()

export const registerLanguage = (...grammars: Grammar[]): void => {
  for (const grammar of grammars) {
    const name = grammar.name.toLowerCase()

    // Re-registering replaces a language outright, so retire every name the
    // previous grammar answered to before claiming the new one's. Evicting only
    // the canonical name would leave each alias pointing at, and cached as, the
    // grammar this call is replacing.
    const previous = sources.get(name)
    if (previous) {
      for (const key of [previous.name, ...(previous.aliases ?? [])]) {
        const lower = key.toLowerCase()
        if (sources.get(lower) === previous) sources.delete(lower)
        cache.delete(lower)
      }
    }

    for (const key of [name, ...(grammar.aliases ?? [])]) {
      const lower = key.toLowerCase()
      sources.set(lower, grammar)
      cache.delete(lower)
    }
  }
}

export const isRegistered = (name: string): boolean => {
  return sources.has(name.toLowerCase())
}

/** Canonical names of registered languages, without aliases. */
export const listLanguages = (): string[] => {
  return [...new Set([...sources.values()].map((g) => g.name))].sort()
}

const isCompiled = (value: Grammar | CompiledGrammar): value is CompiledGrammar => {
  return 'root' in value
}

/** Looks up and compiles a language, memoizing the compiled form. */
export const getLanguage = (name: string): CompiledGrammar | undefined => {
  const key = name.toLowerCase()
  const hit = cache.get(key)
  if (hit) return hit

  const grammar = sources.get(key)
  if (!grammar) return undefined

  const built = compile(grammar)
  // Cache under every alias so repeat lookups skip the alias hop.
  for (const alias of [grammar.name, ...(grammar.aliases ?? [])]) {
    cache.set(alias.toLowerCase(), built)
  }
  return built
}

/**
 * Accepts a registered language name, a grammar, or an already-compiled
 * grammar. Throws on an unknown name — silently rendering unhighlighted code
 * hides typos in a `lang` prop for a long time.
 */
export const resolveGrammar = (lang: string | Grammar | CompiledGrammar): CompiledGrammar => {
  if (typeof lang !== 'string') {
    return isCompiled(lang) ? lang : compile(lang)
  }
  const found = getLanguage(lang)
  if (found) return found

  const known = listLanguages()
  throw new Error(
    `Language "${lang}" is not registered. ` +
      (known.length
        ? `Registered: ${known.join(', ')}.`
        : `Import it and call registerLanguage(), or use loadLanguage() from "@scalar/highlight/lazy".`),
  )
}
