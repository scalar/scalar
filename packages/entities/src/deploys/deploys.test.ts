import { type SiteDeploy, siteDeploySchema } from '@/deploys'
import { unixTimestamp } from '@/utility'
import { nanoid } from 'nanoid'
import { describe, expect, test } from 'vitest'

describe('Validates deploy records', () => {
  test('', () => {
    const record: SiteDeploy = {
      uid: nanoid(),
      domain: 'my.big.domain',
      teamUid: nanoid(),
      projectUid: nanoid(),
      createdAt: unixTimestamp(),
      updatedAt: unixTimestamp(),
    }
    expect(siteDeploySchema.parse(record)).toEqual(record)
  })
})
