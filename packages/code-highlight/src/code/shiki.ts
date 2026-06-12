import { createHighlighterCoreSync } from 'shiki/core'
import c from 'shiki/dist/langs/c.mjs'
import clojure from 'shiki/dist/langs/clojure.mjs'
import cpp from 'shiki/dist/langs/cpp.mjs'
import csharp from 'shiki/dist/langs/csharp.mjs'
import css from 'shiki/dist/langs/css.mjs'
import dart from 'shiki/dist/langs/dart.mjs'
import diff from 'shiki/dist/langs/diff.mjs'
import dockerfile from 'shiki/dist/langs/dockerfile.mjs'
import fsharp from 'shiki/dist/langs/fsharp.mjs'
import go from 'shiki/dist/langs/go.mjs'
import html from 'shiki/dist/langs/html.mjs'
import http from 'shiki/dist/langs/http.mjs'
import java from 'shiki/dist/langs/java.mjs'
import javascript from 'shiki/dist/langs/javascript.mjs'
import json from 'shiki/dist/langs/json.mjs'
import kotlin from 'shiki/dist/langs/kotlin.mjs'
import markdown from 'shiki/dist/langs/markdown.mjs'
import objectivec from 'shiki/dist/langs/objective-c.mjs'
import ocaml from 'shiki/dist/langs/ocaml.mjs'
import php from 'shiki/dist/langs/php.mjs'
import powershell from 'shiki/dist/langs/powershell.mjs'
import python from 'shiki/dist/langs/python.mjs'
import r from 'shiki/dist/langs/r.mjs'
import ruby from 'shiki/dist/langs/ruby.mjs'
import rust from 'shiki/dist/langs/rust.mjs'
import shellscript from 'shiki/dist/langs/shellscript.mjs'
import sql from 'shiki/dist/langs/sql.mjs'
import swift from 'shiki/dist/langs/swift.mjs'
import typescript from 'shiki/dist/langs/typescript.mjs'
import xml from 'shiki/dist/langs/xml.mjs'
import yaml from 'shiki/dist/langs/yaml.mjs'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

import { lowlightLanguageMappings } from '@/constants'

type ShikiLanguage = {
  name: string
  aliases?: string[]
}

type ShikiToken = {
  content: string
  color?: string
  fontStyle?: number
}

type ShikiTokens = {
  tokens: ShikiToken[][]
}

const SCALAR_SHIKI_THEME = {
  name: 'scalar',
  type: 'light' as const,
  fg: 'var(--scalar-color-2)',
  bg: 'transparent',
  settings: [
    {
      settings: {
        foreground: 'var(--scalar-color-2)',
        background: 'transparent',
      },
    },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: {
        foreground: 'var(--scalar-color-3)',
        fontStyle: 'italic',
      },
    },
    {
      scope: ['constant.numeric', 'constant.other'],
      settings: { foreground: 'var(--scalar-color-orange)' },
    },
    {
      scope: ['constant.language', 'support.constant'],
      settings: { foreground: 'var(--scalar-color-green)' },
    },
    {
      scope: ['string', 'constant.character.escape', 'regexp'],
      settings: { foreground: 'var(--scalar-color-blue)' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: 'var(--scalar-color-purple)' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'variable.function'],
      settings: { foreground: 'var(--scalar-color-orange)' },
    },
    {
      scope: [
        'entity.name.class',
        'entity.name.namespace',
        'entity.name.struct',
        'entity.name.type',
        'support.class',
        'support.type',
      ],
      settings: { foreground: 'var(--scalar-color-green)' },
    },
    {
      scope: ['entity.name.tag', 'support.type.property-name'],
      settings: { foreground: 'var(--scalar-color-blue)' },
    },
    {
      scope: ['entity.other.attribute-name', 'variable.other.property', 'variable.parameter'],
      settings: { foreground: 'var(--scalar-color-1)' },
    },
    {
      scope: ['variable.language', 'variable.other', 'source'],
      settings: { foreground: 'var(--scalar-color-2)' },
    },
    {
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: 'var(--scalar-color-red)' },
    },
  ],
}

const shikiLanguages = [
  ...c,
  ...clojure,
  ...cpp,
  ...csharp,
  ...css,
  ...dart,
  ...diff,
  ...dockerfile,
  ...fsharp,
  ...go,
  ...html,
  ...http,
  ...java,
  ...javascript,
  ...json,
  ...kotlin,
  ...markdown,
  ...objectivec,
  ...ocaml,
  ...php,
  ...powershell,
  ...python,
  ...r,
  ...ruby,
  ...rust,
  ...shellscript,
  ...sql,
  ...swift,
  ...typescript,
  ...xml,
  ...yaml,
]

const shikiLanguageMappings: Record<string, string> = {
  ...lowlightLanguageMappings,
  bash: 'shellscript',
  curl: 'shellscript',
  docker: 'docker',
  node: 'javascript',
  objectivec: 'objective-c',
  objc: 'objective-c',
  plaintext: 'plaintext',
  sh: 'shellscript',
  shell: 'shellscript',
  text: 'plaintext',
  txt: 'plaintext',
  yml: 'yaml',
  zsh: 'shellscript',
}

const shikiSupportedLanguages = new Set(
  shikiLanguages.flatMap((language) => [language.name, ...(language.aliases ?? [])]),
)

let highlighter: ReturnType<typeof createHighlighterCoreSync> | undefined

/**
 * Highlight code with Shiki's TextMate grammars while preserving the hljs-shaped
 * HTML that Scalar code block consumers already style.
 */
export const highlightWithShiki = (
  codeString: string,
  options: {
    lang: string
    lineNumbers?: boolean
  },
): string | undefined => {
  const lang = getShikiLanguage(options.lang)

  if (!lang) {
    return renderPlainCode(codeString, options)
  }

  if (!shikiSupportedLanguages.has(lang)) {
    return undefined
  }

  try {
    const result = getHighlighter().codeToTokens(codeString, {
      lang,
      theme: SCALAR_SHIKI_THEME.name,
    }) as ShikiTokens

    return renderCode(result.tokens, {
      lang,
      lineNumbers: options.lineNumbers,
    })
  } catch {
    return undefined
  }
}

const getHighlighter = (): ReturnType<typeof createHighlighterCoreSync> => {
  highlighter ??= createHighlighterCoreSync({
    themes: [SCALAR_SHIKI_THEME],
    langs: dedupeLanguages(shikiLanguages),
    engine: createJavaScriptRegexEngine(),
  })

  return highlighter
}

const getShikiLanguage = (lang: string): string | undefined => {
  const normalized = lang.trim().toLowerCase()

  if (!normalized) {
    return undefined
  }

  const mapped = shikiLanguageMappings[normalized] ?? normalized

  return mapped === 'plaintext' ? undefined : mapped
}

const dedupeLanguages = <Language extends ShikiLanguage>(languages: Language[]): Language[] => {
  const byName = new Map<string, Language>()

  languages.forEach((language) => {
    byName.set(language.name, language)
  })

  return Array.from(byName.values())
}

const renderPlainCode = (
  codeString: string,
  options: {
    lang: string
    lineNumbers?: boolean
  },
): string => {
  const lines = codeString.split('\n').map((line) => [
    {
      content: line,
      color: 'var(--scalar-color-2)',
    },
  ])

  return renderCode(lines, {
    lang: 'plaintext',
    lineNumbers: options.lineNumbers,
  })
}

const renderCode = (
  lines: ShikiToken[][],
  options: {
    lang: string
    lineNumbers?: boolean
  },
): string => {
  const code = options.lineNumbers
    ? lines.map((line) => `<span class="line">${renderTokens(line)}</span>`).join('\n')
    : lines.map(renderTokens).join('\n')

  const lineNumberStyle = options.lineNumbers
    ? ` style="--line-count: ${lines.length}; --line-digits: ${lines.length.toString().length};"`
    : ''

  return `<pre><code class="hljs language-${escapeAttribute(options.lang)}"${lineNumberStyle}>${code}</code></pre>`
}

const renderTokens = (tokens: ShikiToken[]): string =>
  tokens
    .map((token) => {
      const style = getTokenStyle(token)
      const content = escapeHtml(token.content)

      return style ? `<span style="${style}">${content}</span>` : content
    })
    .join('')

const getTokenStyle = (token: ShikiToken): string => {
  const styles = [
    token.color ? `color:${token.color}` : '',
    ...(token.fontStyle ? getFontStyles(token.fontStyle) : []),
  ].filter(Boolean)

  return styles.join(';')
}

const getFontStyles = (fontStyle: number): string[] => {
  const styles: string[] = []

  if (fontStyle & 1) {
    styles.push('font-style:italic')
  }

  if (fontStyle & 2) {
    styles.push('font-weight:var(--scalar-semibold)')
  }

  if (fontStyle & 4) {
    styles.push('text-decoration:underline')
  }

  if (fontStyle & 8) {
    styles.push('text-decoration:line-through')
  }

  return styles
}

const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const escapeAttribute = (value: string): string => escapeHtml(value).replaceAll('"', '&quot;')
