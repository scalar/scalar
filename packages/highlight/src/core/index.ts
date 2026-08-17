export { compile } from './compile'
export {
  getLanguage,
  isRegistered,
  listLanguages,
  registerLanguage,
  resolveGrammar,
} from './registry'
export type { BlockOptions, RenderOptions } from './render'
export {
  DEFAULT_PREFIX,
  escapeAttribute,
  escapeHtml,
  highlight as highlightWith,
  highlightBlock as highlightBlockWith,
} from './render'
export type { Scope } from './scopes'
export { SCOPES, SCOPE_NAMES, scopeChain, scopeClass } from './scopes'
export { tokenize as tokenizeWith, tokenizeToArray } from './tokenize'
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
} from './types'
