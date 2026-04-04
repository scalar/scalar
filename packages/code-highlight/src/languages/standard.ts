import type { LanguageFn } from 'highlight.js'
import bash from 'highlight.js/es/languages/bash'
import c from 'highlight.js/es/languages/c'
import clojure from 'highlight.js/es/languages/clojure'
import cpp from 'highlight.js/es/languages/cpp'
import csharp from 'highlight.js/es/languages/csharp'
import css from 'highlight.js/es/languages/css'
import dart from 'highlight.js/es/languages/dart'
import diff from 'highlight.js/es/languages/diff'
import dockerfile from 'highlight.js/es/languages/dockerfile'
import elixir from 'highlight.js/es/languages/elixir'
import fsharp from 'highlight.js/es/languages/fsharp'
import go from 'highlight.js/es/languages/go'
import graphql from 'highlight.js/es/languages/graphql'
import haskell from 'highlight.js/es/languages/haskell'
import http from 'highlight.js/es/languages/http'
import ini from 'highlight.js/es/languages/ini'
import java from 'highlight.js/es/languages/java'
import javascript from 'highlight.js/es/languages/javascript'
import json from 'highlight.js/es/languages/json'
import kotlin from 'highlight.js/es/languages/kotlin'
import less from 'highlight.js/es/languages/less'
import lua from 'highlight.js/es/languages/lua'
import makefile from 'highlight.js/es/languages/makefile'
import markdown from 'highlight.js/es/languages/markdown'
import matlab from 'highlight.js/es/languages/matlab'
import nginx from 'highlight.js/es/languages/nginx'
import objectivec from 'highlight.js/es/languages/objectivec'
import ocaml from 'highlight.js/es/languages/ocaml'
import perl from 'highlight.js/es/languages/perl'
import php from 'highlight.js/es/languages/php'
import plaintext from 'highlight.js/es/languages/plaintext'
import powershell from 'highlight.js/es/languages/powershell'
import properties from 'highlight.js/es/languages/properties'
import python from 'highlight.js/es/languages/python'
import r from 'highlight.js/es/languages/r'
import ruby from 'highlight.js/es/languages/ruby'
import rust from 'highlight.js/es/languages/rust'
import scala from 'highlight.js/es/languages/scala'
import scss from 'highlight.js/es/languages/scss'
import shell from 'highlight.js/es/languages/shell'
import sql from 'highlight.js/es/languages/sql'
import swift from 'highlight.js/es/languages/swift'
import typescript from 'highlight.js/es/languages/typescript'
import xml from 'highlight.js/es/languages/xml'
import yaml from 'highlight.js/es/languages/yaml'
// @ts-expect-error No types available
import curl from 'highlightjs-curl'

/**
 * We group languages into three categories based on their popularity and usage.
 * This helps in optimizing the bundle size by allowing users to include only
 * the languages they need.
 *
 * 1. Standard Languages: These are the most popular languages that cover the
 *    majority of use cases.
 * 2. Medium Languages: These languages are not as popular as the ones in
 *    `standardLanguages`, but still have a decent amount of users.
 * 3. Specialized Languages: These languages are more specialized and have a
 *    smaller user base.
 *
 * Each category is represented as a separate object, making it easy to import
 * only the languages you need.
 */

/**
 * These are the most popular languages that cover the majority of use cases.
 */
export const standardLanguages = {
  bash,
  c,
  clojure,
  cpp,
  csharp,
  css,
  curl,
  dart,
  diff,
  docker: dockerfile,
  dockerfile,
  elixir,
  fsharp,
  go,
  graphql,
  haskell,
  html: xml,
  http,
  ini,
  java,
  javascript,
  json,
  kotlin,
  less,
  lua,
  makefile,
  markdown,
  matlab,
  nginx,
  objectivec,
  ocaml,
  perl,
  php,
  plaintext,
  powershell,
  properties,
  python,
  r,
  ruby,
  rust,
  scala,
  scss,
  shell,
  sql,
  swift,
  toml: ini,
  typescript,
  xml,
  yaml,
} as const satisfies Record<string, LanguageFn>
