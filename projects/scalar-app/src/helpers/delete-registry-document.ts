import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

import { mapRegistryError } from './registry-error-status'
import { scalarClient } from './scalar-client'

type DeleteRegistryDocument = RegistryAdapter['deleteDocument']

/**
 * Removes an entire document group (every version) from the registry.
 *
 * Pairs with `deleteRegistryVersion` for the danger-zone "Delete
 * document from registry" flow. The deletion is group-wide so there is
 * no `commitHash` parameter to forward - removing the whole document
 * supersedes any per-version concurrency.
 *
 * Failure mapping is delegated to {@link mapRegistryError} so the
 * per-version and group-wide flows stay in lockstep with every other
 * registry adapter.
 */
export const deleteRegistryDocument: DeleteRegistryDocument = async ({ namespace, slug }) => {
  try {
    await scalarClient.registry.deleteApiDocument({ namespace, slug })

    return {
      ok: true,
      data: { namespace, slug },
    }
  } catch (error) {
    return mapRegistryError(error, { statusCodes: { 404: 'NOT_FOUND' } })
  }
}
