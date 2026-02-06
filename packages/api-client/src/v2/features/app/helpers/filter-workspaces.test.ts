import { describe, expect, it } from 'vitest'

import { canLoadWorkspace, filterWorkspacesByTeam } from './filter-workspaces'

describe('filterWorkspacesByTeam', () => {
  it('filters workspaces to show only local and current team workspaces', () => {
    const workspaces = [
      { id: 'local/workspace-1', teamUid: 'local', label: 'Local Workspace 1' },
      { id: 'team-a/workspace-2', teamUid: 'team-a', label: 'Team A Workspace' },
      { id: 'team-b/workspace-3', teamUid: 'team-b', label: 'Team B Workspace' },
      { id: 'local/workspace-4', teamUid: 'local', label: 'Local Workspace 2' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'team-a')

    expect(filtered).toHaveLength(3)
    expect(filtered.map((w) => w.id)).toEqual(['local/workspace-1', 'team-a/workspace-2', 'local/workspace-4'])
  })

  it('shows only local workspaces when teamUid is local', () => {
    const workspaces = [
      { id: 'local/workspace-1', teamUid: 'local', label: 'Local Workspace 1' },
      { id: 'team-a/workspace-2', teamUid: 'team-a', label: 'Team A Workspace' },
      { id: 'team-b/workspace-3', teamUid: 'team-b', label: 'Team B Workspace' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'local')

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('local/workspace-1')
  })

  it('handles empty workspace list gracefully', () => {
    const filtered = filterWorkspacesByTeam([], 'team-a')
    expect(filtered).toHaveLength(0)
  })

  it('includes all local workspaces regardless of active team', () => {
    const workspaces = [
      { id: 'local/workspace-1', teamUid: 'local', label: 'Local Workspace 1' },
      { id: 'local/workspace-2', teamUid: 'local', label: 'Local Workspace 2' },
      { id: 'local/workspace-3', teamUid: 'local', label: 'Local Workspace 3' },
      { id: 'team-a/workspace-4', teamUid: 'team-a', label: 'Team A Workspace' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'team-a')

    expect(filtered).toHaveLength(4)

    const localWorkspaces = filtered.filter((w) => w.teamUid === 'local')
    expect(localWorkspaces).toHaveLength(3)
  })

  it('blocks access to workspaces from multiple other teams', () => {
    const workspaces = [
      { id: 'local/default', teamUid: 'local', label: 'Local Workspace' },
      { id: 'team-a/workspace-1', teamUid: 'team-a', label: 'Team A Workspace' },
      { id: 'team-b/workspace-2', teamUid: 'team-b', label: 'Team B Workspace' },
      { id: 'team-c/workspace-3', teamUid: 'team-c', label: 'Team C Workspace' },
      { id: 'team-a/workspace-4', teamUid: 'team-a', label: 'Team A Another Workspace' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'team-a')

    expect(filtered).toHaveLength(3)

    const teamBWorkspace = filtered.find((w) => w.teamUid === 'team-b')
    const teamCWorkspace = filtered.find((w) => w.teamUid === 'team-c')
    expect(teamBWorkspace).toBeUndefined()
    expect(teamCWorkspace).toBeUndefined()

    const teamAWorkspaces = filtered.filter((w) => w.teamUid === 'team-a')
    expect(teamAWorkspaces).toHaveLength(2)
  })

  it('preserves original array order', () => {
    const workspaces = [
      { id: '3', teamUid: 'team-a', label: 'Workspace 3' },
      { id: '1', teamUid: 'local', label: 'Workspace 1' },
      { id: '4', teamUid: 'team-b', label: 'Workspace 4' },
      { id: '2', teamUid: 'team-a', label: 'Workspace 2' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'team-a')

    expect(filtered.map((w) => w.id)).toEqual(['3', '1', '2'])
  })

  it('handles workspaces with duplicate team IDs', () => {
    const workspaces = [
      { id: '1', teamUid: 'team-a', label: 'Workspace 1' },
      { id: '2', teamUid: 'team-a', label: 'Workspace 2' },
      { id: '3', teamUid: 'team-a', label: 'Workspace 3' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'team-a')

    expect(filtered).toHaveLength(3)
    expect(filtered).toEqual(workspaces)
  })

  it('does not mutate the original array', () => {
    const workspaces = [
      { id: '1', teamUid: 'local', label: 'Local' },
      { id: '2', teamUid: 'team-a', label: 'Team A' },
      { id: '3', teamUid: 'team-b', label: 'Team B' },
    ]

    const originalLength = workspaces.length
    filterWorkspacesByTeam(workspaces, 'team-a')

    expect(workspaces).toHaveLength(originalLength)
    expect(workspaces[0]?.id).toBe('1')
  })

  it('handles special characters in teamUid', () => {
    const workspaces = [
      { id: '1', teamUid: 'local', label: 'Local' },
      { id: '2', teamUid: 'team-a-123', label: 'Team A' },
      { id: '3', teamUid: 'team_b_456', label: 'Team B' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'team-a-123')

    expect(filtered).toHaveLength(2)
    expect(filtered.map((w) => w.teamUid)).toEqual(['local', 'team-a-123'])
  })

  it('filters based on exact match not partial match', () => {
    const workspaces = [
      { id: '1', teamUid: 'team-a', label: 'Team A' },
      { id: '2', teamUid: 'team-abc', label: 'Team ABC' },
      { id: '3', teamUid: 'a-team', label: 'A Team' },
    ]

    const filtered = filterWorkspacesByTeam(workspaces, 'team-a')

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('1')
  })
})

describe('canLoadWorkspace', () => {
  it('allows loading workspace that matches current team', () => {
    expect(canLoadWorkspace('team-a', 'team-a')).toBe(true)
  })

  it('allows loading local workspace regardless of current team', () => {
    expect(canLoadWorkspace('local', 'team-a')).toBe(true)
    expect(canLoadWorkspace('local', 'team-b')).toBe(true)
    expect(canLoadWorkspace('local', 'local')).toBe(true)
  })

  it('prevents loading workspace from different team', () => {
    expect(canLoadWorkspace('team-b', 'team-a')).toBe(false)
    expect(canLoadWorkspace('team-a', 'team-b')).toBe(false)
    expect(canLoadWorkspace('team-c', 'team-a')).toBe(false)
  })

  it('handles case-sensitive team IDs', () => {
    expect(canLoadWorkspace('Team-A', 'team-a')).toBe(false)
    expect(canLoadWorkspace('team-a', 'Team-A')).toBe(false)
  })

  it('handles empty string team IDs', () => {
    expect(canLoadWorkspace('', '')).toBe(true)
    expect(canLoadWorkspace('team-a', '')).toBe(false)
    expect(canLoadWorkspace('', 'team-a')).toBe(false)
  })

  it('handles special characters in team IDs', () => {
    expect(canLoadWorkspace('team-a-123', 'team-a-123')).toBe(true)
    expect(canLoadWorkspace('team_b_456', 'team_b_456')).toBe(true)
    expect(canLoadWorkspace('team-a-123', 'team-a-456')).toBe(false)
  })

  it('handles very long team IDs', () => {
    const longTeamId = 'team-' + 'a'.repeat(1000)
    expect(canLoadWorkspace(longTeamId, longTeamId)).toBe(true)
    expect(canLoadWorkspace(longTeamId, 'team-b')).toBe(false)
  })

  it('validates based on exact match not partial match', () => {
    expect(canLoadWorkspace('team-abc', 'team-a')).toBe(false)
    expect(canLoadWorkspace('team-a', 'team-abc')).toBe(false)
  })

  it('treats local as a special value not a pattern', () => {
    expect(canLoadWorkspace('local-team', 'team-a')).toBe(false)
    expect(canLoadWorkspace('mylocal', 'team-a')).toBe(false)
    expect(canLoadWorkspace('local', 'team-a')).toBe(true)
  })
})
