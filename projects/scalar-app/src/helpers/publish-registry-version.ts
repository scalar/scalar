import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

import { mapRegistryError } from './registry-error-status'
import { scalarClient } from './scalar-client'

type PublishRegistryVersion = RegistryAdapter['publishVersion']

/**
 * Publishes a new version of an existing registry document.
 *
 * The registry currently does not expose an explicit optimistic-concurrency
 * field on this endpoint, so the caller's `commitHash` is forwarded but
 * not validated locally - the registry will reject the call with a 409
 * when the upstream hash has moved on.
 *
 * Failure mapping is delegated to {@link mapRegistryError}. The only
 * endpoint-specific statuses here are 404 (`NOT_FOUND`, the document
 * group does not exist - the user has to publish first) and 409
 * (`CONFLICT`, stale-hash rejection - the user has to rebase + retry).
 * 422 deliberately stays on the `UNKNOWN` track because the SDK uses
 * 422 for body validation failures, which the user has to fix before
 * retrying rather than pulling upstream changes.
 */
export const publishRegistryVersion: PublishRegistryVersion = async ({
  namespace,
  slug,
  version,
  document,
  commitHash,
}) => {
  try {
    const result = await scalarClient.registry.createApiDocumentVersion({
      namespace,
      slug,
      requestBody: {
        version,
        document: JSON.stringify(document),
        force: true,
        lastKnownVersionSha: commitHash,
      },
    })

    return {
      ok: true,
      data: { namespace, slug, version, commitHash: result.managedDocVersion?.versionSha ?? '' },
    }
  } catch (error) {
    return mapRegistryError(error, {
      statusCodes: { 404: 'NOT_FOUND', 409: 'CONFLICT' },
    })
  }
}
