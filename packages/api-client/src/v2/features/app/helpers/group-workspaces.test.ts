import { describe, expect, it } from 'vitest'

import type { WorkspaceItem } from './group-workspaces'
import { groupWorkspacesByTeam } from './group-workspaces'

describe('groupWorkspacesByTeam', () => {
  it('groups local workspaces only when currentTeamUid is local', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '1', label: 'Local Workspace 1', teamUid: 'local' },
      { id: '2', label: 'Local Workspace 2', teamUid: 'local' },
    ]

    const result = groupWorkspacesByTeam(workspaces, 'local')

    expect(result).toEqual([
      {
        label: 'Local Workspaces',
        options: [
          { id: '1', label: 'Local Workspace 1' },
          { id: '2', label: 'Local Workspace 2' },
        ],
      },
    ])
  })

  it('groups team and local workspaces when currentTeamUid is not local', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '1', label: 'Team Workspace 1', teamUid: 'team-123' },
      { id: '2', label: 'Team Workspace 2', teamUid: 'team-123' },
      { id: '3', label: 'Local Workspace 1', teamUid: 'local' },
    ]

    const result = groupWorkspacesByTeam(workspaces, 'team-123')

    expect(result).toEqual([
      {
        label: 'Team Workspaces',
        options: [
          { id: '1', label: 'Team Workspace 1' },
          { id: '2', label: 'Team Workspace 2' },
        ],
      },
      {
        label: 'Local Workspaces',
        options: [{ id: '3', label: 'Local Workspace 1' }],
      },
    ])
  })

  it('handles empty workspace array', () => {
    const result = groupWorkspacesByTeam([], 'local')

    expect(result).toEqual([
      {
        label: 'Local Workspaces',
        options: [],
      },
    ])
  })

  it('handles empty local workspaces', () => {
    const workspaces: WorkspaceItem[] = [{ id: '1', label: 'Team Workspace 1', teamUid: 'team-123' }]

    const result = groupWorkspacesByTeam(workspaces, 'team-123')

    expect(result).toEqual([
      {
        label: 'Team Workspaces',
        options: [{ id: '1', label: 'Team Workspace 1' }],
      },
      {
        label: 'Local Workspaces',
        options: [],
      },
    ])
  })

  it('excludes team workspaces section when current team has no workspaces', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '1', label: 'Local Workspace 1', teamUid: 'local' },
      { id: '2', label: 'Other Team Workspace', teamUid: 'team-456' },
    ]

    const result = groupWorkspacesByTeam(workspaces, 'team-123')

    expect(result).toEqual([
      {
        label: 'Local Workspaces',
        options: [{ id: '1', label: 'Local Workspace 1' }],
      },
    ])
  })

  it('handles multiple teams but only shows current team', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '1', label: 'Team A Workspace 1', teamUid: 'team-a' },
      { id: '2', label: 'Team A Workspace 2', teamUid: 'team-a' },
      { id: '3', label: 'Team B Workspace 1', teamUid: 'team-b' },
      { id: '4', label: 'Local Workspace 1', teamUid: 'local' },
    ]

    const result = groupWorkspacesByTeam(workspaces, 'team-a')

    expect(result).toEqual([
      {
        label: 'Team Workspaces',
        options: [
          { id: '1', label: 'Team A Workspace 1' },
          { id: '2', label: 'Team A Workspace 2' },
        ],
      },
      {
        label: 'Local Workspaces',
        options: [{ id: '4', label: 'Local Workspace 1' }],
      },
    ])
  })

  it('preserves workspace order within groups', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '3', label: 'Workspace C', teamUid: 'team-123' },
      { id: '1', label: 'Workspace A', teamUid: 'team-123' },
      { id: '2', label: 'Workspace B', teamUid: 'team-123' },
    ]

    const result = groupWorkspacesByTeam(workspaces, 'team-123')

    expect(result[0]?.options).toEqual([
      { id: '3', label: 'Workspace C' },
      { id: '1', label: 'Workspace A' },
      { id: '2', label: 'Workspace B' },
    ])
  })

  it('handles workspaces with special characters in labels', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '1', label: 'My "Special" Workspace', teamUid: 'local' },
      { id: '2', label: "John's Workspace", teamUid: 'local' },
      { id: '3', label: 'Workspace <>&', teamUid: 'local' },
    ]

    const result = groupWorkspacesByTeam(workspaces, 'local')

    expect(result[0]?.options).toEqual([
      { id: '1', label: 'My "Special" Workspace' },
      { id: '2', label: "John's Workspace" },
      { id: '3', label: 'Workspace <>&' },
    ])
  })

  it('handles workspaces with duplicate labels but different ids', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '1', label: 'Workspace', teamUid: 'local' },
      { id: '2', label: 'Workspace', teamUid: 'local' },
    ]

    const result = groupWorkspacesByTeam(workspaces, 'local')

    expect(result[0]?.options).toHaveLength(2)
    expect(result[0]?.options[0]?.id).toBe('1')
    expect(result[0]?.options[1]?.id).toBe('2')
  })

  it('handles empty string teamUid', () => {
    const workspaces: WorkspaceItem[] = [
      { id: '1', label: 'Workspace 1', teamUid: '' },
      { id: '2', label: 'Local Workspace', teamUid: 'local' },
    ]

    const result = groupWorkspacesByTeam(workspaces, '')

    expect(result).toEqual([
      {
        label: 'Team Workspaces',
        options: [{ id: '1', label: 'Workspace 1' }],
      },
      {
        label: 'Local Workspaces',
        options: [{ id: '2', label: 'Local Workspace' }],
      },
    ])
  })
})
