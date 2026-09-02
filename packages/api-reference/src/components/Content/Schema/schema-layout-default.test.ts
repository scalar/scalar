import { apiReferenceConfigurationSchema } from '@scalar/schemas/api-reference'
import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import schemaPropertySource from './SchemaProperty.vue?raw'

/**
 * The legacy layout's deletion tripwire.
 *
 * Every deferred-cleanup phase in a package with this reach is a phase that
 * might not happen — so the deletion is not a wish, it is a scheduled release,
 * and this test is the schedule's enforcement. The default cannot be `tree`
 * while the legacy render branch still exists unless someone consciously
 * updates the target below; and once the legacy branch is deleted, this file
 * goes with it.
 */

/**
 * The release the legacy branch deletion is milestoned to. Named in the Phase 2
 * changeset policy: `depth` and legacy `level` coexist for exactly one minor
 * after the default flips. Update this only as a conscious rescheduling — that
 * is the entire point of the constant.
 */
const LEGACY_DELETION_TARGET_RELEASE = '1.69.0'

describe('schema-layout-default', () => {
  it('defaults to the tree layout', () => {
    const configuration = coerce(apiReferenceConfigurationSchema, {})

    expect(configuration.schemaLayout).toBe('tree')
  })

  it('keeps the legacy deletion scheduled while the legacy branch exists', () => {
    const legacyBranchExists = schemaPropertySource.includes('!isTreeLayout')

    if (!legacyBranchExists) {
      // The branch is gone: delete this test file, the legacy classes stay
      // forever as aliases (the Docusaurus integration and unseen customCss
      // consumers style them, and the changeset policy has no major).
      return
    }

    expect(
      LEGACY_DELETION_TARGET_RELEASE,
      'The default is tree while the legacy branch still exists. That is allowed only while its deletion is scheduled: keep LEGACY_DELETION_TARGET_RELEASE naming a real upcoming release, or delete the legacy branch.',
    ).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
