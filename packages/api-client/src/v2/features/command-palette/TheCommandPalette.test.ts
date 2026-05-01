import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, ref, shallowRef } from 'vue'

import type { CommandPaletteAction, CommandPaletteState } from './hooks/use-command-palette-state'
import TheCommandPalette from './TheCommandPalette.vue'

const RegistryImportCommand = defineComponent({
  props: {
    selectFirst: {
      type: Function,
      required: false,
    },
    selectSecond: {
      type: Function,
      required: false,
    },
  },
  setup(props) {
    return () =>
      h('div', [
        h('input', {
          autofocus: true,
          placeholder: 'Type to search for a document...',
        }),
        h(
          'button',
          {
            class: 'commandmenu-item',
            type: 'button',
            onClick: () => props.selectFirst?.(),
          },
          '@scalar/access-service',
        ),
        h(
          'button',
          {
            class: 'commandmenu-item',
            type: 'button',
            onClick: () => props.selectSecond?.(),
          },
          '@scalar/galaxy',
        ),
      ])
  },
})

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const createPaletteState = (): CommandPaletteState => ({
  isOpen: ref(true),
  activeCommand: shallowRef(null),
  activeCommandProps: ref(null),
  filterQuery: ref(''),
  filteredCommands: computed(() => [
    {
      commands: [],
    },
  ]),
  open: vi.fn(),
  close: vi.fn(),
  setFilterQuery: vi.fn(),
  reset: vi.fn(),
})

const mountCommandPalette = (paletteState: CommandPaletteState) =>
  mount(TheCommandPalette, {
    attachTo: document.body,
    props: {
      paletteState,
      workspaceStore: { workspace: { documents: {} } } as never,
      eventBus: {
        on: vi.fn(),
        off: vi.fn(),
      } as never,
    },
  })

describe('TheCommandPalette', () => {
  it('focuses the search input when an active command opens', async () => {
    const paletteState = createPaletteState()
    const registryCommand = {
      id: 'import-from-scalar-registry',
      name: 'Import from Scalar Registry',
      component: RegistryImportCommand,
    } satisfies CommandPaletteAction

    paletteState.activeCommand.value = registryCommand
    const wrapper = mountCommandPalette(paletteState)
    await nextTick()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(document.activeElement).toBe(
      document.body.querySelector('input[placeholder="Type to search for a document..."]'),
    )

    wrapper.unmount()
  })

  it('selects active command items with arrow keys from the search input', async () => {
    const paletteState = createPaletteState()
    const selectFirst = vi.fn()
    const selectSecond = vi.fn()
    const registryCommand = {
      id: 'import-from-scalar-registry',
      name: 'Import from Scalar Registry',
      component: RegistryImportCommand,
    } satisfies CommandPaletteAction

    paletteState.activeCommandProps.value = { selectFirst, selectSecond }
    paletteState.activeCommand.value = registryCommand
    const wrapper = mountCommandPalette(paletteState)
    await nextTick()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const input = document.body.querySelector<HTMLInputElement>('input[placeholder="Type to search for a document..."]')
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(document.body.querySelectorAll('.commandmenu-item').item(0).getAttribute('aria-selected')).toBe('false')
    expect(document.body.querySelectorAll('.commandmenu-item').item(1).getAttribute('aria-selected')).toBe('true')
    expect(selectSecond).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})
