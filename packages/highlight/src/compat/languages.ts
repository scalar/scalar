import { getLanguage } from '../core/registry'
import type { CompiledGrammar } from '../core/types'

/**
 * `lowlightLanguageMappings`, copied verbatim from `@scalar/code-highlight`.
 *
 * This runs before anything else and decides the `language-*` class on the
 * `<code>` element, so it has to stay byte-identical: `code.css` targets
 * `.hljs.language-html`, `.hljs.language-curl` and friends by name.
 */
export const lowlightLanguageMappings: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  py3: 'python',
  'c#': 'csharp',
  'c++': 'cpp',
  node: 'javascript',
}

/**
 * highlight.js language names -> the grammar in this package that covers them.
 *
 * One grammar answers to several highlight.js names, which is most of why
 * forty grammars reach as far as they do: `xml`, `svg` and `vue` are all the
 * HTML grammar, `ts`/`tsx`/`jsx` are all the JavaScript grammar.
 */
const GRAMMAR_FOR: Record<string, string> = {
  bash: 'bash',
  c: 'c',
  'c#': 'csharp',
  'c++': 'cpp',
  cc: 'cpp',
  cjs: 'javascript',
  clj: 'clojure',
  clojure: 'clojure',
  console: 'bash',
  cpp: 'cpp',
  cs: 'csharp',
  csharp: 'csharp',
  css: 'css',
  curl: 'curl',
  cxx: 'cpp',
  dart: 'dart',
  diff: 'diff',
  docker: 'dockerfile',
  dockerfile: 'dockerfile',
  elixir: 'elixir',
  ex: 'elixir',
  exs: 'elixir',
  'f#': 'fsharp',
  fs: 'fsharp',
  fsharp: 'fsharp',
  go: 'go',
  golang: 'go',
  gql: 'graphql',
  graphql: 'graphql',
  h: 'c',
  'h++': 'cpp',
  haskell: 'haskell',
  hpp: 'cpp',
  hs: 'haskell',
  html: 'html',
  http: 'http',
  https: 'http',
  hxx: 'cpp',
  ini: 'ini',
  java: 'java',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  json5: 'json',
  jsonc: 'json',
  jsx: 'javascript',
  kotlin: 'kotlin',
  kt: 'kotlin',
  less: 'css',
  lua: 'lua',
  make: 'makefile',
  makefile: 'makefile',
  markdown: 'markdown',
  matlab: 'matlab',
  md: 'markdown',
  mdx: 'markdown',
  mjs: 'javascript',
  mk: 'makefile',
  ml: 'ocaml',
  mojo: 'mojo',
  mysql: 'sql',
  nginx: 'nginx',
  nginxconf: 'nginx',
  'obj-c': 'objectivec',
  objc: 'objectivec',
  objectivec: 'objectivec',
  ocaml: 'ocaml',
  octave: 'matlab',
  patch: 'diff',
  perl: 'perl',
  php: 'php',
  pl: 'perl',
  pm: 'perl',
  posh: 'powershell',
  postgres: 'sql',
  postgresql: 'sql',
  powershell: 'powershell',
  properties: 'ini',
  ps: 'powershell',
  ps1: 'powershell',
  pwsh: 'powershell',
  py: 'python',
  py3: 'python',
  python: 'python',
  python3: 'python',
  r: 'r',
  rb: 'ruby',
  rs: 'rust',
  ruby: 'ruby',
  rust: 'rust',
  sbt: 'scala',
  scala: 'scala',
  scss: 'css',
  sh: 'bash',
  shell: 'bash',
  sql: 'sql',
  sqlite: 'sql',
  svg: 'html',
  swift: 'swift',
  toml: 'ini',
  ts: 'javascript',
  tsx: 'javascript',
  typescript: 'javascript',
  vue: 'html',
  xml: 'html',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash',
}

/**
 * Every key of `standardLanguages` in `@scalar/code-highlight`.
 *
 * Kept so `keyof typeof standardLanguages` — which is how `ScalarCodeBlock`
 * derives its `StandardLanguageKey` prop type — resolves to the same union
 * after a swap. The names we have no grammar for stay in the list: they
 * render as plain escaped text, which is what an unregistered language does
 * in the lowlight pipeline today.
 */
export const STANDARD_LANGUAGE_NAMES = [
  'bash',
  'c',
  'clojure',
  'cpp',
  'csharp',
  'css',
  'curl',
  'dart',
  'diff',
  'docker',
  'dockerfile',
  'elixir',
  'fsharp',
  'go',
  'graphql',
  'haskell',
  'html',
  'http',
  'ini',
  'java',
  'javascript',
  'json',
  // Kept in `StandardLanguageKey` for parity with `@scalar/code-highlight`,
  // which highlights Julia via highlight.js. This zero-dependency package has
  // no hand-written Julia grammar yet, so it stays in `unsupportedLanguages`
  // and renders as plain escaped text until one is added.
  'julia',
  'kotlin',
  'less',
  'lua',
  'makefile',
  'markdown',
  'matlab',
  'mojo',
  'nginx',
  'objectivec',
  'ocaml',
  'perl',
  'php',
  'plaintext',
  'powershell',
  'properties',
  'python',
  'r',
  'ruby',
  'rust',
  'scala',
  'scss',
  'shell',
  'sql',
  'swift',
  'toml',
  'typescript',
  'xml',
  'yaml',
] as const

export type StandardLanguageKey = (typeof STANDARD_LANGUAGE_NAMES)[number]

/**
 * Stand-in for `standardLanguages`.
 *
 * The lowlight version maps each name to a highlight.js `LanguageFn`; this one
 * maps to our grammar name, or `null` where we have no grammar yet. Callers
 * pass it straight back into `syntaxHighlight`, which ignores it — the
 * registry already knows what is loaded — so the value only has to carry the
 * key set and the coverage answer.
 */
export const standardLanguages = Object.fromEntries(
  STANDARD_LANGUAGE_NAMES.map((name) => [name, GRAMMAR_FOR[name] ?? null]),
) as Record<StandardLanguageKey, string | null>

/** Language names in `standardLanguages` that no bundled grammar covers yet. */
export const unsupportedLanguages: string[] = STANDARD_LANGUAGE_NAMES.filter((name) => !GRAMMAR_FOR[name])

/**
 * Applies the lowlight alias table. The result is what lands in the
 * `language-*` class, whether or not we can highlight it.
 */
export const canonicalName = (lang: string): string => {
  // `lang` reaches here straight from a markdown fence, so `constructor` and
  // `__proto__` are names a document can ask for. A bare index would return
  // something off Object.prototype rather than undefined.
  return Object.hasOwn(lowlightLanguageMappings, lang) ? (lowlightLanguageMappings[lang] ?? lang) : lang
}

/**
 * Finds a grammar for a highlight.js language name, or `undefined`.
 *
 * Never throws. An unknown language has to degrade to unhighlighted code the
 * way `rehype-highlight` does — a docs page with one exotic fence should not
 * lose the whole code block.
 */
export const grammarFor = (lang: string): CompiledGrammar | undefined => {
  const key = lang.toLowerCase()
  return getLanguage(Object.hasOwn(GRAMMAR_FOR, key) ? (GRAMMAR_FOR[key] ?? key) : key)
}
