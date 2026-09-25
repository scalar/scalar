import type { OpenAPIV3, OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { migrateThreeOneToThreeTwo } from '@/3.1-to-3.2/upgrade-from-three-one-to-three-two'

import { upgradeFromTwoToThree } from './2.0-to-3.0'
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1'
import { cloneDocument } from './helpers/clone-document'
import { UpgradeIncompatibilityError } from './upgrade-incompatibility-error'

/** Control how compatibility issues in the OpenAPI 3.2 migration are reported. */
export type UpgradeOptions = {
  /** Defaults to throwing. Collect retains 3.1; ignore applies best-effort migrations despite incompatibilities. */
  onIncompatible: 'throw' | 'collect' | 'ignore'
}

/** A complete document and the compatibility issues that prevented upgrading it to OpenAPI 3.2. */
export type UpgradeResult = {
  /** OpenAPI 3.2 on success, or the complete OpenAPI 3.1 fallback when diagnostics are present. */
  document: OpenAPIV3_1.Document | OpenAPIV3_2.Document
  /** All detected compatibility errors, including their JSON pointers; empty on success. */
  diagnostics: Error[]
}

/**
 * Upgrade a Swagger 2.0 or OpenAPI description to the specified target version.
 * Targeting 3.2 is strict by default. Collect mode returns compatibility diagnostics
 * with a complete 3.1 fallback instead of throwing for migration incompatibilities.
 * Ignore mode returns a best-effort 3.2 document that may change meaning or be invalid.
 */
export function upgrade(value: UnknownObject, targetVersion: '3.0'): OpenAPIV3.Document
export function upgrade(value: UnknownObject, targetVersion: '3.1'): OpenAPIV3_1.Document
export function upgrade(
  value: UnknownObject,
  targetVersion: '3.2',
  options?: { onIncompatible: 'throw' | 'ignore' },
): OpenAPIV3_2.Document
export function upgrade(
  value: UnknownObject,
  targetVersion: '3.2',
  options: { onIncompatible: 'collect' },
): UpgradeResult
export function upgrade(
  value: UnknownObject,
  targetVersion: '3.2',
  options: UpgradeOptions,
): OpenAPIV3_2.Document | UpgradeResult
export function upgrade(
  value: UnknownObject,
  targetVersion: '3.0' | '3.1' | '3.2',
  options?: UpgradeOptions,
): OpenAPIV3.Document | OpenAPIV3_1.Document | OpenAPIV3_2.Document | UpgradeResult {
  if (targetVersion === '3.2') {
    // Every step in the 3.2 pipeline owns the same clone, including earlier converters.
    const input = cloneDocument(value)
    const openapi30 = upgradeFromTwoToThree(input)
    const openapi31 = upgradeFromThreeToThreeOne(openapi30)
    try {
      const document = migrateThreeOneToThreeTwo(openapi31, options?.onIncompatible === 'ignore' ? 'ignore' : 'throw')
      return options?.onIncompatible === 'collect' ? { document, diagnostics: [] } : document
    } catch (error) {
      if (options?.onIncompatible !== 'collect' || !(error instanceof UpgradeIncompatibilityError)) {
        throw error
      }
      // The failed migration may have changed its private copy. Rebuild from the
      // original input so the fallback contains no partial 3.2 transformations.
      return {
        document: upgrade(cloneDocument(value), '3.1'),
        diagnostics: error.errors,
      }
    }
  }

  // Preserve the earlier targets without entering the 3.2 migration.
  const openapi30 = upgradeFromTwoToThree(value)
  return targetVersion === '3.0' ? openapi30 : upgradeFromThreeToThreeOne(openapi30)
}
