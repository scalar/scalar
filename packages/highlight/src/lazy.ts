import { getLanguage, registerLanguage } from './core/registry'
import type { CompiledGrammar } from './core/types'

/**
 * On-demand language loading.
 *
 * Every entry is a bare `import()` of a static path, which is the form
 * bundlers recognize: each language becomes its own chunk, and a page that
 * only ever highlights Python downloads only Python.
 *
 * Import this module only if you want that. `import python from
 * "@scalar/highlight/langs/python"` is the static equivalent and pulls in nothing
 * else.
 */
const loaders = {
  bash: () => import('./langs/bash'),
  c: () => import('./langs/c'),
  clojure: () => import('./langs/clojure'),
  cpp: () => import('./langs/cpp'),
  csharp: () => import('./langs/csharp'),
  css: () => import('./langs/css'),
  dart: () => import('./langs/dart'),
  diff: () => import('./langs/diff'),
  dockerfile: () => import('./langs/dockerfile'),
  elixir: () => import('./langs/elixir'),
  fsharp: () => import('./langs/fsharp'),
  go: () => import('./langs/go'),
  graphql: () => import('./langs/graphql'),
  haskell: () => import('./langs/haskell'),
  html: () => import('./langs/html'),
  http: () => import('./langs/http'),
  ini: () => import('./langs/ini'),
  java: () => import('./langs/java'),
  javascript: () => import('./langs/javascript'),
  json: () => import('./langs/json'),
  kotlin: () => import('./langs/kotlin'),
  lua: () => import('./langs/lua'),
  makefile: () => import('./langs/makefile'),
  markdown: () => import('./langs/markdown'),
  matlab: () => import('./langs/matlab'),
  mojo: () => import('./langs/mojo'),
  nginx: () => import('./langs/nginx'),
  objectivec: () => import('./langs/objectivec'),
  ocaml: () => import('./langs/ocaml'),
  perl: () => import('./langs/perl'),
  php: () => import('./langs/php'),
  powershell: () => import('./langs/powershell'),
  python: () => import('./langs/python'),
  r: () => import('./langs/r'),
  ruby: () => import('./langs/ruby'),
  rust: () => import('./langs/rust'),
  scala: () => import('./langs/scala'),
  sql: () => import('./langs/sql'),
  swift: () => import('./langs/swift'),
  yaml: () => import('./langs/yaml'),
} satisfies Record<string, () => Promise<{ default: unknown }>>

export type BundledLanguage = keyof typeof loaders

/**
 * Aliases, so `loadLanguage('tsx')` finds the JavaScript grammar without
 * loading every module to ask each one what it answers to.
 */
const aliases: Record<string, BundledLanguage> = {
  bsdmake: 'makefile',
  'c#': 'csharp',
  'c++': 'cpp',
  cc: 'cpp',
  cfg: 'ini',
  cjs: 'javascript',
  clj: 'clojure',
  cljc: 'clojure',
  cljs: 'clojure',
  conf: 'ini',
  console: 'bash',
  containerfile: 'dockerfile',
  cppm: 'cpp',
  cs: 'csharp',
  curl: 'bash',
  cxx: 'cpp',
  docker: 'dockerfile',
  edn: 'clojure',
  ex: 'elixir',
  exs: 'elixir',
  'f#': 'fsharp',
  fs: 'fsharp',
  fsi: 'fsharp',
  fsx: 'fsharp',
  gemspec: 'ruby',
  golang: 'go',
  gql: 'graphql',
  h: 'c',
  'h++': 'cpp',
  hpp: 'cpp',
  hs: 'haskell',
  https: 'http',
  hxx: 'cpp',
  js: 'javascript',
  json5: 'json',
  jsonc: 'json',
  jsx: 'javascript',
  kt: 'kotlin',
  kts: 'kotlin',
  less: 'css',
  m: 'matlab',
  make: 'makefile',
  md: 'markdown',
  mdx: 'markdown',
  mjs: 'javascript',
  mk: 'makefile',
  ml: 'ocaml',
  mli: 'ocaml',
  mysql: 'sql',
  'nginx-conf': 'nginx',
  nginxconf: 'nginx',
  node: 'javascript',
  'obj-c': 'objectivec',
  objc: 'objectivec',
  'objective-c': 'objectivec',
  octave: 'matlab',
  patch: 'diff',
  php3: 'php',
  php4: 'php',
  php5: 'php',
  php8: 'php',
  pl: 'perl',
  pm: 'perl',
  posh: 'powershell',
  postgres: 'sql',
  postgresql: 'sql',
  properties: 'ini',
  ps: 'powershell',
  ps1: 'powershell',
  pwsh: 'powershell',
  py: 'python',
  py3: 'python',
  python3: 'python',
  rake: 'ruby',
  rb: 'ruby',
  rs: 'rust',
  sbt: 'scala',
  sc: 'scala',
  scss: 'css',
  sh: 'bash',
  shell: 'bash',
  sqlite: 'sql',
  svg: 'html',
  toml: 'ini',
  ts: 'javascript',
  tsx: 'javascript',
  typescript: 'javascript',
  vue: 'html',
  xml: 'html',
  yml: 'yaml',
  zsh: 'bash',
  '🔥': 'mojo',
}

export const bundledLanguages = Object.keys(loaders) as BundledLanguage[]

/** Resolves a name or alias to a bundled language, or `undefined`. */
export const resolveLanguageName = (name: string): BundledLanguage | undefined => {
  const key = name.toLowerCase()
  // `hasOwn` rather than `in`: `in` walks the prototype chain, so a caller
  // asking for `constructor` would get past this check and then try to call
  // `Object.prototype.constructor` as a loader.
  if (Object.hasOwn(loaders, key)) return key as BundledLanguage
  return Object.hasOwn(aliases, key) ? aliases[key] : undefined
}

const pending = new Map<BundledLanguage, Promise<CompiledGrammar>>()

/**
 * Loads and registers a language, returning its compiled grammar.
 *
 * Concurrent calls for the same language share one import, and an already
 * registered language resolves without touching the network.
 */
export const loadLanguage = (name: string): Promise<CompiledGrammar> => {
  const resolved = resolveLanguageName(name)
  if (!resolved) {
    return Promise.reject(new Error(`Unknown language "${name}". Available: ${bundledLanguages.join(', ')}.`))
  }

  const registered = getLanguage(resolved)
  if (registered) return Promise.resolve(registered)

  let inFlight = pending.get(resolved)
  if (!inFlight) {
    inFlight = loaders[resolved]()
      .then((module) => {
        registerLanguage(module.default as never)
        return getLanguage(resolved)!
      })
      .catch((error) => {
        // Forget a failed import. A chunk request that lost the network would
        // otherwise leave the rejected promise cached, and every later call for
        // that language would replay the failure instead of retrying.
        pending.delete(resolved)
        throw error
      })
    pending.set(resolved, inFlight)
  }
  return inFlight
}

/** Loads several languages at once. */
export const loadLanguages = (...names: string[]): Promise<CompiledGrammar[]> => {
  return Promise.all(names.map(loadLanguage))
}
