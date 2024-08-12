import { TeamUserRole } from '@/team'
import { accessTokenPayloadSchema } from '@/token'
import { unixTimestamp } from '@/utility'
import { nanoid } from 'nanoid'
import { describe, expect, test } from 'vitest'

describe('Access Token', () => {
  test('Parses access token', () => {
    const payload = {
      userIndex: 'test@example.com',
      userUid: nanoid(),
      teamUid: nanoid(),
      email: 'test@example.com',
      role: TeamUserRole.User,
      exp: unixTimestamp(),
    }

    const res = accessTokenPayloadSchema.parse(payload)

    expect(res).toEqual(payload)
  })
})
