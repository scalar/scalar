import type { ScalarListboxOption, WorkspaceGroup } from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { sortByOrder } from '@scalar/helpers/array/sort-by-order'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { migrateLocalStorageToIndexDb } from '@scalar/oas-utils/migrations'
import { createSidebarState, generateReverseIndex } from '@scalar/sidebar'
import type { Theme } from '@scalar/themes'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import {
  type OperationExampleMeta,
  type WorkspaceEventBus,
  createWorkspaceEventBus,
} from '@scalar/workspace-store/events'
import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import { createWorkspaceStorePersistence, getWorkspaceId } from '@scalar/workspace-store/persistence'
import { persistencePlugin } from '@scalar/workspace-store/plugins/client'
import { getActiveEnvironment } from '@scalar/workspace-store/request-example'
import type { Workspace, WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace/x-scalar-tabs'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import {
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
  computed,
  readonly,
  ref,
  shallowRef,
  watch,
} from 'vue'
import type { RouteLocationNormalizedGeneric, RouteLocationRaw, Router } from 'vue-router'

import type { ApiClientAppOptions } from '@/v2/features/app/helpers/create-api-client-app'
import { getRouteParam } from '@/v2/features/app/helpers/get-route-param'
import { groupWorkspacesByTeam } from '@/v2/features/app/helpers/group-workspaces'
import { useTheme } from '@/v2/features/app/hooks/use-theme'
import { getTabDetails } from '@/v2/helpers/get-tab-details'
import { slugify } from '@/v2/helpers/slugify'
import { workspaceStorage } from '@/v2/helpers/storage'

import { initializeAppEventHandlers } from './app-events'
import { canLoadWorkspace, filterWorkspacesByTeam } from './helpers/filter-workspaces'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type GetEntryByLocation = (location: {
  document: string
  path?: string
  method?: HttpMethod
  example?: string
}) =>
  | (TraversedEntry & {
      parent?: TraversedEntry | undefined
    })
  | undefined

type WorkspaceOption = ScalarListboxOption & { teamSlug: string; slug: string }

/** Defines the overall application state structure and its main feature modules */
export type AppState = {
  /** The workspace store */
  store: ShallowRef<WorkspaceStore | null>
  /** The sidebar management */
  sidebar: {
    /** The sidebar state */
    state: ReturnType<typeof createSidebarState<TraversedEntry>>
    /** The width of the sidebar */
    width: ComputedRef<number>
    /** Whether the sidebar is open */
    isOpen: Ref<boolean>
    /** Handles the selection of an item in the sidebar */
    handleSelectItem: (id: string) => void
    /** Handles the width update of the sidebar */
    handleSidebarWidthUpdate: (width: number) => void
    /** Gets the entry by location */
    getEntryByLocation: GetEntryByLocation
  }
  /** The tabs management */
  tabs: {
    /** The tabs state */
    state: Ref<Tab[]>
    /** The active tab index */
    activeTabIndex: Ref<number>
    /** Copies the URL of the tab at the given index to the clipboard */
    copyTabUrl: (index: number) => Promise<void>
  }
  /** The workspace management */
  workspace: {
    /** Creates a new workspace and navigates to it */
    create: (payload: {
      teamSlug?: string
      slug?: string
      name: string
    }) => Promise<{ name: string; slug: string; teamSlug: string } | undefined>
    /** All workspace list */
    workspaceList: Ref<WorkspaceOption[]>
    /** Filtered workspace list, based on the current teamSlug */
    filteredWorkspaceList: ComputedRef<WorkspaceOption[]>
    /**
     * Groups workspaces into team and local categories for display in the workspace picker.
     * Team workspaces are shown first (when not on local team), followed by local workspaces.
     */
    workspaceGroups: ComputedRef<WorkspaceGroup[]>
    /** The currently active workspace */
    activeWorkspace: ShallowRef<{ id: string; label: string } | null>
    /** Navigates to the specified workspace */
    navigateToWorkspace: (teamSlug?: string, slug?: string) => Promise<void>
    /** Whether the workspace page is open */
    isOpen: ComputedRef<boolean>
  }
  /** The workspace event bus for handling workspace-level events */
  eventBus: WorkspaceEventBus
  /** The router instance */
  router: Router
  /** The current route derived from the router */
  currentRoute: Ref<RouteLocationNormalizedGeneric | null>
  /** Whether the workspace is currently syncing */
  loading: Ref<boolean>
  /** Runtime behaviour overrides */
  options?: ApiClientAppOptions
  /** The currently active entities */
  activeEntities: {
    /** The slug identifying the current workspace */
    workspaceSlug: Ref<string | undefined>
    /** The slug of the currently selected document in the workspace */
    documentSlug: Ref<string | undefined>
    /** The API path currently selected (e.g. "/users/{id}") */
    path: Ref<string | undefined>
    /** The HTTP method for the currently selected API path (e.g. GET, POST) */
    method: Ref<HttpMethod | undefined>
    /** The name of the currently selected example (for examples within an endpoint) */
    exampleName: Ref<string | undefined>
    /** The slug of the selected team context (read-only; use setTeamSlug to change) */
    teamSlug: Readonly<Ref<string>>
    /** Sets the current team context by team slug */
    setTeamSlug: (value: string) => void
  }
  /** The currently active environment */
  environment: ComputedRef<XScalarEnvironment>
  /** The currently active document */
  document: ComputedRef<WorkspaceDocument | null>
  /** Whether the current color mode is dark */
  isDarkMode: ComputedRef<boolean>
  /** The currently active theme */
  theme: {
    /** The computed CSS styles for the current theme, as a string */
    styles: ComputedRef<{ themeStyles: string; themeSlug: string }>
    /** The computed value for the <style> tag containing the current theme styles */
    themeStyleTag: ComputedRef<string>
    /** The custom themes to use */
    customThemes: MaybeRefOrGetter<Theme[]>
  }
  telemetry: Ref<boolean>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** Default debounce delay in milliseconds for workspace store persistence. */
const DEFAULT_DEBOUNCE_DELAY = 1000
/** Default sidebar width in pixels. */
const DEFAULT_SIDEBAR_WIDTH = 288
/** Default slug used when auto-creating a team workspace on demand. */
export const DEFAULT_TEAM_WORKSPACE_SLUG = 'default'
/** Default display name used when auto-creating a team workspace on demand. */
export const DEFAULT_TEAM_WORKSPACE_NAME = 'Workspace'

// ---------------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------------
export const createAppState = async ({
  router,
  fileLoader,
  fallbackThemeSlug = () => 'default',
  customThemes = () => [],
  telemetryDefault,
  options,
}: {
  router: Router
  fileLoader?: LoaderPlugin
  customThemes?: MaybeRefOrGetter<Theme[]>
  fallbackThemeSlug?: MaybeRefOrGetter<string>
  telemetryDefault?: boolean
  /** Runtime behaviour overrides */
  options?: ApiClientAppOptions
}): Promise<AppState> => {
  /** Workspace event bus for handling workspace-level events. */
  const eventBus = createWorkspaceEventBus({
    debug: import.meta.env.DEV,
  })

  const { workspace: persistence } = await createWorkspaceStorePersistence()

  /**
   * Run migration from localStorage to IndexedDB if needed
   * This happens once per user and transforms old data structure to new workspace format
   */
  await migrateLocalStorageToIndexDb()

  // ---------------------------------------------------------------------------
  // Active entities
  // ---------------------------------------------------------------------------
  // Currently selected team context. Drives workspace filtering and team switching.
  const teamSlug = ref<string>('local')
  // Team slug parsed from the current URL (the `@teamSlug` segment). Stays in sync with the route.
  const routeTeamSlug = ref<string | undefined>(undefined)
  const workspaceSlug = ref<string | undefined>(undefined)
  const documentSlug = ref<string | undefined>(undefined)
  const method = ref<HttpMethod | undefined>(undefined)
  const path = ref<string | undefined>(undefined)
  const exampleName = ref<string | undefined>(undefined)

  // ---------------------------------------------------------------------------
  // Loading states
  const isSyncingWorkspace = ref(false)

  // ---------------------------------------------------------------------------
  // Router state
  router.afterEach((to) => handleRouteChange(to))
  const currentRoute = computed(() => router.currentRoute.value ?? null)

  // ---------------------------------------------------------------------------
  // Workspace persistence state management
  const activeWorkspace = shallowRef<{ id: string; label: string } | null>(null)
  const workspaces = ref<WorkspaceOption[]>([])
  const filteredWorkspaces = computed(() => filterWorkspacesByTeam(workspaces.value, teamSlug.value))
  const workspaceGroups = computed(() =>
    groupWorkspacesByTeam(filteredWorkspaces.value, teamSlug.value, {
      // Surface a fake default workspace for non-local teams so logged-in
      // users always see a team workspace entry in the picker. Clicking it
      // navigates to a normal workspace route; the route handler creates the
      // workspace on demand when it does not yet exist.
      placeholder: {
        slug: DEFAULT_TEAM_WORKSPACE_SLUG,
        label: DEFAULT_TEAM_WORKSPACE_NAME,
      },
    }),
  )
  const store = shallowRef<WorkspaceStore | null>(null)

  // Load persisted telemetry preference, falling back to the provided default
  const persistedTelemetry = workspaceStorage.getTelemetry()
  const telemetry = ref(persistedTelemetry !== null ? persistedTelemetry : Boolean(telemetryDefault))
  watch(telemetry, (value) => workspaceStorage.setTelemetry(value))

  const activeDocument = computed(() => {
    return store.value?.workspace.documents[documentSlug.value ?? ''] || null
  })

  /**
   * Merged environment variables from workspace and document levels.
   * Variables from both sources are combined, with document variables
   * taking precedence in case of naming conflicts.
   */
  const environment = computed<XScalarEnvironment>(
    () => getActiveEnvironment(store.value, activeDocument.value).environment,
  )

  /** Update the workspace list when the component is mounted */
  workspaces.value = await persistence.getAll().then((w) =>
    w.map(({ teamSlug, slug, name }) => ({
      id: getWorkspaceId(teamSlug, slug),
      teamSlug,
      slug,
      label: name,
    })),
  )

  /**
   * Renames the currently active workspace.
   * Updates the workspace name in persistence and updates activeWorkspace if successful.
   * Returns early if team slug or workspaceSlug is not set, or if update fails.
   */
  const renameWorkspace = async (name: string) => {
    const teamSlugValue = routeTeamSlug.value
    const slugValue = workspaceSlug.value
    if (!teamSlugValue || !slugValue) {
      return
    }
    const workspaceId = getWorkspaceId(teamSlugValue, slugValue)
    const updateResult = await persistence.updateName({ teamSlug: teamSlugValue, slug: slugValue }, name)

    // If `the update fails, return early
    if (updateResult === undefined) {
      return
    }

    // Update the workspace list
    workspaces.value = workspaces.value.map((workspace) => {
      // If the workspace is the currently active workspace, update the label
      if (workspace.id === workspaceId) {
        return { ...workspace, label: name }
      }
      return workspace
    })
    activeWorkspace.value = { id: workspaceId, label: name }
  }

  /**
   * Creates a client-side workspace store with persistence enabled for the given workspace id.
   */
  const createClientStore = async ({ teamSlug, slug }: { teamSlug: string; slug: string }): Promise<WorkspaceStore> => {
    return createWorkspaceStore({
      plugins: [
        await persistencePlugin({
          workspaceId: getWorkspaceId(teamSlug, slug),
          debounceDelay: DEFAULT_DEBOUNCE_DELAY,
        }),
      ],
      fileLoader,
      fetch: options?.customFetch,
    })
  }

  /**
   * Attempts to load and activate a workspace by id.
   * Returns true when the workspace was found and activated.
   */
  const loadWorkspace = async (
    teamSlug: string,
    slug: string,
  ): Promise<{ success: true; workspace: Workspace } | { success: false }> => {
    const workspace = await persistence.getItem({ teamSlug, slug })

    if (!workspace) {
      return {
        success: false,
      }
    }

    const client = await createClientStore({ teamSlug, slug })
    client.loadWorkspace(workspace.workspace)
    activeWorkspace.value = { id: getWorkspaceId(workspace.teamSlug, workspace.slug), label: workspace.name }
    store.value = client

    return {
      success: true,
      workspace: client.workspace,
    }
  }

  /**
   * Creates and persists the default workspace with a blank draft document.
   * Used when no workspaces exist yet.
   */
  const createAndPersistWorkspace = async ({
    name,
    teamSlug,
    slug,
  }: {
    name: string
    teamSlug?: string
    slug: string
  }) => {
    const draftStore = createWorkspaceStore()
    await draftStore.addDocument({
      name: 'drafts',
      document: {
        openapi: '3.1.0',
        info: {
          title: 'Drafts',
          version: '1.0.0',
        },
        paths: {
          '/': {
            get: {},
          },
        },
        'x-scalar-original-document-hash': 'drafts',
        'x-scalar-icon': 'interface-edit-tool-pencil',
      },
    })

    // Persist the workspace
    const workspace = await persistence.setItem(
      { teamSlug, slug },
      {
        name: name,
        workspace: draftStore.exportWorkspace(),
      },
    )

    // Update the workspace list
    workspaces.value.push({
      id: getWorkspaceId(workspace.teamSlug, workspace.slug),
      teamSlug: workspace.teamSlug,
      slug: workspace.slug,
      label: workspace.name,
    })
    return workspace
  }

  /**
   * Navigates to the overview page of the specified workspace.
   *
   * @param teamSlug - The slug of the team that owns the workspace (used as the URL `@teamSlug` segment).
   * @param slug - The unique workspace slug (identifier).
   */
  const navigateToWorkspace = async (teamSlug?: string, slug?: string): Promise<void> => {
    if (!teamSlug || !slug) {
      await router.push('/')
      return
    }

    // We should always have this drafts document available in a new workspace
    await router.push({
      name: 'example',
      params: {
        teamSlug,
        workspaceSlug: slug,
        documentSlug: 'drafts',
        pathEncoded: encodeURIComponent('/'),
        method: 'get',
        exampleName: 'default',
      },
    })
  }

  /**
   * Creates a new workspace with the provided name.
   * - Generates a unique slug for the workspace (uses the provided slug if it is unique, otherwise generates a unique slug).
   * - Adds a default blank document ("drafts") to the workspace.
   * - Persists the workspace and navigates to it.
   *
   * Example usage:
   *   await createWorkspace({ name: 'My Awesome API' })
   *   // -> Navigates to /workspace/my-awesome-api (if available)
   */
  const createWorkspace = async ({ teamSlug, slug, name }: { teamSlug?: string; slug?: string; name: string }) => {
    // Restrict users to a single workspace per team. Local workspaces remain
    // unrestricted. This guard is temporary while multi-workspace support for
    // teams is being designed. When a team workspace already exists, navigate
    // to it instead of creating a duplicate.
    if (teamSlug && teamSlug !== 'local') {
      const existing = workspaces.value.find((w) => w.teamSlug === teamSlug)
      if (existing) {
        console.warn(
          `A workspace already exists for team "${teamSlug}". Navigating to the existing workspace instead.`,
        )
        await navigateToWorkspace(existing.teamSlug, existing.slug)
        return { teamSlug: existing.teamSlug, slug: existing.slug, name: existing.label }
      }
    }

    // Clear up the current store, in order to show the loading state
    store.value = null

    // Generate a unique slug/id for the workspace, based on the name.
    const newWorkspaceSlug = await generateUniqueValue({
      defaultValue: slug ?? name, // Use the provided id if it exists, otherwise use the name
      validation: async (value) => !(await persistence.has({ teamSlug: teamSlug ?? 'local', slug: value })),
      maxRetries: 100,
      transformation: slugify,
    })

    // Failed to generate a unique workspace id, so we can't create the workspace.
    if (!newWorkspaceSlug) {
      return undefined
    }

    const newWorkspaceDetails = {
      teamSlug,
      slug: newWorkspaceSlug,
      name,
    }

    // Create a new client store with the workspace ID and add a default document.
    const createdWorkspace = await createAndPersistWorkspace(newWorkspaceDetails)

    // Navigate to the newly created workspace.
    await navigateToWorkspace(createdWorkspace.teamSlug, createdWorkspace.slug)
    return createdWorkspace
  }

  /**
   * Handles changing the active workspace when the workspace slug changes in the route.
   * This function:
   *  - Clears the current workspace store and sets loading state.
   *  - Attempts to load the workspace by slug.
   *    - If found, navigates to the active tab path (if available).
   *    - If not found, creates the default workspace and navigates to it.
   */
  const changeWorkspace = async (teamSlug: string, slug: string, to?: RouteLocationNormalizedGeneric) => {
    /** For initial load we want to fall through to our router default behaviour */
    const isInitialLoad = activeWorkspace.value === null

    // Clear the current store and set loading to true before loading new workspace.
    store.value = null
    isSyncingWorkspace.value = true

    // Try to load the workspace
    const result = await loadWorkspace(teamSlug, slug)

    if (result.success) {
      // Navigate to the correct tab if the workspace has a tab already
      const index = result.workspace['x-scalar-active-tab'] ?? 0
      const tabs = result.workspace['x-scalar-tabs']
      const tab = tabs?.[index]

      // On initial load let the URL-based routing (catch-all → getLastPath) take precedence
      if (tab && !isInitialLoad) {
        // Preserve query parameters when navigating to the active tab
        await router.replace({
          path: tab.path,
          query: currentRoute.value?.query ?? {},
        })
      }

      // Heal the active tab index if it is out of bounds
      if (tabs && index >= tabs.length) {
        eventBus.emit('tabs:update:tabs', {
          'x-scalar-active-tab': 0,
        })
      }

      // Initialize the tabs if they does not exist
      if (!tabs) {
        eventBus.emit('tabs:update:tabs', {
          'x-scalar-tabs': [createTabFromRoute(currentRoute.value)],
          'x-scalar-active-tab': 0,
        })
      }

      // On initial load the router.replace above is skipped, so syncTabs/syncSidebar
      // are never reached via handleRouteChange's normal flow. Call them here to
      // align the tab bar and sidebar with the URL-based route.
      if (isInitialLoad && to) {
        syncTabs(to)
        syncSidebar(to)
      }

      isSyncingWorkspace.value = false
      return
    }

    // Navigate to the default workspace, or fall back to the first available workspace
    const targetWorkspace =
      filteredWorkspaces.value.find((workspace) => workspace.teamSlug === 'local' && workspace.slug === 'default') ??
      filteredWorkspaces.value[0]

    if (targetWorkspace) {
      return navigateToWorkspace(targetWorkspace.teamSlug, targetWorkspace.slug)
    }

    // If loading failed (workspace does not exist), create the default workspace and navigate to it.
    const createResult = await createWorkspace({
      name: 'Default Workspace',
      slug: 'default',
    })

    isSyncingWorkspace.value = false

    if (!createResult) {
      return console.error('Failed to create the default workspace, something went wrong, can not load the workspace')
    }

    // Must reset the sidebar state when the workspace changes
    sidebarState.reset()
  }

  /**
   * Sets the current team context. If the active workspace is not accessible
   * with the new team, navigates to the default workspace for that team.
   */
  const setTeamSlug = (value: string) => {
    // Update the active team slug.
    teamSlug.value = value

    // Find the workspace that matches the current route.
    const workspace = filteredWorkspaces.value.find(
      (w) => w.teamSlug === routeTeamSlug.value && w.slug === workspaceSlug.value,
    )

    // Check if the new team slug is accessible to the current workspace.
    if (workspace && canLoadWorkspace(workspace.teamSlug, value)) {
      return
    }

    // When the user is on a workspace on another team or the workspace is not accessible, redirect to the default workspace.
    return navigateToWorkspace('local', 'default')
  }

  // ---------------------------------------------------------------------------
  // Sidebar state management

  const entries = computed(() => {
    const activeStore = store.value
    if (!activeStore) {
      return []
    }

    const order = activeStore.workspace['x-scalar-order'] ?? Object.keys(activeStore.workspace.documents)

    return sortByOrder(Object.keys(activeStore.workspace.documents), order, (item) => item)
      .map((doc) => activeStore.workspace.documents[doc]?.['x-scalar-navigation'])
      .filter(isDefined) as TraversedEntry[]
  })

  const sidebarState = createSidebarState(entries)

  /**
   * Generates a unique string ID for an API location, based on the document, path, method, and example.
   * Filters out undefined values and serializes the composite array into a stable string.
   *
   * @param params - An object containing document, path, method, and optional example name.
   * @returns A stringified array representing the unique location identifier.
   *
   * Example:
   *   generateId({ document: 'mydoc', path: '/users', method: 'get', example: 'default' })
   *   // => '["mydoc","/users","get","default"]'
   */
  const generateId = ({
    document,
    path,
    method,
    example,
  }: {
    document: string
    path?: string
    method?: HttpMethod
    example?: string
  }) => {
    return JSON.stringify([document, path, method, example].filter(isDefined))
  }

  /**
   * Computed index for fast lookup of sidebar nodes by their unique API location.
   *
   * - Only indexes nodes of type 'document', 'operation', or 'example'.
   * - The lookup key is a serialized array of: [documentName, operationPath, operationMethod, exampleName?].
   * - Supports precise resolution of sidebar entries given an API "location".
   */
  const locationIndex = computed(() =>
    generateReverseIndex({
      items: entries.value,
      nestedKey: 'children',
      filter: (node) => node.type === 'document' || node.type === 'operation' || node.type === 'example',
      getId: (node) => {
        const document = getParentEntry('document', node)
        const operation = getParentEntry('operation', node)
        return generateId({
          document: document?.name ?? '',
          path: operation?.path,
          method: operation?.method,
          example: node.type === 'example' ? node.name : undefined,
        })
      },
    }),
  )

  /**
   * Looks up a sidebar entry by its unique API location.
   * - First tries to find an entry matching all provided properties (including example).
   * - If not found, falls back to matching only the operation (ignores example field).
   * This allows resolving either examples, operations, or documents as appropriate.
   *
   * @param location - Object specifying the document name, path, method, and optional example name.
   * @returns The matching sidebar entry, or undefined if none found.
   *
   * Example:
   *   const entry = getEntryByLocation({
   *     document: 'pets',
   *     path: '/pets',
   *     method: 'get',
   *     example: 'default',
   *   })
   */
  const getEntryByLocation: GetEntryByLocation = (location) => {
    // Try to find an entry with the most-specific location (including example)
    const entryWithExample = locationIndex.value.get(generateId(location))

    if (entryWithExample) {
      return entryWithExample
    }

    // Fallback to the operation (ignoring example) if an example wasn't found or specified
    return locationIndex.value.get(
      generateId({
        document: location.document,
        path: location.path,
        method: location.method,
      }),
    )
  }

  /**
   * Handles item selection from the sidebar and routes navigation accordingly.
   *
   * Example:
   *   handleSelectItem('id-of-entry')
   */
  const handleSelectItem = (id: string) => {
    const entry = sidebarState.getEntryById(id)

    if (!entry) {
      console.warn(`Could not find sidebar entry with id ${id} to select`)
      return
    }

    /** Close sidebar and navigate. Used for every branch that performs navigation. */
    const navigate = (route: RouteLocationRaw) => {
      isSidebarOpen.value = false
      return router.push(route)
    }

    // Navigate to the document overview page
    if (entry.type === 'document') {
      // If we are already in the document, just toggle expansion
      if (sidebarState.selectedItem.value === id) {
        sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
        return
      }

      // Otherwise, select it
      sidebarState.setSelected(id)
      sidebarState.setExpanded(id, true)
      return navigate({
        name: 'document.overview',
        params: { documentSlug: entry.name },
      })
    }

    // Navigate to the example page
    if (entry.type === 'operation') {
      // If we are already in an operation child we just want to toggle the explanstion
      if (sidebarState.isSelected(id) && sidebarState.selectedItem.value !== id) {
        sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
        return
      }

      // Otherwise, select the first example
      const firstExample = entry.children?.find((child) => child.type === 'example')

      if (firstExample) {
        sidebarState.setSelected(firstExample.id)
        sidebarState.setExpanded(firstExample.id, true)
      } else {
        sidebarState.setSelected(id)
      }

      return navigate({
        name: 'example',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
          pathEncoded: encodeURIComponent(entry.path),
          method: entry.method,
          exampleName: firstExample?.name ?? 'default',
        },
      })
    }

    // Navigate to the example page
    if (entry.type === 'example') {
      sidebarState.setSelected(id)
      const operation = getParentEntry('operation', entry)
      return navigate({
        name: 'example',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
          pathEncoded: encodeURIComponent(operation?.path ?? ''),
          method: operation?.method,
          exampleName: entry.name,
        },
      })
    }

    if (entry.type === 'text') {
      return navigate({
        name: 'document.overview',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
        },
      })
    }

    sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
    return
  }

  /**
   * Navigates to the currently active tab's path using the router.
   * Returns early if the workspace store or active tab is unavailable.
   */
  const navigateToCurrentTab = async (): Promise<void> => {
    if (!store.value) {
      return
    }

    const activeTabIndex = store.value.workspace['x-scalar-active-tab'] ?? 0
    const activeTab = store.value.workspace['x-scalar-tabs']?.[activeTabIndex]
    if (!activeTab) {
      return
    }

    await router.replace(activeTab.path)
  }

  /**
   * Rebuilds the sidebar for the given document.
   * This is used to refresh the sidebar state after structural changes (e.g. after adding or removing items).
   *
   * @param documentName - The name (id) of the document for which to rebuild the sidebar
   */
  const rebuildSidebar = (documentName: string | undefined) => {
    if (documentName) {
      store.value?.buildSidebar(documentName)
    }
  }

  /**
   * Ensures the sidebar is refreshed after a new example is created.
   *
   * If the sidebar entry for the new example does not exist or is of a different type,
   * this will rebuild the sidebar for the current document. This helps keep the sidebar state
   * consistent (e.g., after adding a new example via the UI).
   */
  const refreshSidebarAfterExampleCreation = (payload: OperationExampleMeta & { documentName?: string }) => {
    const documentName = payload.documentName ?? activeDocument.value?.['x-scalar-navigation']?.name
    if (!documentName) {
      return
    }

    const entry = getEntryByLocation({
      document: documentName,
      path: payload.path,
      method: payload.method,
      example: payload.exampleKey,
    })

    if (!entry || entry.type !== 'example') {
      // Sidebar entry for this example doesn't exist, so rebuild sidebar for consistency.
      rebuildSidebar(documentName)
      if (currentRoute.value) {
        syncSidebar(currentRoute.value)
      }
    }
    return
  }

  /** Width of the sidebar, with fallback to default. */
  const sidebarWidth = computed(() => store.value?.workspace?.['x-scalar-sidebar-width'] ?? DEFAULT_SIDEBAR_WIDTH)

  /** Handler for sidebar width changes. */
  const handleSidebarWidthUpdate = (width: number) => store.value?.update('x-scalar-sidebar-width', width)

  /** Controls the visibility of the sidebar. */
  const isSidebarOpen = ref(false)
  // ---------------------------------------------------------------------------
  // Tab Management

  /** Constants for workspace store keys */
  const TABS_KEY = 'x-scalar-tabs' as const
  const ACTIVE_TAB_KEY = 'x-scalar-active-tab' as const

  /**
   * Creates a tab object based on the current route and workspace state.
   * Used as a fallback when no tabs exist or when creating new tabs.
   */
  const createTabFromRoute = (to: RouteLocationNormalizedGeneric | null): Tab => {
    const method = getRouteParam('method', to)
    const path = getRouteParam('pathEncoded', to)
    const document = getRouteParam('documentSlug', to)
    const workspace = getRouteParam('workspaceSlug', to)
    return {
      ...getTabDetails({
        workspace,
        document,
        path,
        method,
        getEntryByLocation,
      }),
      path: currentRoute.value?.path ?? '',
    }
  }

  const tabs = computed(() => {
    return store.value?.workspace[TABS_KEY] ?? [createTabFromRoute(currentRoute.value)]
  })

  const activeTabIndex = computed(() => {
    return store.value?.workspace[ACTIVE_TAB_KEY] ?? 0
  })

  /**
   * Copies the URL of the tab at the given index to the clipboard.
   * Constructs the full URL using the current origin and the tab path.
   *
   * Note: Will silently fail if clipboard API is unavailable or the tab does not exist.
   */
  const copyTabUrl = async (index: number): Promise<void> => {
    const tab = tabs.value[index]

    if (!tab) {
      console.warn(`Cannot copy URL: tab at index ${index} does not exist`)
      return
    }

    const url = `${window.location.origin}${tab.path}`

    try {
      await navigator.clipboard.writeText(url)
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error)
    }
  }

  // ---------------------------------------------------------------------------
  // Path syncing

  /** When the route changes we need to update the active entities in the store */
  const handleRouteChange = (to: RouteLocationNormalizedGeneric) => {
    const slug = getRouteParam('workspaceSlug', to)
    const document = getRouteParam('documentSlug', to)
    const nextTeamSlug = getRouteParam('teamSlug', to)

    // Must have an active workspace to syncs
    if (!nextTeamSlug || !slug) {
      return
    }

    // Try to see if the user can load this workspace based on the team slug.
    const workspace = workspaces.value.find(
      (workspace) => workspace.slug === slug && workspace.teamSlug === nextTeamSlug,
    )

    // If the workspace exists but is not accessible by the current team, redirect to the default workspace.
    if (workspace && !canLoadWorkspace(workspace.teamSlug, teamSlug.value)) {
      return navigateToWorkspace('local', 'default')
    }

    routeTeamSlug.value = nextTeamSlug
    workspaceSlug.value = slug
    documentSlug.value = document
    method.value = getRouteParam('method', to)
    path.value = getRouteParam('pathEncoded', to)
    exampleName.value = getRouteParam('exampleName', to)

    // Save the current path to the persistence storage
    if (to.path !== '') {
      workspaceStorage.setCurrentPath(to.path)
    }

    if (getWorkspaceId(nextTeamSlug, slug) !== activeWorkspace.value?.id) {
      // If the user is navigating into their team context but the team
      // workspace does not exist yet (e.g. they clicked the picker placeholder
      // or are being redirected on login), create it on demand before letting
      // the workspace switcher take over. Otherwise `changeWorkspace` would
      // fall back to the local default and silently swallow the navigation.
      const isUnknownTeamWorkspace =
        nextTeamSlug !== 'local' && nextTeamSlug === teamSlug.value && !workspace
      if (isUnknownTeamWorkspace) {
        return createWorkspace({
          teamSlug: nextTeamSlug,
          slug,
          name: DEFAULT_TEAM_WORKSPACE_NAME,
        })
      }
      return changeWorkspace(nextTeamSlug, slug, to)
    }

    // Update the active document if the document slug has changes
    if (document && document !== store.value?.workspace[extensions.workspace.activeDocument]) {
      store?.value?.update('x-scalar-active-document', document)
    }

    syncTabs(to)
    syncSidebar(to)
    return
  }

  /** Aligns the tabs with any potential slug changes */
  const syncTabs = (to: RouteLocationNormalizedGeneric) => {
    const tabs = store.value?.workspace['x-scalar-tabs'] ?? []
    const index = store.value?.workspace['x-scalar-active-tab'] ?? 0

    const tab = tabs[index]

    // If there is no tab or the tab path is the same we leave the tab state alone
    if (!tab || tab.path === to.path) {
      // Already on the correct path, do nothing
      return
    }

    // Otherwise we replace the tab content with the new route
    tabs[index] = createTabFromRoute(to)
  }

  /** Aligns the sidebar state with any potential slug changes */
  const syncSidebar = (to: RouteLocationNormalizedGeneric) => {
    const document = getRouteParam('documentSlug', to)

    if (!document) {
      // Reset selection if no document is selected
      sidebarState.setSelected(null)
      return
    }

    const entry = getEntryByLocation({
      document,
      path: getRouteParam('pathEncoded', to),
      method: getRouteParam('method', to),
      example: getRouteParam('exampleName', to),
    })

    if (entry) {
      sidebarState.setSelected(entry.id)
      sidebarState.setExpanded(entry.id, true)
    }
  }

  // ---------------------------------------------------------------------------
  // Events handling

  initializeAppEventHandlers({
    eventBus,
    router,
    store,
    navigateToCurrentTab,
    rebuildSidebar,
    onAfterExampleCreation: refreshSidebarAfterExampleCreation,
    onSelectSidebarItem: handleSelectItem,
    onCopyTabUrl: (index) => copyTabUrl(index),
    onToggleSidebar: () => (isSidebarOpen.value = !isSidebarOpen.value),
    closeSidebar: () => (isSidebarOpen.value = false),
    renameWorkspace,
  })

  const theme = useTheme({
    fallbackThemeSlug,
    customThemes,
    store: store,
  })

  const isDarkMode = computed(() => {
    const colorMode = store.value?.workspace['x-scalar-color-mode'] ?? 'system'
    if (colorMode === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
    }
    return colorMode === 'dark'
  })

  return {
    /** Active workspace store */
    store,
    sidebar: {
      state: sidebarState,
      width: sidebarWidth,
      isOpen: isSidebarOpen,
      handleSelectItem,
      handleSidebarWidthUpdate,
      getEntryByLocation,
    },
    tabs: {
      state: tabs,
      activeTabIndex,
      copyTabUrl,
    },
    workspace: {
      create: createWorkspace,
      workspaceList: workspaces,
      filteredWorkspaceList: filteredWorkspaces,
      workspaceGroups,
      activeWorkspace,
      navigateToWorkspace,
      isOpen: computed(() => Boolean(workspaceSlug.value && !documentSlug.value)),
    },
    eventBus,
    router,
    currentRoute,
    loading: isSyncingWorkspace,
    activeEntities: {
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
      teamSlug: readonly(teamSlug),
      setTeamSlug,
    },
    environment,
    document: activeDocument,
    isDarkMode,
    theme: {
      styles: theme.themeStyles,
      themeStyleTag: theme.themeStyleTag,
      customThemes,
    },
    telemetry,
    options,
  }
}
