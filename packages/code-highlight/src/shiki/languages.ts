import type { LanguageRegistration } from '@shikijs/types'

/**
 * Lazy grammar loaders, keyed by Shiki language id.
 *
 * Each entry is a dynamic `import()` of a single grammar, so bundlers split
 * every language into its own chunk and only the grammar that is actually used
 * gets fetched at runtime. This is the whole point of the migration: load the
 * Shiki core once, then pull in one grammar on demand instead of shipping every
 * language up front.
 */
export const languageLoaders = {
  bash: () => import('@shikijs/langs/bash'),
  c: () => import('@shikijs/langs/c'),
  clojure: () => import('@shikijs/langs/clojure'),
  cpp: () => import('@shikijs/langs/cpp'),
  csharp: () => import('@shikijs/langs/csharp'),
  css: () => import('@shikijs/langs/css'),
  dart: () => import('@shikijs/langs/dart'),
  diff: () => import('@shikijs/langs/diff'),
  docker: () => import('@shikijs/langs/docker'),
  elixir: () => import('@shikijs/langs/elixir'),
  fsharp: () => import('@shikijs/langs/fsharp'),
  go: () => import('@shikijs/langs/go'),
  graphql: () => import('@shikijs/langs/graphql'),
  haskell: () => import('@shikijs/langs/haskell'),
  html: () => import('@shikijs/langs/html'),
  http: () => import('@shikijs/langs/http'),
  ini: () => import('@shikijs/langs/ini'),
  java: () => import('@shikijs/langs/java'),
  javascript: () => import('@shikijs/langs/javascript'),
  json: () => import('@shikijs/langs/json'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  less: () => import('@shikijs/langs/less'),
  lua: () => import('@shikijs/langs/lua'),
  makefile: () => import('@shikijs/langs/makefile'),
  markdown: () => import('@shikijs/langs/markdown'),
  matlab: () => import('@shikijs/langs/matlab'),
  nginx: () => import('@shikijs/langs/nginx'),
  'objective-c': () => import('@shikijs/langs/objective-c'),
  ocaml: () => import('@shikijs/langs/ocaml'),
  perl: () => import('@shikijs/langs/perl'),
  php: () => import('@shikijs/langs/php'),
  powershell: () => import('@shikijs/langs/powershell'),
  properties: () => import('@shikijs/langs/properties'),
  python: () => import('@shikijs/langs/python'),
  r: () => import('@shikijs/langs/r'),
  ruby: () => import('@shikijs/langs/ruby'),
  rust: () => import('@shikijs/langs/rust'),
  scala: () => import('@shikijs/langs/scala'),
  scss: () => import('@shikijs/langs/scss'),
  shellscript: () => import('@shikijs/langs/shellscript'),
  sql: () => import('@shikijs/langs/sql'),
  swift: () => import('@shikijs/langs/swift'),
  toml: () => import('@shikijs/langs/toml'),
  typescript: () => import('@shikijs/langs/typescript'),
  xml: () => import('@shikijs/langs/xml'),
  yaml: () => import('@shikijs/langs/yaml'),
} satisfies Record<string, () => Promise<{ default: LanguageRegistration[] }>>

/** A language id that has a grammar loader. */
export type ShikiLanguage = keyof typeof languageLoaders

/**
 * Aliases that differ from the canonical Shiki id, so the highlighter accepts
 * the same shorthands the previous highlight.js setup did (`ts`, `js`, `c#`,
 * `curl`, etc.).
 *
 * Shiki has no `curl` grammar, so cURL snippets are highlighted as shell, which
 * matches how they are written in practice.
 */
const languageAliases: Record<string, ShikiLanguage> = {
  'c#': 'csharp',
  'c++': 'cpp',
  cjs: 'javascript',
  curl: 'shellscript',
  dockerfile: 'docker',
  js: 'javascript',
  mjs: 'javascript',
  node: 'javascript',
  objc: 'objective-c',
  objectivec: 'objective-c',
  'obj-c': 'objective-c',
  ps: 'powershell',
  ps1: 'powershell',
  py: 'python',
  py3: 'python',
  sh: 'shellscript',
  shell: 'shellscript',
  ts: 'typescript',
  zsh: 'shellscript',
}

/**
 * Resolve an input language to a Shiki grammar id, or `null` when it should be
 * rendered as plain text (unknown or explicitly plain languages).
 */
export const resolveLanguage = (lang: string): ShikiLanguage | null => {
  const normalized = lang.trim().toLowerCase()

  if (!normalized) {
    return null
  }

  if (normalized in languageLoaders) {
    return normalized as ShikiLanguage
  }

  return languageAliases[normalized] ?? null
}
