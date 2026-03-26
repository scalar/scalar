import type { LanguageFn } from 'highlight.js'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import clojure from 'highlight.js/lib/languages/clojure'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import dart from 'highlight.js/lib/languages/dart'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import elixir from 'highlight.js/lib/languages/elixir'
import fsharp from 'highlight.js/lib/languages/fsharp'
import go from 'highlight.js/lib/languages/go'
import graphql from 'highlight.js/lib/languages/graphql'
import http from 'highlight.js/lib/languages/http'
import ini from 'highlight.js/lib/languages/ini'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import less from 'highlight.js/lib/languages/less'
import markdown from 'highlight.js/lib/languages/markdown'
import objectivec from 'highlight.js/lib/languages/objectivec'
import ocaml from 'highlight.js/lib/languages/ocaml'
import php from 'highlight.js/lib/languages/php'
import plaintext from 'highlight.js/lib/languages/plaintext'
import powershell from 'highlight.js/lib/languages/powershell'
import python from 'highlight.js/lib/languages/python'
import r from 'highlight.js/lib/languages/r'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import scala from 'highlight.js/lib/languages/scala'
import scss from 'highlight.js/lib/languages/scss'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import swift from 'highlight.js/lib/languages/swift'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
// @ts-expect-error No types available
import curl from 'highlightjs-curl'

/**
 * Languages included here are those with active code-generation support in
 * @scalar/snippetz or with clear relevance to API documentation. Languages
 * removed from a previous larger set (diff, haskell, lua, makefile, matlab,
 * nginx, perl, properties) have no snippetz plugin and are rarely used in
 * API code samples, so carrying them in every bundle is unnecessary weight.
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
  docker: dockerfile,
  dockerfile,
  elixir,
  fsharp,
  go,
  graphql,
  html: xml,
  http,
  ini,
  java,
  javascript,
  json,
  kotlin,
  less,
  markdown,
  objectivec,
  ocaml,
  php,
  plaintext,
  powershell,
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
