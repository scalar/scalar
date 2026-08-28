import { registerLanguage } from './core/registry'
import type { Grammar } from './core/types'
import bash from './langs/bash'
import c from './langs/c'
import clojure from './langs/clojure'
import cpp from './langs/cpp'
import csharp from './langs/csharp'
import css from './langs/css'
import dart from './langs/dart'
import diff from './langs/diff'
import dockerfile from './langs/dockerfile'
import elixir from './langs/elixir'
import fsharp from './langs/fsharp'
import go from './langs/go'
import graphql from './langs/graphql'
import haskell from './langs/haskell'
import html from './langs/html'
import http from './langs/http'
import ini from './langs/ini'
import java from './langs/java'
import javascript from './langs/javascript'
import json from './langs/json'
import kotlin from './langs/kotlin'
import lua from './langs/lua'
import makefile from './langs/makefile'
import markdown from './langs/markdown'
import matlab from './langs/matlab'
import mojo from './langs/mojo'
import nginx from './langs/nginx'
import objectivec from './langs/objectivec'
import ocaml from './langs/ocaml'
import perl from './langs/perl'
import php from './langs/php'
import powershell from './langs/powershell'
import python from './langs/python'
import r from './langs/r'
import ruby from './langs/ruby'
import rust from './langs/rust'
import scala from './langs/scala'
import sql from './langs/sql'
import swift from './langs/swift'
import yaml from './langs/yaml'

/**
 * Every bundled language, registered on import.
 *
 * Meant for build-time rendering — static site generators, docs pipelines,
 * anything where bundle size is not a constraint. In a browser bundle prefer
 * `@scalar/highlight/lazy`, or import the two or three languages you actually use.
 */
export const languages: Grammar[] = [
  bash,
  c,
  clojure,
  cpp,
  csharp,
  css,
  dart,
  diff,
  dockerfile,
  elixir,
  fsharp,
  go,
  graphql,
  haskell,
  html,
  http,
  ini,
  java,
  javascript,
  json,
  kotlin,
  lua,
  makefile,
  markdown,
  matlab,
  mojo,
  nginx,
  objectivec,
  ocaml,
  perl,
  php,
  powershell,
  python,
  r,
  ruby,
  rust,
  scala,
  sql,
  swift,
  yaml,
]

registerLanguage(...languages)

/**
 * The root entry's surface, re-exported by name.
 *
 * `import { highlight } from '@scalar/highlight/all'` has to work without a
 * second import, so everything `.` exports is listed here. Spelled out rather
 * than `export *` so the entry's surface is greppable and Biome's barrel-file
 * rules stay satisfied.
 */
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
export type { LanguageInput } from './index'
export { highlight, highlightBlock, tokenize } from './index'
