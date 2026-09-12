import { resolveGrammar } from './core/registry'
import type { BlockOptions, RenderOptions } from './core/render'
import { highlight as render, highlightBlock as renderBlock } from './core/render'
import { tokenizeToArray } from './core/tokenize'
import type { CompiledGrammar, Grammar, Token } from './core/types'

/** Anything that can name a language: a registered name, or a grammar itself. */
export type LanguageInput = string | Grammar | CompiledGrammar

/** Highlights to an HTML fragment (the inside of a `<code>` element). */
export const highlight = (code: string, lang: LanguageInput, options?: RenderOptions): string => {
  return render(code, resolveGrammar(lang), options)
}

/** Highlights to a complete `<pre class="shl-code">` block. */
export const highlightBlock = (code: string, lang: LanguageInput, options?: BlockOptions): string => {
  return renderBlock(code, resolveGrammar(lang), options)
}

/** Tokenizes to an array — for rendering somewhere other than HTML. */
export const tokenize = (code: string, lang: LanguageInput): Token[] => {
  return tokenizeToArray(code, resolveGrammar(lang))
}

export { compile } from './core/compile'
export {
  getLanguage,
  isRegistered,
  listLanguages,
  registerLanguage,
  resolveGrammar,
} from './core/registry'
export type { BlockOptions, RenderOptions } from './core/render'
export { DEFAULT_PREFIX, escapeAttribute, escapeHtml } from './core/render'
export type { Scope } from './core/scopes'
export { SCOPES, SCOPE_NAMES, scopeChain, scopeClass } from './core/scopes'
export { tokenize as tokenizeStream } from './core/tokenize'
export type {
  CompiledGrammar,
  Emit,
  Grammar,
  Include,
  Rule,
  ScopeName,
  State,
  StateRule,
  Token,
} from './core/types'
