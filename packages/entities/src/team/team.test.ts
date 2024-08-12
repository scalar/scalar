import { billingInfoSchema, defaultTeam, teamSchema } from '@/team'
import type { User } from '@/user'
import { nanoid } from 'nanoid'
import { describe, expect, test } from 'vitest'

function getMockUser(): User {
  return {
    uid: nanoid(),
    email: 'dave@example.com',
    teams: [],
    userIndex: 'dave@example.com',
    activeTeamId: '',
  }
}

describe('Correctly defaults types', () => {
  test('Defaults team', () => {
    const user = getMockUser()

    const team = defaultTeam(user.userIndex, user.uid, nanoid(), 'Dave Dave')

    expect(team).toHaveProperty('projects')
    expect(team).toHaveProperty('billingInfo')
    expect(team).toHaveProperty('email')
  })

  test('Defaults team with no team name', () => {
    const user = getMockUser()

    const team = defaultTeam(user.userIndex, user.uid, nanoid())

    expect(team).toHaveProperty('projects')
    expect(team).toHaveProperty('billingInfo')
    expect(team).toHaveProperty('email')

    expect(team.name).toBe('Default Team')
  })
  test('Defaults team with trial billing plan', () => {
    const user = getMockUser()

    const team = defaultTeam(user.userIndex, user.uid, nanoid(), 'Dave Dave')

    expect(team).toHaveProperty('billingInfo')
    expect(team.billingInfo.plan).toBe('trial')
  })

  test('Replaces empty team names', () => {
    const user = getMockUser()

    const team = defaultTeam(user.userIndex, user.uid, nanoid())
    team.name = ''

    expect(teamSchema.parse(team).name).toEqual('Untitled Team')
  })

  test('Replaces white space team names', () => {
    const user = getMockUser()

    const team = defaultTeam(user.userIndex, user.uid, nanoid())
    team.name = '   '

    expect(teamSchema.parse(team).name).toEqual('Untitled Team')
  })

  test('Trims team names', () => {
    const user = getMockUser()
    const team = defaultTeam(user.userIndex, user.uid, nanoid())
    team.name = '  Trim me  '

    expect(teamSchema.parse(team).name).toEqual('Trim me')
  })

  test('Fails null team names', () => {
    const user = getMockUser()
    const team = defaultTeam(user.userIndex, user.uid, nanoid())
    team.name = null as any as string

    expect(() => teamSchema.parse(team)).toThrowError()
  })

  test('Fails bad team names', () => {
    const user = getMockUser()
    const team = defaultTeam(user.userIndex, user.uid, nanoid())
    team.name = 123 as any as string

    expect(() => teamSchema.parse(team)).toThrowError()
  })

  test('Fails missing team names', () => {
    const user = getMockUser()
    const team = defaultTeam(user.userIndex, user.uid, nanoid())
    const { name, ...unteam } = team

    expect(() => teamSchema.parse(unteam)).toThrowError()
  })

  test('Fails if billing is invalid', () => {
    const data = {
      billingId: nanoid(),
      plan: 'badPlan',
    }

    expect(() => billingInfoSchema.parse(data)).toThrowError()
  })

  test('Passes if billing is pro_monthly', () => {
    const data = {
      billingId: nanoid(),
      plan: 'pro_monthly',
    }

    expect(() => billingInfoSchema.parse(data)).not.toThrowError()
  })

  test('Passes if billing is premium', () => {
    const data = {
      billingId: nanoid(),
      plan: 'premium',
    }

    expect(() => billingInfoSchema.parse(data)).not.toThrowError()
  })

  test('Passes if billing is valid', () => {
    const data = {
      billingId: nanoid(),
      plan: 'trial',
    }
    expect(billingInfoSchema.parse(data).plan).toEqual('trial')
  })

  test('Migrates old hasTrial logic', () => {
    const data = {
      billingId: nanoid(),
      plan: '',
      hasTrial: true,
    }

    expect(billingInfoSchema.parse(data).plan).toEqual('trial')
  })
})
