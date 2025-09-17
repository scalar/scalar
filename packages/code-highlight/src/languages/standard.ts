import type { LanguageFn } from 'highlight.js'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import clojure from 'highlight.js/lib/languages/clojure'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import dart from 'highlight.js/lib/languages/dart'
import elixir from 'highlight.js/lib/languages/elixir'
import go from 'highlight.js/lib/languages/go'
import graphql from 'highlight.js/lib/languages/graphql'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import less from 'highlight.js/lib/languages/less'
import makefile from 'highlight.js/lib/languages/makefile'
import markdown from 'highlight.js/lib/languages/markdown'
import matlab from 'highlight.js/lib/languages/matlab'
import nginx from 'highlight.js/lib/languages/nginx'
import objectivec from 'highlight.js/lib/languages/objectivec'
import ocaml from 'highlight.js/lib/languages/ocaml'
import php from 'highlight.js/lib/languages/php'
import plaintext from 'highlight.js/lib/languages/plaintext'
import powershell from 'highlight.js/lib/languages/powershell'
import python from 'highlight.js/lib/languages/python'
import r from 'highlight.js/lib/languages/r'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import scss from 'highlight.js/lib/languages/scss'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import swift from 'highlight.js/lib/languages/swift'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import diff from 'highlight.js/lib/languages/diff'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import haskell from 'highlight.js/lib/languages/haskell'
import http from 'highlight.js/lib/languages/http'
import ini from 'highlight.js/lib/languages/ini'
import lua from 'highlight.js/lib/languages/lua'
import perl from 'highlight.js/lib/languages/perl'
import properties from 'highlight.js/lib/languages/properties'
import scala from 'highlight.js/lib/languages/scala'
import cmake from 'highlight.js/lib/languages/cmake'
import crystal from 'highlight.js/lib/languages/crystal'
import elm from 'highlight.js/lib/languages/elm'
import erlang from 'highlight.js/lib/languages/erlang'
import fsharp from 'highlight.js/lib/languages/fsharp'
import glsl from 'highlight.js/lib/languages/glsl'
import groovy from 'highlight.js/lib/languages/groovy'
import handlebars from 'highlight.js/lib/languages/handlebars'
import julia from 'highlight.js/lib/languages/julia'
import nim from 'highlight.js/lib/languages/nim'
import nix from 'highlight.js/lib/languages/nix'
import protobuf from 'highlight.js/lib/languages/protobuf'
import stylus from 'highlight.js/lib/languages/stylus'
import twig from 'highlight.js/lib/languages/twig'
import verilog from 'highlight.js/lib/languages/verilog'
import vhdl from 'highlight.js/lib/languages/vhdl'
import ada from 'highlight.js/lib/languages/ada'
import apache from 'highlight.js/lib/languages/apache'
import applescript from 'highlight.js/lib/languages/applescript'
import asciidoc from 'highlight.js/lib/languages/asciidoc'
import awk from 'highlight.js/lib/languages/awk'
import coffeescript from 'highlight.js/lib/languages/coffeescript'
import coq from 'highlight.js/lib/languages/coq'
import d from 'highlight.js/lib/languages/d'
import haml from 'highlight.js/lib/languages/haml'
import lisp from 'highlight.js/lib/languages/lisp'
import delphi from 'highlight.js/lib/languages/delphi'
import prolog from 'highlight.js/lib/languages/prolog'
import scheme from 'highlight.js/lib/languages/scheme'
import smalltalk from 'highlight.js/lib/languages/smalltalk'
import tcl from 'highlight.js/lib/languages/tcl'
import latex from 'highlight.js/lib/languages/latex'
import vim from 'highlight.js/lib/languages/vim'
// @ts-expect-error No types available
import curl from 'highlightjs-curl'

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

const allLanguages: Record<string, LanguageFn> = {
  ...standardLanguages,
  ...mediumLanguages,
  ...specializedLanguages,
}

export { standardLanguages, mediumLanguages, specializedLanguages, allLanguages }
