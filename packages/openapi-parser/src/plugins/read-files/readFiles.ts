import fs from 'node:fs'

import { ERRORS } from '../../configuration/index.ts'
import { dirname, join } from '../../polyfills/path.ts'
import { isJson } from '../../utils/isJson.ts'
import { isYaml } from '../../utils/isYaml.ts'
import type { LoadPlugin } from '../../utils/load/load.ts'

export const readFiles: () => LoadPlugin = () => {
  return {
    // Make it run before fetchUrls
    priority: 100,
    check(value?: unknown) {
      // Not a string
      if (typeof value !== 'string') {
        return false
      }

      // URL
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return false
      }

      // Line breaks
      if (value.includes('\n')) {
        return false
      }

      // JSON
      if (isJson(value)) {
        return false
      }

      // YAML (run through YAML.parse)
      if (isYaml(value)) {
        return false
      }

      return true
    },
    async get(value?: unknown) {
      if (typeof value !== 'string') {
        return false
      }

      if (!fs.existsSync(value)) {
        throw new Error(ERRORS.FILE_DOES_NOT_EXIST.replace('%s', value))
      }

      try {
        return fs.readFileSync(value, 'utf-8')
      } catch (error) {
        console.error('[readFiles]', error)
        return false
      }
    },
    getUri(value: unknown, source: string) {
      if (typeof value !== 'string') {
        return undefined
      }

      if (typeof source !== 'string') {
        return value
      }

      // Already absolute
      if (value.startsWith('/')) {
        return value
      }

      const dir = dirname(source)

      return join(dir, value)
    },
    getDir(value: any) {
      return dirname(value)
    },
    getFilename(value: any) {
      return value.split('/').pop()
    },
  }
}
