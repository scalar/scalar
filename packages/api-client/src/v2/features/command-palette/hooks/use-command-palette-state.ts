import { useModal } from '@scalar/components'
import {
  ScalarIconArrowSquareIn,
  ScalarIconArrowUpRight,
  ScalarIconBracketsCurly,
  ScalarIconCookie,
  ScalarIconFolder,
  ScalarIconPackage,
  ScalarIconPuzzlePiece,
  ScalarIconSlidersHorizontal,
} from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import type { CommandPalettePayload } from '@scalar/workspace-store/events'
import Fuse from 'fuse.js'
import {
  type Component,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
  computed,
  ref,
  shallowRef,
  toValue,
} from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import CommandPaletteDocument from '../components/CommandPaletteDocument.vue'
import CommandPaletteExample from '../components/CommandPaletteExample.vue'
import CommandPaletteImport from '../components/CommandPaletteImport.vue'
import CommandPaletteImportCurl from '../components/CommandPaletteImportCurl.vue'
import CommandPaletteRequest from '../components/CommandPaletteRequest.vue'
import CommandPaletteTag from '../components/CommandPaletteTag.vue'

/**
 * Command IDs that map to UI components (folder and hidden-folder types)
 *
 * For base app commands they are defined by their action payload
 */
type UiCommandIds = keyof CommandPalettePayload

/** Map the the prop definitons to the prop value */
type CommandPaletteActionProps<K extends UiCommandIds> = CommandPalettePayload[K]

/**
 * Type for the open function in the command palette.
 * Supports two usage patterns:
 * - open() - Opens the palette without a specific command
 * - open(commandId) - Opens a command that does not require props
 * - open(commandId, props) - Opens a command with required props
 */
type OpenCommand = {
  (): void
  <T extends UiCommandIds>(commandId: T, props: CommandPaletteActionProps<T>): void
}

/** Route enntry for the palette list */
export type CommandPaletteRoute = {
  id: string
  type: 'route'
  icon: ScalarIconComponent
  name: string
  to: RouteLocationRaw
}

/** Command entry for the palette list */
type BaseCommandPaletteAction = {
  id: keyof CommandPalettePayload
  name: string
  icon?: ScalarIconComponent
  component: Component
  hidden?: boolean
}

export type CommandPaletteAction = Omit<BaseCommandPaletteAction, 'id'> & {
  id: string
}

export type CommandPaletteEntry = CommandPaletteAction | CommandPaletteRoute

// ---------------------------------------------------------------------------

/**
 * Return type for the useCommandPaletteState composable.
 * Provides reactive state and methods to control the command palette.
 */
export type CommandPaletteState = {
  /** Whether the command palette is currently open */
  isOpen: Ref<boolean>
  /** The currently active command, or null if showing the main list */
  activeCommand: ShallowRef<CommandPaletteAction | null>
  /** Properties passed to the active command component */
  activeCommandProps: Ref<Record<string, unknown> | null>
  /** Current filter/search query for filtering commands */
  filterQuery: Ref<string>
  /** Grouped actions and routes to be rendered */
  filteredCommands: ComputedRef<
    {
      label?: string
      commands: (CommandPaletteAction | CommandPaletteRoute)[]
    }[]
  >
  /**
   * Opens the command palette, optionally with a specific command active.
   * When opening a command, props are required only if the command defines them.
   */
  open: OpenCommand
  /** Closes the command palette and resets state */
  close: () => void
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
export const useCommandPaletteState = (
  actions: MaybeRefOrGetter<CommandPaletteAction[]> = baseClientActions,
  routes: MaybeRefOrGetter<CommandPaletteRoute[]> = baseRoutes,
): CommandPaletteState => {
  const modalState = useModal()

  const filterQuery = ref('')
  const activeCommand = shallowRef<CommandPaletteAction | null>(null)
  const activeCommandProps = ref<Record<string, unknown> | null>(null)

  /** Whether the command palette is currently open */
  const isOpen = computed<boolean>(() => modalState.open)

  const fuseActions = computed(
    () =>
      new Fuse(toValue(actions), {
        keys: ['name'],
        threshold: 0.1,
      }),
  )

  const fuseRoutes = computed(
    () =>
      new Fuse(toValue(routes), {
        keys: ['name'],
        threshold: 0.1,
      }),
  )

  /**
   * Filtered commands based on the current search query.
   * When no query is present, returns all visible commands (excluding hidden-folder).
   * When a query exists, filters commands by name (case-insensitive) and excludes hidden-folder.
   * Empty groups are excluded from the results.
   */
  const filteredActions = computed<CommandPaletteAction[]>(() => {
    const query = filterQuery.value.toLowerCase().trim()

    // Filter commands by name when query exists
    const base = query ? fuseActions.value.search(query).map((a) => a.item) : toValue(actions)

    // Always exclude hidden folders
    return base.filter((a) => !a.hidden)
  })

  const filteredRoutes = computed<CommandPaletteRoute[]>(() => {
    const query = filterQuery.value.toLowerCase().trim()

    return query ? fuseRoutes.value.search(query).map((a) => a.item) : toValue(routes)
  })

  /**
   * Opens the command palette, optionally with a specific command active.
   * If a commandId is provided, that command will be opened immediately.
   * Props are type-safe and checked against the command's expected props.
   */
  const open: OpenCommand = (commandId?: UiCommandIds, ...args: unknown[]): void => {
    if (commandId) {
      activeCommand.value = toValue(actions).find((a) => a.id === commandId) ?? null
      activeCommandProps.value = (args[0] as Record<string, unknown>) ?? null
    }
    modalState.show()
  }

  /** Closes the command palette and resets all state */
  const close = (): void => {
    modalState.hide()
    reset()
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
    filteredCommands: computed(() => [
      {
        label: '',
        commands: filteredActions.value,
      },
      {
        label: 'Pages',
        commands: filteredRoutes.value,
      },
    ]),
    open,
    close,
    setFilterQuery,
    reset,
  }
}

// ---------------------------------------------------------------------------
// Base commands

/**
 * The base naviation routes used in the command palette.
 * This object can be extended and passed to the useCommandPaletteState hook to add custom routes
 */
export const baseRoutes: CommandPaletteRoute[] = [
  {
    type: 'route',
    id: 'environment',
    name: 'Environment',
    icon: ScalarIconBracketsCurly,
    to: {
      name: 'workspace.environment',
    },
  },
  {
    type: 'route',
    id: 'cookies',
    name: 'Cookies',
    icon: ScalarIconCookie,
    to: {
      name: 'workspace.cookies',
    },
  },
  {
    type: 'route',
    id: 'settings',
    name: 'Settings',
    icon: ScalarIconSlidersHorizontal,
    to: {
      name: 'workspace.settings',
    },
  },
]

/**
 * The internal client command palette actions
 * This object can be extended and passed to the useCommandPaletteState hook to add custom actions
 */
export const baseClientActions = [
  {
    id: 'import-from-openapi-swagger-postman-curl',
    name: 'Import from OpenAPI/Swagger/Postman/cURL',
    component: CommandPaletteImport,
    icon: ScalarIconArrowSquareIn,
  },
  {
    id: 'create-document',
    name: 'Create Document',
    component: CommandPaletteDocument,
    icon: ScalarIconPackage,
  },
  {
    id: 'add-tag',
    name: 'Add Tag',
    component: CommandPaletteTag,
    icon: ScalarIconFolder,
  },
  {
    id: 'create-request',
    name: 'Create Request',
    component: CommandPaletteRequest,
    icon: ScalarIconArrowUpRight,
  },
  {
    id: 'add-example',
    name: 'Add Example',
    component: CommandPaletteExample,
    icon: ScalarIconPuzzlePiece,
  },
  {
    id: 'import-curl-command',
    name: 'Import cURL Command',
    hidden: true,
    component: CommandPaletteImportCurl,
  },
] as const satisfies BaseCommandPaletteAction[]
