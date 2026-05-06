import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

import { mapRegistryError } from './registry-error-status'
import { scalarClient } from './scalar-client'

type DeleteRegistryVersion = RegistryAdapter['deleteVersion']

/**
 * Removes a single version of an existing registry document.
 *
 * The registry does not perform optimistic concurrency on the delete
 * endpoint, so the caller does not forward a commit hash - the
 * deletion is unconditional once authorization succeeds.
 *
 * Failure mapping is delegated to {@link mapRegistryError} so the
 * per-version and group-wide flows stay in lockstep with every other
 * registry adapter.
 */
export const deleteRegistryVersion: DeleteRegistryVersion = async ({ namespace, slug, version }) => {
  try {
    await scalarClient.registry.deleteApiDocumentVersion({
      namespace,
      slug,
      semver: version,
    })

    return {
      ok: true,
      data: { namespace, slug, version },
    }
  } catch (error) {
    return mapRegistryError(error, { statusCodes: { 404: 'NOT_FOUND' } })
  }
}
