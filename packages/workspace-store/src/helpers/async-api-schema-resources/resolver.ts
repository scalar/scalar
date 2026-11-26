import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

import { type AsyncApiSchemaResources, createSchemaResourceLoader } from './resources'

/** The renderer supplies authored source and the origin captured before bundling relocates it. */
export type AsyncApiSchemaResourceResolver = (
  format: string,
  source: unknown,
  resources?: AsyncApiSchemaResources,
) => Promise<AsyncApiSchemaResources | undefined>

/** Keep downloads and complete graphs outside authored state, scoped to one document revision. */
export const createAsyncApiSchemaResourceResolver = (
  options: Parameters<typeof fetchUrls>[0] & {
    origin?: string
    fileLoader?: LoaderPlugin
    usePreparedResources?: boolean
  } = {},
): AsyncApiSchemaResourceResolver => {
  const load = createSchemaResourceLoader()
  const urlLoader = fetchUrls({ ...options, limit: 10 })
  const loaders = [urlLoader, ...(options.fileLoader ? [options.fileLoader] : [])]
  const graphs = new Map<string, Promise<AsyncApiSchemaResources | undefined>>()
  return (format, source, resources) => {
    // Prebuilt server graphs remain portable, including filesystem resources inaccessible to a browser.
    if (resources && !resources.deferred && options.usePreparedResources !== false) return Promise.resolve(resources)
    const resourceOrigin = resources?.origin ?? options.origin ?? '/'
    // Authored metadata cannot grant local file access to a remotely loaded document.
    const remoteOrigin = options.origin !== undefined && urlLoader.validate(options.origin) ? options.origin : undefined
    const origin = remoteOrigin !== undefined && !urlLoader.validate(resourceOrigin) ? remoteOrigin : resourceOrigin
    const graphLoaders = remoteOrigin !== undefined || urlLoader.validate(origin) ? [urlLoader] : loaders
    try {
      const key = JSON.stringify([format, source, origin])
      const cached = graphs.get(key)
      if (cached) return cached
      const pending = load(format, source, origin, graphLoaders)
      graphs.set(key, pending)
      return pending
    } catch {
      return Promise.resolve({ origin, files: {}, failed: true })
    }
  }
}
