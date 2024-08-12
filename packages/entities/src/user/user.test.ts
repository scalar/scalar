import { defaultUser, userSchema } from '@/user'
import { nanoid } from 'nanoid'
import { describe, expect, test } from 'vitest'

describe('User', () => {
  test('Sanitized user', () => {
    const userData = {
      uid: nanoid(),
      userIndex: 'dave@example.com',
      email: 'dave@example.com',
      teams: [],
      hasGithub: false,
      activeTeamId: null,
    }
    const user = userSchema.parse(userData)

    expect(user).toEqual(userData)
  })

  test('Defaults user', () => {
    const user = defaultUser()

    expect(userSchema.parse(user)).toEqual(user)
  })

  test('Forces email and userIndex to lowercase', () => {
    const user = userSchema.parse({
      uid: nanoid(),
      userIndex: 'DavE@examPle.com',
      email: 'Dave@Example.COM',
      teams: [],
      activeTeamId: null,
    })

    expect(user.email).toEqual('dave@example.com')
    expect(user.userIndex).toEqual('dave@example.com')
  })
})
