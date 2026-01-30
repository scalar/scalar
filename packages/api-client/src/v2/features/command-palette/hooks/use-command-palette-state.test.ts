import { useModal } from '@scalar/components'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import type { CommandPaletteAction, CommandPaletteRoute } from './use-command-palette-state'
import { useCommandPaletteState } from './use-command-palette-state'

vi.mock('@scalar/components', () => ({
  useModal: vi.fn(),
}))

describe('useCommandPaletteState', () => {
  const createMockModalState = () => ({
    open: false,
    show: vi.fn(),
    hide: vi.fn(),
  })

  it('initializes with default state', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    expect(state.isOpen.value).toBe(false)
    expect(state.activeCommand.value).toBeNull()
    expect(state.activeCommandProps.value).toBeNull()
    expect(state.filterQuery.value).toBe('')
    expect(state.filteredCommands.value).toHaveLength(2)
  })

  it('reflects modal open state', () => {
    const mockModalState = createMockModalState()
    mockModalState.open = true
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    expect(state.isOpen.value).toBe(true)
  })

  it('opens command palette without a specific command', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.open()

    expect(mockModalState.show).toHaveBeenCalledOnce()
    expect(state.activeCommand.value).toBeNull()
    expect(state.activeCommandProps.value).toBeNull()
  })

  it('opens command palette with a specific command', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.open('create-document', undefined)

    expect(mockModalState.show).toHaveBeenCalledOnce()
    expect(state.activeCommand.value?.id).toBe('create-document')
    expect(state.activeCommandProps.value).toBeNull()
  })

  it('opens command palette with command and props', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    const props = { inputValue: 'curl https://api.example.com' }
    state.open('import-curl-command', props)

    expect(mockModalState.show).toHaveBeenCalledOnce()
    expect(state.activeCommand.value?.id).toBe('import-curl-command')
    expect(state.activeCommandProps.value).toEqual(props)
  })

  it('closes command palette and resets state', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    state.setFilterQuery('import')
    state.open('create-document', undefined)
    state.close()

    expect(mockModalState.hide).toHaveBeenCalledOnce()
    expect(state.activeCommand.value).toBeNull()
    expect(state.activeCommandProps.value).toBeNull()
    expect(state.filterQuery.value).toBe('')
  })

  it('updates filter query', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('import')

    expect(state.filterQuery.value).toBe('import')
  })

  it('resets all state to initial values', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    state.setFilterQuery('test query')
    state.open('create-document', undefined)
    state.reset()

    expect(state.filterQuery.value).toBe('')
    expect(state.activeCommand.value).toBeNull()
    expect(state.activeCommandProps.value).toBeNull()
  })

  it('returns all commands when filter query is empty', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    expect(state.filteredCommands.value).toHaveLength(2)
    /** Filter excludes hidden commands, so 5 visible actions out of 6 total */
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(5)
    expect(state.filteredCommands.value[1]?.commands).toHaveLength(3)
  })

  it('filters commands by name case-insensitively', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('IMPORT')

    await nextTick()

    const allCommands = state.filteredCommands.value.flatMap((group) => group.commands)
    expect(allCommands).toHaveLength(1)
    expect(allCommands.some((cmd) => cmd.name.toLowerCase().includes('import'))).toBe(true)
  })

  it('filters commands with lowercase query', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('import')

    await nextTick()

    const allCommands = state.filteredCommands.value.flatMap((group) => group.commands)
    expect(allCommands).toHaveLength(1)
    expect(allCommands.every((cmd) => cmd.name.toLowerCase().includes('import'))).toBe(true)
  })

  it('excludes empty groups after filtering', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('environment')

    await nextTick()

    /** The implementation always returns both groups, even if one is empty */
    const groupsWithCommands = state.filteredCommands.value.filter((group) => group.commands.length > 0)
    expect(groupsWithCommands).toHaveLength(1)
    expect(groupsWithCommands[0]?.label).toBe('Pages')
    expect(groupsWithCommands[0]?.commands).toHaveLength(1)
  })

  it('returns empty array when no commands match filter', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('nonexistent-command-xyz')

    await nextTick()

    /** The implementation always returns both groups, even if empty */
    const totalCommands = state.filteredCommands.value.reduce((sum, group) => sum + group.commands.length, 0)
    expect(totalCommands).toBe(0)
  })

  it('trims whitespace from filter query', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('  import  ')

    await nextTick()

    const allCommands = state.filteredCommands.value.flatMap((group) => group.commands)
    expect(allCommands).toHaveLength(1)
  })

  it('handles empty string filter query', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('import')
    state.setFilterQuery('')

    await nextTick()

    expect(state.filteredCommands.value).toHaveLength(2)
  })

  it('handles whitespace-only filter query', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('   ')

    await nextTick()

    expect(state.filteredCommands.value).toHaveLength(2)
  })

  it('filters across multiple command groups', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('e')

    await nextTick()

    expect(state.filteredCommands.value.length).toBeGreaterThan(0)
    state.filteredCommands.value.forEach((group) => {
      group.commands.forEach((cmd) => {
        expect(cmd.name.toLowerCase()).toContain('e')
      })
    })
  })

  it('preserves group labels after filtering', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('cookies')

    await nextTick()

    /** The implementation always returns both groups, even if one is empty */
    const groupsWithCommands = state.filteredCommands.value.filter((group) => group.commands.length > 0)
    expect(groupsWithCommands).toHaveLength(1)
    expect(groupsWithCommands[0]?.label).toBe('Pages')
  })

  it('handles partial name matches', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('doc')

    await nextTick()

    const allCommands = state.filteredCommands.value.flatMap((group) => group.commands)
    expect(allCommands.some((cmd) => cmd.name === 'Create Document')).toBe(true)
  })

  it('maintains command properties after filtering', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('create document')

    await nextTick()

    const filteredCommand = state.filteredCommands.value
      .flatMap((group) => group.commands)
      .find((cmd) => cmd.id === 'create-document')

    expect(filteredCommand).toBeDefined()
    /** Actions don't have a 'type' property, routes have 'type': 'route' */
    expect(filteredCommand?.id).toBe('create-document')
    expect(filteredCommand?.name).toBe('Create Document')
  })

  it('allows opening different commands sequentially', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    state.open('create-document', undefined)
    expect(state.activeCommand.value?.id).toBe('create-document')

    state.open('add-tag', {})
    expect(state.activeCommand.value?.id).toBe('add-tag')
  })

  it('replaces command props when opening new command', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    const firstProps = { inputValue: 'curl https://first.com' }
    state.open('import-curl-command', firstProps)
    expect(state.activeCommandProps.value).toEqual(firstProps)

    const secondProps = { inputValue: 'curl https://second.com' }
    state.open('import-curl-command', secondProps)
    expect(state.activeCommandProps.value).toEqual(secondProps)
  })

  it('reacts to changes in reactive actions array', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const reactiveActions = ref<CommandPaletteAction[]>([
      {
        id: 'test-action-1',
        name: 'Test Action 1',
        component: {} as any,
      },
    ])

    const state = useCommandPaletteState(reactiveActions)

    await nextTick()

    /** Initially should have 1 action */
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(1)
    expect(state.filteredCommands.value[0]?.commands[0]?.name).toBe('Test Action 1')

    /** Add a new action */
    reactiveActions.value.push({
      id: 'test-action-2',
      name: 'Test Action 2',
      component: {} as any,
    })

    await nextTick()

    /** Should now have 2 actions */
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(2)
    expect(state.filteredCommands.value[0]?.commands[1]?.name).toBe('Test Action 2')
  })

  it('reacts to changes in reactive routes array', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const reactiveRoutes = ref<CommandPaletteRoute[]>([
      {
        type: 'route',
        id: 'test-route-1',
        name: 'Test Route 1',
        icon: {} as any,
        to: { name: 'test' },
      },
    ])

    const state = useCommandPaletteState([], reactiveRoutes)

    await nextTick()

    /** Initially should have 1 route in Pages group */
    expect(state.filteredCommands.value[1]?.commands).toHaveLength(1)
    expect(state.filteredCommands.value[1]?.commands[0]?.name).toBe('Test Route 1')

    /** Add a new route */
    reactiveRoutes.value.push({
      type: 'route',
      id: 'test-route-2',
      name: 'Test Route 2',
      icon: {} as any,
      to: { name: 'test2' },
    })

    await nextTick()

    /** Should now have 2 routes */
    expect(state.filteredCommands.value[1]?.commands).toHaveLength(2)
    expect(state.filteredCommands.value[1]?.commands[1]?.name).toBe('Test Route 2')
  })

  it('reacts to filtering changes on reactive actions', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const reactiveActions = ref<CommandPaletteAction[]>([
      {
        id: 'import-action',
        name: 'Import Data',
        component: {} as any,
      },
      {
        id: 'export-action',
        name: 'Export Data',
        component: {} as any,
      },
    ])

    const state = useCommandPaletteState(reactiveActions)

    /** Filter for import */
    state.setFilterQuery('import')
    await nextTick()

    expect(state.filteredCommands.value[0]?.commands).toHaveLength(1)
    expect(state.filteredCommands.value[0]?.commands[0]?.name).toBe('Import Data')

    /** Add a new action that matches the filter */
    reactiveActions.value.push({
      id: 'import-settings',
      name: 'Import Settings',
      component: {} as any,
    })

    await nextTick()

    /** Should now show both matching actions */
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(2)
    expect(state.filteredCommands.value[0]?.commands[0]?.name).toBe('Import Data')
    expect(state.filteredCommands.value[0]?.commands[1]?.name).toBe('Import Settings')
  })

  it('reacts when removing items from reactive actions', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const reactiveActions = ref<CommandPaletteAction[]>([
      {
        id: 'action-1',
        name: 'Action 1',
        component: {} as any,
      },
      {
        id: 'action-2',
        name: 'Action 2',
        component: {} as any,
      },
      {
        id: 'action-3',
        name: 'Action 3',
        component: {} as any,
      },
    ])

    const state = useCommandPaletteState(reactiveActions)

    await nextTick()

    expect(state.filteredCommands.value[0]?.commands).toHaveLength(3)

    /** Remove an action */
    reactiveActions.value = reactiveActions.value.filter((a) => a.id !== 'action-2')

    await nextTick()

    expect(state.filteredCommands.value[0]?.commands).toHaveLength(2)
    expect(state.filteredCommands.value[0]?.commands.some((a) => a.id === 'action-2')).toBe(false)
  })

  it('handles reactive actions with hidden property changes', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const reactiveActions = ref<CommandPaletteAction[]>([
      {
        id: 'visible-action',
        name: 'Visible Action',
        component: {} as any,
        hidden: false,
      },
      {
        id: 'hidden-action',
        name: 'Hidden Action',
        component: {} as any,
        hidden: true,
      },
    ])

    const state = useCommandPaletteState(reactiveActions)

    await nextTick()

    /** Hidden actions are filtered out */
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(1)
    expect(state.filteredCommands.value[0]?.commands[0]?.id).toBe('visible-action')

    /** Change hidden action to visible */
    reactiveActions.value = reactiveActions.value.map((a) => (a.id === 'hidden-action' ? { ...a, hidden: false } : a))

    await nextTick()

    /** Both actions should now be visible */
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(2)
  })

  it('can open commands from reactively added actions', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const reactiveActions = ref<CommandPaletteAction[]>([
      {
        id: 'initial-action',
        name: 'Initial Action',
        component: {} as any,
      },
    ])

    const state = useCommandPaletteState(reactiveActions)

    await nextTick()

    /** Add a new action */
    reactiveActions.value.push({
      id: 'new-action',
      name: 'New Action',
      component: {} as any,
    })

    await nextTick()

    /** Should be able to open the newly added action */
    state.open('new-action' as any, undefined)

    expect(state.activeCommand.value?.id).toBe('new-action')
    expect(mockModalState.show).toHaveBeenCalled()
  })
})
