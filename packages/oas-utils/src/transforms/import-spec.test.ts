import { importSpecToWorkspace } from '@/transforms/import-spec'
import circular from '@test/fixtures/basic-circular-spec.json'
import petstoreMod from '@test/fixtures/petstore-tls.json'
import { describe, expect, test } from 'vitest'

import galaxy from '../../../galaxy/dist/latest.json'

describe('Import OAS Specs', () => {
  test('Handles circular', async () => {
    const res = await importSpecToWorkspace(circular)

    // console.log(JSON.stringify(res, null, 2))
    if (res.error) return

    expect(res.requests[0].path).toEqual('/api/v1/updateEmployee')
    expect(res.tags[0].children.includes(res.tags[1].uid)).toEqual(true)
    expect(
      res.tags[0].children.includes(Object.values(res.requests)[0].uid),
    ).toEqual(true)
  })

  test('Handles weird petstore', async () => {
    const res = await importSpecToWorkspace(petstoreMod)

    expect(res.error).toBe(false)
  })

  // Causes cyclic dependency
  test('Loads galaxy spec', async () => {
    const res = await importSpecToWorkspace(galaxy)

    expect(res.error).toEqual(false)
  })
})
