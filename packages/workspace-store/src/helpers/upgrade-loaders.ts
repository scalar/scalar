import { isObject } from '@scalar/helpers/object/is-object'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { upgrade } from '@scalar/openapi-upgrader'

/** Key under which a bare fragment is hosted while it is upgraded as part of a throwaway document. */
const FRAGMENT_KEY = 'fragment'

const isThreeZero = (version: unknown): version is string => typeof version === 'string' && version.startsWith('3.0')

/**
 * Bring a document that was loaded through a `$ref` to the same OpenAPI version as the entry document.
 *
 * - A complete OpenAPI 3.0 document is upgraded on its own.
 * - A fragment without version header (for example a file that only holds a schema) has no version of
 *   its own, so it inherits the one of the entry document. This only matters for 3.0 entries, any other
 *   version needs no schema changes.
 *
 * Swagger 2.0 documents are left alone: their `definitions` and path items move when upgraded, which
 * would break the pointers other documents use to reach into them.
 */
export const upgradeLoadedDocument = (data: unknown, entryVersion: unknown): unknown => {
  if (!isObject(data) || 'swagger' in data || 'asyncapi' in data) {
    return data
  }

  if (typeof data.openapi === 'string') {
    // Spread first: the upgrader stamps the new version onto the object it is handed.
    return isThreeZero(data.openapi) ? upgrade({ ...data }, '3.1') : data
  }

  if (!isThreeZero(entryVersion)) {
    return data
  }

  // Document body without header: upgrade it in place of the document it belongs to.
  if ('paths' in data || 'components' in data || 'webhooks' in data) {
    const { openapi: _openapi, ...body } = upgrade({ openapi: entryVersion, ...data }, '3.1')
    return body
  }

  // Anything else is a bare Schema, Path Item, Response, … Host it as a schema so the schema rules apply.
  const upgraded = upgrade({ openapi: entryVersion, components: { schemas: { [FRAGMENT_KEY]: data } } }, '3.1')
  return upgraded.components?.schemas?.[FRAGMENT_KEY] ?? data
}

/**
 * Wrap loaders so every document they return is upgraded like the entry document was.
 *
 * @param entryVersion - The `openapi` version the entry document was authored in.
 */
export const upgradeLoaders = (loaders: LoaderPlugin[], entryVersion: unknown): LoaderPlugin[] =>
  loaders.map((loader) => ({
    ...loader,
    exec: async (value) => {
      const result = await loader.exec(value)
      return result.ok ? { ...result, data: upgradeLoadedDocument(result.data, entryVersion) } : result
    },
  }))
