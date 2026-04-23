import type { Document as OpenApiDocumentV3_1 } from '@scalar/openapi-types/3.1'
import { upgrade as originalUpgrade } from '@scalar/openapi-upgrader'
import type { UnknownObject } from '@scalar/types/utils'

import type { AnyObject, Filesystem, UpgradeResult } from '@/types/index'

import { getEntrypoint } from './get-entrypoint'
import { isFilesystem } from './is-filesystem'
import { normalize } from './normalize'

/**
 * Upgrade specification to OpenAPI 3.1.0
 */
export function upgrade(value: string | AnyObject | Filesystem): UpgradeResult<OpenApiDocumentV3_1> {
  if (!value) {
    return {
      specification: null,
      version: '3.1',
    }
  }

  // TODO: Run upgrade over the whole filesystem
  const document = originalUpgrade(
    isFilesystem(value) ? getEntrypoint(value).specification : (normalize(value) as UnknownObject),
    '3.1',
  )

  return {
    specification: document,
    // TODO: Make dynamic
    version: '3.1',
  } as UpgradeResult<OpenApiDocumentV3_1>
}
