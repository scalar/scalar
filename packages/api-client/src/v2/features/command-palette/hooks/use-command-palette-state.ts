import type { Icon as IconType } from '@scalar/components'
import { useModal } from '@scalar/components'
import { type ComputedRef, type Ref, computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

type CommandBase = {
  /** Unique identifier for the command. */
  id: string
  /** Display name shown in the command palette. */
  name: string
}

/**
 * Represents a single command in the command palette.
 * Each command has a unique ID, display name, and icon.
 */
export type Command =
  | (CommandBase & {
      type: 'folder'
      /** Icon to display next to the command name. */
      icon: IconType
    })
  | (CommandBase & {
      type: 'route'
      /** Route to navigate to when the command is selected. */
      to: RouteLocationRaw
      /** Icon to display next to the command name. */
      icon: IconType
    })
  | (CommandBase & {
      /** Hidden folder to group commands that are not visible in the command palette but can still be selected (just not from the ui). */
      type: 'hidden-folder'
    })

/**
 * A group of related commands with an optional label.
 * Used to organize commands into categories in the palette.
 */
export type CommandGroup = {
  /** Optional label for the command group. Empty string means no label. */
  label: string
  /** List of commands in this group. */
  commands: Command[]
}

/**
 * Available commands in the command palette.
 * Organized into groups for better UX.
 */
export const commands = [
  {
    label: '',
    commands: [
      {
        type: 'folder',
        id: 'import-from-openapi-swagger-postman-curl',
        name: 'Import from OpenAPI/Swagger/Postman/cURL',
        icon: 'Import',
      },
      {
        type: 'folder',
        id: 'create-document',
        name: 'Create Document',
        icon: 'Collection',
      },
      {
        type: 'folder',
        id: 'add-tag',
        name: 'Add Tag',
        icon: 'Folder',
      },
      {
        type: 'folder',
        id: 'create-request',
        name: 'Create Request',
        icon: 'ExternalLink',
      },
      {
        type: 'folder',
        id: 'add-example',
        name: 'Add Example',
        icon: 'Example',
      },
      //--------------------------------
      // Hidden commands
      //--------------------------------
      {
        type: 'hidden-folder',
        id: 'import-curl-command',
        name: 'Import cURL Command',
      },
    ],
  },
  {
    label: 'Pages',
    commands: [
      {
        type: 'route',
        id: 'environment',
        name: 'Environment',
        icon: 'Brackets',
        to: {
          name: 'workspace.environment',
        },
      },
      {
        type: 'route',
        id: 'cookies',
        name: 'Cookies',
        icon: 'Cookie',
        to: {
          name: 'workspace.cookies',
        },
      },
      {
        type: 'route',
        id: 'settings',
        name: 'Settings',
        icon: 'Settings',
        to: {
          name: 'workspace.settings',
        },
      },
    ],
  },
] as const satisfies CommandGroup[]

/** All valid command IDs derived from the commands array. */
export type CommandIds = (typeof commands)[number]['commands'][number]['id']

type GetIdsFromType<T extends Command['type']> = keyof {
  [K in (typeof commands)[number]['commands'][number] as K extends { type: T } ? K['id'] : never]: K
}

export type UiCommandIds = GetIdsFromType<'folder' | 'hidden-folder'>

/**
 * Return type for the useCommandPaletteState composable.
 * Provides reactive state and methods to control the command palette.
 */
export type UseCommandPaletteStateReturn = {
  /** Whether the command palette is currently open. */
  isOpen: Ref<boolean>
  /** The currently active command, or null if showing the main list. */
  activeCommand: Ref<UiCommandIds | null>
  /** The properties of the currently active command, or null if no command is active. */
  activeCommandProps: Ref<Record<string, unknown> | null>
  /** Current filter/search query for filtering commands. */
  filterQuery: Ref<string>
  /** Filtered commands based on the current search query. */
  filteredCommands: ComputedRef<readonly CommandGroup[]>
  /** Whether theommand palette, optionally with a specific command active. */
  open: (commandId?: UiCommandIds, props?: Record<string, unknown>) => void
  /** Closes the command palette and resets state. */
  close: () => void
  /** Sets the active command without opening/closing the palette. */
  setActiveCommand: (commandId: UiCommandIds | null) => void
  /** Updates the filter query for searching commands. */
  setFilterQuery: (query: string) => void
  /** Resets all state to initial values. */
  reset: () => void
}

/**
 * Composable for managing command palette state.
 *
 * Centralizes all state management for the command palette including:
 * - Open/closed state
 * - Active command selection
 * - Filter/search query
 * - Command filtering logic
 *
 * @returns Reactive state and methods to control the command palette
 *
 * @example
 * ```ts
 * const palette = useCommandPaletteState()
 *
 * // Open the palette
 * palette.open()
 *
 * // Open with a specific command
 * palette.open('create-collection')
 *
 * // Update filter query (automatically filters commands)
 * palette.setFilterQuery('import')
 *
 * // Access filtered results
 * console.log(palette.filteredCommands.value)
 * console.log(palette.hasResults.value)
 *
 * // Close and reset
 * palette.close()
 * ```
 */
export const useCommandPaletteState = (): UseCommandPaletteStateReturn => {
  const modalState = useModal()
  const filterQuery = ref<string>('')
  const activeCommand = ref<UiCommandIds | null>(null)
  const activeCommandProps = ref<Record<string, unknown> | null>(null)

  /** Opens the command palette, optionally with a specific command active. */
  const open = (commandId?: UiCommandIds, props?: Record<string, unknown>): void => {
    if (commandId) {
      activeCommand.value = commandId
      activeCommandProps.value = props ?? null
    }
    modalState.show()
  }

  /** Closes the command palette and resets all state. */
  const close = (): void => {
    modalState.hide()
    reset()
  }

  /** Sets the active command without affecting open/closed state. */
  const setActiveCommand = (commandId: UiCommandIds | null): void => {
    activeCommand.value = commandId
  }

  /** Updates the filter query for searching commands. */
  const setFilterQuery = (query: string): void => {
    filterQuery.value = query
  }

  /** Resets all internal state to initial values. */
  const reset = (): void => {
    filterQuery.value = ''
    activeCommand.value = null
  }

  const isOpen = computed(() => modalState.open)

  /**
   * Filtered commands based on the current search query.
   * When no query is present, returns all commands.
   * When a query exists, filters commands by name (case-insensitive).
   * Empty groups are excluded from the results.
   */
  const filteredCommands = computed<CommandGroup[]>(() => {
    const query = filterQuery.value.toLowerCase().trim()

    if (!query) {
      return commands as unknown as CommandGroup[]
    }

    return commands
      .map((group) => ({
        label: group.label,
        commands: group.commands.filter((command) => command.name.toLowerCase().includes(query)),
      }))
      .filter((group) => group.commands.length > 0)
  })

  return {
    isOpen,
    activeCommand,
    activeCommandProps,
    filterQuery,
    filteredCommands,
    open,
    close,
    setActiveCommand,
    setFilterQuery,
    reset,
  }
}
