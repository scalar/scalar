import type { LanguageFn } from 'highlight.js'
import ada from 'highlight.js/lib/languages/ada'
import apache from 'highlight.js/lib/languages/apache'
import applescript from 'highlight.js/lib/languages/applescript'
import asciidoc from 'highlight.js/lib/languages/asciidoc'
import awk from 'highlight.js/lib/languages/awk'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import clojure from 'highlight.js/lib/languages/clojure'
import cmake from 'highlight.js/lib/languages/cmake'
import coffeescript from 'highlight.js/lib/languages/coffeescript'
import coq from 'highlight.js/lib/languages/coq'
import cpp from 'highlight.js/lib/languages/cpp'
import crystal from 'highlight.js/lib/languages/crystal'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import d from 'highlight.js/lib/languages/d'
import dart from 'highlight.js/lib/languages/dart'
import delphi from 'highlight.js/lib/languages/delphi'
import diff from 'highlight.js/lib/languages/diff'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import elixir from 'highlight.js/lib/languages/elixir'
import elm from 'highlight.js/lib/languages/elm'
import erlang from 'highlight.js/lib/languages/erlang'
import fsharp from 'highlight.js/lib/languages/fsharp'
import glsl from 'highlight.js/lib/languages/glsl'
import go from 'highlight.js/lib/languages/go'
import graphql from 'highlight.js/lib/languages/graphql'
import groovy from 'highlight.js/lib/languages/groovy'
import haml from 'highlight.js/lib/languages/haml'
import handlebars from 'highlight.js/lib/languages/handlebars'
import haskell from 'highlight.js/lib/languages/haskell'
import http from 'highlight.js/lib/languages/http'
import ini from 'highlight.js/lib/languages/ini'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import julia from 'highlight.js/lib/languages/julia'
import kotlin from 'highlight.js/lib/languages/kotlin'
import latex from 'highlight.js/lib/languages/latex'
import less from 'highlight.js/lib/languages/less'
import lisp from 'highlight.js/lib/languages/lisp'
import lua from 'highlight.js/lib/languages/lua'
import makefile from 'highlight.js/lib/languages/makefile'
import markdown from 'highlight.js/lib/languages/markdown'
import matlab from 'highlight.js/lib/languages/matlab'
import nginx from 'highlight.js/lib/languages/nginx'
import nim from 'highlight.js/lib/languages/nim'
import nix from 'highlight.js/lib/languages/nix'
import objectivec from 'highlight.js/lib/languages/objectivec'
import ocaml from 'highlight.js/lib/languages/ocaml'
import perl from 'highlight.js/lib/languages/perl'
import php from 'highlight.js/lib/languages/php'
import plaintext from 'highlight.js/lib/languages/plaintext'
import powershell from 'highlight.js/lib/languages/powershell'
import prolog from 'highlight.js/lib/languages/prolog'
import properties from 'highlight.js/lib/languages/properties'
import protobuf from 'highlight.js/lib/languages/protobuf'
import python from 'highlight.js/lib/languages/python'
import r from 'highlight.js/lib/languages/r'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import scala from 'highlight.js/lib/languages/scala'
import scheme from 'highlight.js/lib/languages/scheme'
import scss from 'highlight.js/lib/languages/scss'
import shell from 'highlight.js/lib/languages/shell'
import smalltalk from 'highlight.js/lib/languages/smalltalk'
import sql from 'highlight.js/lib/languages/sql'
import stylus from 'highlight.js/lib/languages/stylus'
import swift from 'highlight.js/lib/languages/swift'
import tcl from 'highlight.js/lib/languages/tcl'
import twig from 'highlight.js/lib/languages/twig'
import typescript from 'highlight.js/lib/languages/typescript'
import verilog from 'highlight.js/lib/languages/verilog'
import vhdl from 'highlight.js/lib/languages/vhdl'
import vim from 'highlight.js/lib/languages/vim'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
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
const standardLanguages: Record<string, LanguageFn> = {
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
}

/**
 * These languages are not as popular as the ones in `standardLanguages`, but
 * still have a decent amount of users.
 */
const mediumLanguages: Record<string, LanguageFn> = {
  cmake,
  crystal,
  elm,
  erl: erlang,
  erlang,
  fsharp,
  glsl,
  groovy,
  handlebars,
  hbs: handlebars,
  jl: julia,
  julia,
  nim,
  nix,
  proto: protobuf,
  protobuf,
  styl: stylus,
  stylus,
  twig,
  verilog,
  vhdl,
}

/**
 * These languages are more specialized and have a smaller user base.
 */
const specializedLanguages: Record<string, LanguageFn> = {
  ada,
  adoc: asciidoc,
  apache,
  applescript,
  asciidoc,
  awk,
  coffee: coffeescript,
  coffeescript,
  coq,
  d,
  haml,
  hs: haskell,
  lisp,
  latex,
  pascal: delphi,
  prolog,
  scheme,
  smalltalk,
  tcl,
  tex: latex,
  vim,
}

/**
 * A combined list of all languages.
 */
const allLanguages: Record<string, LanguageFn> = {
  ...standardLanguages,
  ...mediumLanguages,
  ...specializedLanguages,
}

export { standardLanguages, mediumLanguages, specializedLanguages, allLanguages }
