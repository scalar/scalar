import type { Icon } from '@scalar/components/icon'

/**
 * Maps common language names (and a few aliases) to the matching
 * `programming-language-*` icon.
 *
 * The `lang` in `x-scalar-sdk-installation` is a freeform string, so we only
 * resolve the ones we have a logo for and let the caller fall back to text.
 */
const LANGUAGE_ICONS: Record<string, Icon> = {
  c: 'programming-language-c',
  clojure: 'programming-language-clojure',
  csharp: 'programming-language-csharp',
  'c#': 'programming-language-csharp',
  cs: 'programming-language-csharp',
  css: 'programming-language-css3',
  css3: 'programming-language-css3',
  dart: 'programming-language-dart',
  fsharp: 'programming-language-fsharp',
  'f#': 'programming-language-fsharp',
  go: 'programming-language-go',
  golang: 'programming-language-go',
  html: 'programming-language-html5',
  html5: 'programming-language-html5',
  http: 'programming-language-http',
  java: 'programming-language-java',
  javascript: 'programming-language-javascript',
  js: 'programming-language-javascript',
  json: 'programming-language-json',
  kotlin: 'programming-language-kotlin',
  node: 'programming-language-node',
  'node.js': 'programming-language-node',
  nodejs: 'programming-language-node',
  objc: 'programming-language-objc',
  'objective-c': 'programming-language-objc',
  ocaml: 'programming-language-ocaml',
  php: 'programming-language-php',
  powershell: 'programming-language-powershell',
  python: 'programming-language-python',
  py: 'programming-language-python',
  r: 'programming-language-r',
  ruby: 'programming-language-ruby',
  rb: 'programming-language-ruby',
  rust: 'programming-language-rust',
  rs: 'programming-language-rust',
  scala: 'programming-language-scala',
  shell: 'programming-language-shell',
  bash: 'programming-language-shell',
  sh: 'programming-language-shell',
  curl: 'programming-language-shell',
  swift: 'programming-language-swift',
  typescript: 'programming-language-typescript',
  ts: 'programming-language-typescript',
}

/** Find the programming language icon for a given language name, if we have one. */
export const getLanguageIcon = (lang: string): Icon | undefined => LANGUAGE_ICONS[lang.trim().toLowerCase()]
