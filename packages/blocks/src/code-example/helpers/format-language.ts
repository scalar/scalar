import { capitalize } from '@scalar/helpers/string/capitalize'

/**
 * Display names for the most common languages found in custom code samples.
 *
 * Custom samples (`x-scalar-examples`, `x-readme`, `x-stainless-*`, …) carry a
 * free-form `lang` string that we otherwise show verbatim in the picker. This
 * map gives the common ones a properly cased label (e.g. `typescript` →
 * `TypeScript`). Anything not listed falls back to a simple capitalization.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  c: 'C',
  clojure: 'Clojure',
  cpp: 'C++',
  'c++': 'C++',
  csharp: 'C#',
  'c#': 'C#',
  css: 'CSS',
  curl: 'cURL',
  dart: 'Dart',
  fsharp: 'F#',
  'f#': 'F#',
  go: 'Go',
  golang: 'Go',
  graphql: 'GraphQL',
  html: 'HTML',
  http: 'HTTP',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  node: 'Node.js',
  nodejs: 'Node.js',
  objc: 'Objective-C',
  'objective-c': 'Objective-C',
  ocaml: 'OCaml',
  php: 'PHP',
  powershell: 'PowerShell',
  py: 'Python',
  python: 'Python',
  r: 'R',
  ruby: 'Ruby',
  rust: 'Rust',
  scala: 'Scala',
  sh: 'Shell',
  shell: 'Shell',
  bash: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
}

/**
 * Turn a free-form language identifier into a display label for the code sample picker.
 *
 * @param lang - The language identifier from a custom code sample (e.g. `typescript`)
 * @returns A properly cased label (e.g. `TypeScript`), or `undefined` when no language is given
 */
export const formatLanguage = (lang?: string): string | undefined => {
  if (!lang) {
    return undefined
  }

  return LANGUAGE_LABELS[lang.toLowerCase()] ?? capitalize(lang)
}
