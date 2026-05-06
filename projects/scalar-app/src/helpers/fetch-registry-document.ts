import { isObject } from '@scalar/helpers/object/is-object'

import type { RegistryAdapter } from '@/types/configuration'

import { mapRegistryError } from './registry-error-status'
import { scalarClient } from './scalar-client'

type ImportDocumentFromRegistry = RegistryAdapter['fetchDocument']

/**
 * Fetches a document from the Scalar registry by meta.
 *
 * The registry returns the document body as a JSON string, so we parse
 * it back into an object before handing it to the workspace store.
 * Failure mapping is delegated to {@link mapRegistryError} so this
 * adapter shares the universal authorization / network / unknown
 * cascade with every other registry adapter; the only fetch-specific
 * status here is 404 (`NOT_FOUND`).
 */
export const fetchRegistryDocument: ImportDocumentFromRegistry = async ({ namespace, slug, version = 'latest' }) => {
  try {
    const response = await scalarClient.registry.getApiDocumentVersion({
      namespace,
      slug,
      semver: version,
    })

    const documentString = response.res
    if (typeof documentString !== 'string') {
      return { ok: false, error: 'UNKNOWN', message: 'Registry returned an empty document body' }
    }

    const document = JSON.parse(documentString)
    if (!document || !isObject(document)) {
      return { ok: false, error: 'UNKNOWN', message: 'Cannot parse document from registry' }
    }

    // The registry advertises the version hash as a response header
    // rather than baking it into the document body, so the sync flow
    // can treat it as an optimistic-concurrency token without parsing
    // the OpenAPI document itself.
    const versionSha = response.httpMeta.response.headers.get('x-scalar-version-sha') ?? undefined

    return { ok: true, data: { document, versionSha } }
  } catch (error) {
    return mapRegistryError(error, {
      statusCodes: { 404: 'NOT_FOUND' },
      fallbackMessage: `Cannot load document from registry: ${String(error)}`,
    })
  }
}
