import { isObject } from '@scalar/helpers/object/is-object'

import { scalarClient } from './scalar-client'

/**
 * Fetch a document from the registry
 */
export const fetchRegistryDocument = async ({
  namespace,
  slug,
  version = 'latest',
}: {
  namespace: string
  slug: string
  version?: string
}): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> => {
  try {
    const documentString = await scalarClient.registry.getApiDocumentVersion({
      namespace: namespace,
      slug: slug,
      semver: version,
    })

    // It comes in a json string from the registry so we gotta parse it
    const document = JSON.parse(documentString)
    if (!document || !isObject(document)) {
      return { ok: false, error: 'Can not parse document from registry' }
    }

    return { ok: true, data: document }
  } catch (e) {
    const message = e instanceof Error ? e.message : `Can not load document from registry: ${String(e)}`

    return {
      ok: false,
      error: message,
    }
  }
}
