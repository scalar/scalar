import type { LanguageFn } from 'highlight.js'
import json from 'highlight.js/lib/languages/json'
import plaintext from 'highlight.js/lib/languages/plaintext'
import yaml from 'highlight.js/lib/languages/yaml'

const jsonYamlLanguages: Record<string, LanguageFn> = {
  json,
  plaintext,
  yaml,
}

export { jsonYamlLanguages }
