import { resolve } from 'node:path'

import { isObject } from '@scalar/helpers/object/is-object'

import type { LoaderPlugin } from '@/bundle'
import { normalize } from '@/helpers/normalize'

import { fetchUrls } from './fetch-urls'
import { readFiles } from './read-files'

/** Permissions shared by entry documents and their external references. */
export type DocumentLoadOptions = {
  /** Allow private-network requests only for trusted input. Defaults to false. */
  allowPrivateNetworks?: boolean
  /** Approved directory for local files and references. File access is disabled when omitted. */
  basePath?: string
}

/** A source loader and reference plugins governed by the same permissions. */
type DocumentLoader = {
  plugins: LoaderPlugin[]
  load: (input: string, documentName: string) => Promise<{ value: unknown; origin?: string }>
}

/** Keep entry-document and nested-reference loading permissions in one place. */
export const createDocumentLoader = (options: DocumentLoadOptions = {}): DocumentLoader => {
  const urlLoader = fetchUrls({ blockPrivateNetworks: !options.allowPrivateNetworks })
  const fileLoader = options.basePath === undefined ? undefined : readFiles({ basePath: options.basePath })
  return {
    plugins: [urlLoader, ...(fileLoader ? [fileLoader] : [])],
    load: async (input, documentName) => {
      const parsed = normalize(input)
      if (isObject(parsed)) {
        return { value: parsed }
      }
      const remote = /^https?:\/\//i.test(input)
      const loader = remote ? urlLoader : fileLoader
      if (!loader) {
        throw new Error('Local file access requires an explicit basePath')
      }
      const origin = remote ? input : resolve(input)
      const result = await loader.exec(origin)
      if (result.ok === false) {
        const status = result.status === undefined ? '' : `: HTTP ${result.status}`
        throw new Error(`Failed to load ${documentName} document${status}`)
      }
      return { value: result.data, origin }
    },
  }
}
