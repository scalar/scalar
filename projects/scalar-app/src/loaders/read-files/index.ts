import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { isFilePath } from '@scalar/json-magic/helpers/is-file-path'
import { normalize } from '@scalar/openapi-parser'

/**
 * Loader plugin for reading files from disk.
 *
 * This loader uses the Electron window API to read a file from a given path, normalizes
 * its content using the OpenAPI parser, and returns a result suitable for downstream usage.
 * If the file could not be read, it returns `{ ok: false }`.
 */
export const readFiles = (): LoaderPlugin => {
  return {
    type: 'loader',
    validate: isFilePath, // Validates the input is a file path
    exec: async (path) => {
      // Read file content using Electron's exposed API
      const content = await window.api.readFile(path)

      if (content === undefined) {
        return {
          ok: false, // File could not be read or doesn't exist
        }
      }

      return {
        ok: true,
        data: normalize(content), // Normalize the file contents (e.g., parse OpenAPI/YAML/JSON)
        raw: content,
      }
    },
  }
}
