import type { Icon as IconType } from '@scalar/components'
import { useModal } from '@scalar/components'
import { type ComputedRef, type Ref, computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

/** Base properties shared by all command types */
type CommandBase = {
  /** Unique identifier for the command */
  id: string
  /** Display name shown in the command palette */
  name: string
}

/**
 * Represents a single command in the command palette.
 * Commands can be folders (open sub-actions), routes (navigate), or hidden folders.
 */
export type Command =
  | (CommandBase & {
      /** Folder command that opens a specific action form */
      type: 'folder'
      /** Icon to display next to the command name */
      icon: IconType
    })
  | (CommandBase & {
      /** Route command that navigates to a page */
      type: 'route'
      /** Route to navigate to when the command is selected */
      to: RouteLocationRaw
      /** Icon to display next to the command name */
      icon: IconType
    })
  | (CommandBase & {
      /** Hidden folder for commands accessible via code but not shown in UI */
      type: 'hidden-folder'
      props?: Record<string, unknown>
    })

/**
 * A group of related commands with a label.
 * Used to organize commands into categories in the palette.
 */
export type CommandGroup = {
  /** Label for the command group (empty string for unlabeled groups) */
  label: string
  /** List of commands in this group */
  commands: Command[]
}

const getProps = <T extends Record<string, unknown>>() => null as unknown as T

/**
 * Available commands in the command palette.
 * Organized into groups for better UX and discoverability.
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
      /** Hidden commands accessible programmatically but not shown in UI */
      {
        type: 'hidden-folder',
        id: 'import-curl-command',
        name: 'Import cURL Command',
        props: getProps<{ curl: string; dummy: string }>(),
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

/** All valid command IDs derived from the commands array */
export type CommandIds = (typeof commands)[number]['commands'][number]['id']

/** Helper type to extract command IDs by command type */
type GetIdsFromType<T extends Command['type']> = keyof {
  [K in (typeof commands)[number]['commands'][number] as K extends {
    type: T
  }
    ? K['id']
    : never]: K
}

/** Command IDs that map to UI components (folder and hidden-folder types) */
export type UiCommandIds = GetIdsFromType<'folder' | 'hidden-folder'>

/** Helper type to extract command by ID from the commands array */
type GetCommandById<T extends string> = Extract<(typeof commands)[number]['commands'][number], { id: T }>

/**
 * Maps each command ID to its respective props type.
 * If a command has no props defined, it maps to undefined.
 */
export type CommandPropsMap = {
  [K in UiCommandIds]: GetCommandById<K> extends { props: infer P } ? P : undefined
}

/**
 * Return type for the useCommandPaletteState composable.
 * Provides reactive state and methods to control the command palette.
 */
export type UseCommandPaletteStateReturn = {
  /** Whether the command palette is currently open */
  isOpen: Ref<boolean>
  /** The currently active command, or null if showing the main list */
  activeCommand: Ref<UiCommandIds | null>
  /** Properties passed to the active command component */
  activeCommandProps: Ref<Record<string, unknown> | null>
  /** Current filter/search query for filtering commands */
  filterQuery: Ref<string>
  /** Filtered commands based on the current search query */
  filteredCommands: ComputedRef<readonly CommandGroup[]>
  /** Opens the command palette, optionally with a specific command active */
  open: (commandId?: UiCommandIds, props?: Record<string, unknown>) => void
  /** Closes the command palette and resets state */
  close: () => void
  /** Sets the active command without opening or closing the palette */
  setActiveCommand: (commandId: UiCommandIds | null) => void
  /** Updates the filter query for searching commands */
  setFilterQuery: (query: string) => void
  /** Resets all state to initial values */
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
 * @example
 * const palette = useCommandPaletteState()
 *
 * // Open the palette
 * palette.open()
 *
 * // Open with a specific command
 * palette.open('create-document')
 *
 * // Open with command props
 * palette.open('import-curl-command', { curl: 'curl https://api.example.com' })
 *
 * // Update filter query (automatically filters commands)
 * palette.setFilterQuery('import')
 *
 * // Access filtered results
 * console.log(palette.filteredCommands.value)
 *
 * // Close and reset
 * palette.close()
 */
export const useCommandPaletteState = (): UseCommandPaletteStateReturn => {
  const modalState = useModal()

  const filterQuery = ref('')
  const activeCommand = ref<UiCommandIds | null>(null)
  const activeCommandProps = ref<Record<string, unknown> | null>(null)

  /** Whether the command palette is currently open */
  const isOpen = computed<boolean>(() => modalState.open)

  /**
   * Filtered commands based on the current search query.
   * When no query is present, returns all commands.
   * When a query exists, filters commands by name (case-insensitive).
   * Empty groups are excluded from the results.
   */
  const filteredCommands = computed<CommandGroup[]>(() => {
    const query = filterQuery.value.toLowerCase().trim()

    /** No filtering when query is empty */
    if (!query) {
      return commands as unknown as CommandGroup[]
    }

    /** Filter commands by name and exclude empty groups */
    return commands
      .map((group) => ({
        label: group.label,
        commands: group.commands.filter((command) => command.name.toLowerCase().includes(query)),
      }))
      .filter((group) => group.commands.length > 0)
  })

  /**
   * Opens the command palette, optionally with a specific command active.
   * If a commandId is provided, that command will be opened immediately.
   */
  const open = (commandId?: UiCommandIds, props?: Record<string, unknown>): void => {
    if (commandId) {
      activeCommand.value = commandId
      activeCommandProps.value = props ?? null
    }
    modalState.show()
  }

  /** Closes the command palette and resets all state */
  const close = (): void => {
    modalState.hide()
    reset()
  }

  /** Sets the active command without affecting open or closed state */
  const setActiveCommand = (commandId: UiCommandIds | null): void => {
    activeCommand.value = commandId
  }

  /** Updates the filter query for searching commands */
  const setFilterQuery = (query: string): void => {
    filterQuery.value = query
  }

  /** Resets all internal state to initial values */
  const reset = (): void => {
    filterQuery.value = ''
    activeCommand.value = null
    activeCommandProps.value = null
  }

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
