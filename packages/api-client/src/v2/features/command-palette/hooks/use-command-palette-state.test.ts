import { useModal } from '@scalar/components'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

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
    expect(state.activeCommand.value).toBe('create-document')
    expect(state.activeCommandProps.value).toBeNull()
  })

  it('opens command palette with command and props', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    const props = { curl: 'curl https://api.example.com' }
    state.open('import-curl-command', props)

    expect(mockModalState.show).toHaveBeenCalledOnce()
    expect(state.activeCommand.value).toBe('import-curl-command')
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
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(6)
    expect(state.filteredCommands.value[1]?.commands).toHaveLength(3)
  })

  it('filters commands by name case-insensitively', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('IMPORT')

    await nextTick()

    const allCommands = state.filteredCommands.value.flatMap((group) => group.commands)
    expect(allCommands).toHaveLength(2)
    expect(allCommands.some((cmd) => cmd.name.toLowerCase().includes('import'))).toBe(true)
  })

  it('filters commands with lowercase query', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('import')

    await nextTick()

    const allCommands = state.filteredCommands.value.flatMap((group) => group.commands)
    expect(allCommands).toHaveLength(2)
    expect(allCommands.every((cmd) => cmd.name.toLowerCase().includes('import'))).toBe(true)
  })

  it('excludes empty groups after filtering', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('environment')

    await nextTick()

    expect(state.filteredCommands.value).toHaveLength(1)
    expect(state.filteredCommands.value[0]?.label).toBe('Pages')
    expect(state.filteredCommands.value[0]?.commands).toHaveLength(1)
  })

  it('returns empty array when no commands match filter', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('nonexistent-command-xyz')

    await nextTick()

    expect(state.filteredCommands.value).toHaveLength(0)
  })

  it('trims whitespace from filter query', async () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()
    state.setFilterQuery('  import  ')

    await nextTick()

    const allCommands = state.filteredCommands.value.flatMap((group) => group.commands)
    expect(allCommands).toHaveLength(2)
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

    expect(state.filteredCommands.value).toHaveLength(1)
    expect(state.filteredCommands.value[0]?.label).toBe('Pages')
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
    expect(filteredCommand?.type).toBe('folder')
    expect(filteredCommand?.name).toBe('Create Document')
  })

  it('allows opening different commands sequentially', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    state.open('create-document', undefined)
    expect(state.activeCommand.value).toBe('create-document')

    state.open('add-tag', undefined)
    expect(state.activeCommand.value).toBe('add-tag')
  })

  it('replaces command props when opening new command', () => {
    const mockModalState = createMockModalState()
    vi.mocked(useModal).mockReturnValue(mockModalState)

    const state = useCommandPaletteState()

    const firstProps = { curl: 'curl https://first.com' }
    state.open('import-curl-command', firstProps)
    expect(state.activeCommandProps.value).toEqual(firstProps)

    const secondProps = { curl: 'curl https://second.com' }
    state.open('import-curl-command', secondProps)
    expect(state.activeCommandProps.value).toEqual(secondProps)
  })
})
