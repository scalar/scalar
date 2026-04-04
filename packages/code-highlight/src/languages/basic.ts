import type { LanguageFn } from 'highlight.js'
import bash from 'highlight.js/es/languages/bash'
import css from 'highlight.js/es/languages/css'
import javascript from 'highlight.js/es/languages/javascript'
import json from 'highlight.js/es/languages/json'
import less from 'highlight.js/es/languages/less'
import markdown from 'highlight.js/es/languages/markdown'
import plaintext from 'highlight.js/es/languages/plaintext'
import python from 'highlight.js/es/languages/python'
import scss from 'highlight.js/es/languages/scss'
import shell from 'highlight.js/es/languages/shell'
import typescript from 'highlight.js/es/languages/typescript'
import xml from 'highlight.js/es/languages/xml'
import yaml from 'highlight.js/es/languages/yaml'

const basicLanguages: Record<string, LanguageFn> = {
  bash,
  css,
  html: xml,
  javascript,
  json,
  less,
  markdown,
  plaintext,
  python,
  scss,
  shell,
  typescript,
  xml,
  yaml,
}

export { basicLanguages }
