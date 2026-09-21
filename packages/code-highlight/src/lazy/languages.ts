import type { LanguageFn } from 'highlight.js'

import { lowlightLanguageMappings } from '../constants'

const loaders: Record<string, () => Promise<LanguageFn>> = {
  bash: () => import('highlight.js/lib/languages/bash').then((module) => module.default),
  c: () => import('highlight.js/lib/languages/c').then((module) => module.default),
  clojure: () => import('highlight.js/lib/languages/clojure').then((module) => module.default),
  cpp: () => import('highlight.js/lib/languages/cpp').then((module) => module.default),
  csharp: () => import('highlight.js/lib/languages/csharp').then((module) => module.default),
  css: () => import('highlight.js/lib/languages/css').then((module) => module.default),
  curl: () => import('../languages/curl').then((module) => module.default),
  dart: () => import('highlight.js/lib/languages/dart').then((module) => module.default),
  diff: () => import('highlight.js/lib/languages/diff').then((module) => module.default),
  docker: () => import('highlight.js/lib/languages/dockerfile').then((module) => module.default),
  dockerfile: () => import('highlight.js/lib/languages/dockerfile').then((module) => module.default),
  elixir: () => import('highlight.js/lib/languages/elixir').then((module) => module.default),
  fsharp: () => import('highlight.js/lib/languages/fsharp').then((module) => module.default),
  go: () => import('highlight.js/lib/languages/go').then((module) => module.default),
  graphql: () => import('highlight.js/lib/languages/graphql').then((module) => module.default),
  haskell: () => import('highlight.js/lib/languages/haskell').then((module) => module.default),
  html: () => import('highlight.js/lib/languages/xml').then((module) => module.default),
  http: () => import('highlight.js/lib/languages/http').then((module) => module.default),
  ini: () => import('highlight.js/lib/languages/ini').then((module) => module.default),
  java: () => import('highlight.js/lib/languages/java').then((module) => module.default),
  javascript: () => import('highlight.js/lib/languages/javascript').then((module) => module.default),
  json: () => import('highlight.js/lib/languages/json').then((module) => module.default),
  julia: () => import('highlight.js/lib/languages/julia').then((module) => module.default),
  kotlin: () => import('highlight.js/lib/languages/kotlin').then((module) => module.default),
  less: () => import('highlight.js/lib/languages/less').then((module) => module.default),
  lua: () => import('highlight.js/lib/languages/lua').then((module) => module.default),
  makefile: () => import('highlight.js/lib/languages/makefile').then((module) => module.default),
  markdown: () => import('highlight.js/lib/languages/markdown').then((module) => module.default),
  matlab: () => import('highlight.js/lib/languages/matlab').then((module) => module.default),
  mojo: () => import('../languages/mojo').then((module) => module.default),
  nginx: () => import('highlight.js/lib/languages/nginx').then((module) => module.default),
  objectivec: () => import('highlight.js/lib/languages/objectivec').then((module) => module.default),
  ocaml: () => import('highlight.js/lib/languages/ocaml').then((module) => module.default),
  perl: () => import('highlight.js/lib/languages/perl').then((module) => module.default),
  php: () => import('highlight.js/lib/languages/php').then((module) => module.default),
  plaintext: () => import('highlight.js/lib/languages/plaintext').then((module) => module.default),
  powershell: () => import('highlight.js/lib/languages/powershell').then((module) => module.default),
  properties: () => import('highlight.js/lib/languages/properties').then((module) => module.default),
  python: () => import('../languages/python').then((module) => module.default),
  r: () => import('highlight.js/lib/languages/r').then((module) => module.default),
  ruby: () => import('highlight.js/lib/languages/ruby').then((module) => module.default),
  rust: () => import('highlight.js/lib/languages/rust').then((module) => module.default),
  scala: () => import('highlight.js/lib/languages/scala').then((module) => module.default),
  scss: () => import('highlight.js/lib/languages/scss').then((module) => module.default),
  shell: () => import('highlight.js/lib/languages/shell').then((module) => module.default),
  sql: () => import('highlight.js/lib/languages/sql').then((module) => module.default),
  swift: () => import('highlight.js/lib/languages/swift').then((module) => module.default),
  toml: () => import('highlight.js/lib/languages/ini').then((module) => module.default),
  typescript: () => import('highlight.js/lib/languages/typescript').then((module) => module.default),
  xml: () => import('highlight.js/lib/languages/xml').then((module) => module.default),
  yaml: () => import('highlight.js/lib/languages/yaml').then((module) => module.default),
}

// Sublanguages are required by embedded code (for example CSS and JavaScript in HTML).
const dependencies: Record<string, string[]> = {
  xml: ['css', 'javascript'],
  html: ['css', 'javascript'],
  javascript: ['xml', 'graphql'],
  typescript: ['xml', 'graphql'],
  markdown: ['xml'],
  php: ['xml'],
  shell: ['bash'],
  yaml: ['ruby'],
}
const aliases: Record<string, string> = {
  'sh': 'bash',
  'zsh': 'bash',
  'h': 'c',
  'clj': 'clojure',
  'edn': 'clojure',
  'cc': 'cpp',
  'c++': 'cpp',
  'h++': 'cpp',
  'hpp': 'cpp',
  'hh': 'cpp',
  'hxx': 'cpp',
  'cxx': 'cpp',
  'cs': 'csharp',
  'c#': 'csharp',
  'curl': 'curl',
  'patch': 'diff',
  'docker': 'dockerfile',
  'ex': 'elixir',
  'exs': 'elixir',
  'fs': 'fsharp',
  'f#': 'fsharp',
  'golang': 'go',
  'gql': 'graphql',
  'hs': 'haskell',
  'html': 'xml',
  'xhtml': 'xml',
  'rss': 'xml',
  'atom': 'xml',
  'xjb': 'xml',
  'xsd': 'xml',
  'xsl': 'xml',
  'plist': 'xml',
  'wsf': 'xml',
  'svg': 'xml',
  'https': 'http',
  'toml': 'toml',
  'jsp': 'java',
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'jsonc': 'json',
  'kt': 'kotlin',
  'kts': 'kotlin',
  'pluto': 'lua',
  'mk': 'makefile',
  'mak': 'makefile',
  'make': 'makefile',
  'md': 'markdown',
  'mkdown': 'markdown',
  'mkd': 'markdown',
  'mojo': 'mojo',
  '🔥': 'mojo',
  'nginxconf': 'nginx',
  'mm': 'objectivec',
  'objc': 'objectivec',
  'obj-c': 'objectivec',
  'obj-c++': 'objectivec',
  'objective-c++': 'objectivec',
  'ml': 'ocaml',
  'pl': 'perl',
  'pm': 'perl',
  'text': 'plaintext',
  'txt': 'plaintext',
  'pwsh': 'powershell',
  'ps': 'powershell',
  'ps1': 'powershell',
  'py': 'python',
  'gyp': 'python',
  'ipython': 'python',
  'rb': 'ruby',
  'gemspec': 'ruby',
  'podspec': 'ruby',
  'thor': 'ruby',
  'irb': 'ruby',
  'rs': 'rust',
  'console': 'shell',
  'shellsession': 'shell',
  'ts': 'typescript',
  'tsx': 'typescript',
  'mts': 'typescript',
  'cts': 'typescript',
  'yml': 'yaml',
  ...lowlightLanguageMappings,
}
const pending = new Map<string, Promise<LanguageFn>>()

/** Load the requested grammars and their embedded languages, deduplicating concurrent imports. */
export const loadLanguages = async (names: string[]): Promise<Record<string, LanguageFn>> => {
  // Unlabelled fences and HTTP bodies retain automatic language detection, loaded only when needed.
  if (names.some((name) => name === '' || (aliases[name.toLowerCase()] ?? name.toLowerCase()) === 'http')) {
    return (await import('../languages/standard')).standardLanguages
  }
  const selected = new Set<string>()
  const add = (name: string): void => {
    const key = aliases[name.toLowerCase()] ?? name.toLowerCase()
    if (selected.has(key) || !Object.hasOwn(loaders, key)) {
      return
    }
    selected.add(key)
    for (const dependency of dependencies[key] ?? []) {
      add(dependency)
    }
  }
  names.forEach(add)
  const entries = await Promise.all(
    [...selected].map(async (name) => {
      const loader = loaders[name]
      if (!loader) {
        throw new Error(`Unknown language: ${name}`)
      }
      const request =
        pending.get(name) ??
        loader().catch((error: unknown) => {
          pending.delete(name)
          throw error
        })
      pending.set(name, request)
      return [name, await request] as const
    }),
  )
  return Object.fromEntries(entries)
}
