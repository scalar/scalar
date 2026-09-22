import type { Document as OpenApiDocumentV3_1 } from '@scalar/openapi-types/3.1'
import { upgrade as originalUpgrade } from '@scalar/openapi-upgrader'
import type { UnknownObject } from '@scalar/types/utils'

import type { Filesystem, UpgradeResult } from '@/types/index'

import { details } from './details'
import { getEntrypoint } from './get-entrypoint'
import { isFilesystem } from './is-filesystem'
import { normalize } from './normalize'

/**
 * Upgrade older documents to OpenAPI 3.1 and preserve documents that are already newer.
 */
export function upgrade(value: string | UnknownObject | Filesystem): UpgradeResult<OpenApiDocumentV3_1> {
  if (!value) {
    return {
      specification: null,
      version: undefined,
    }
  }

  // TODO: Run upgrade over the whole filesystem
  const document = originalUpgrade(
    isFilesystem(value) ? getEntrypoint(value).specification : (normalize(value) as UnknownObject),
    '3.1',
  )

  const { version } = details(document)

  return {
    specification: document,
    version: version === '3.1' || version === '3.2' ? version : undefined,
  } as UpgradeResult<OpenApiDocumentV3_1>
}
