import type { LanguageFn } from 'highlight.js'
import json from 'highlight.js/es/languages/json'
import plaintext from 'highlight.js/es/languages/plaintext'
import yaml from 'highlight.js/es/languages/yaml'

const jsonYamlLanguages: Record<string, LanguageFn> = {
  json,
  plaintext,
  yaml,
}

export { jsonYamlLanguages }
