import fs from 'node:fs'

import { ERRORS } from '@/configuration'
import { dirname, join } from '@/polyfills/path'
import { isJson } from '@/utils/is-json'
import { isYaml } from '@/utils/is-yaml'
import type { LoadPlugin } from '@/utils/load/load'

export const readFiles: () => LoadPlugin = () => {
  return {
    check(value?: any) {
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
    async get(value?: any) {
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
    resolvePath(value: any, reference: string) {
      const dir = dirname(value)
      return join(dir, reference)
    },
    getDir(value: any) {
      return dirname(value)
    },
    getFilename(value: any) {
      return value.split('/').pop()
    },
  }
}
