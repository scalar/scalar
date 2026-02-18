import type { ScalarListboxOption, WorkspaceGroup } from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { sortByOrder } from '@scalar/helpers/array/sort-by-order'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { migrateLocalStorageToIndexDb } from '@scalar/oas-utils/migrations'
import { createSidebarState, generateReverseIndex } from '@scalar/sidebar'
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
import type { Workspace, WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace/x-scalar-tabs'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { type ComputedRef, type Ref, type ShallowRef, computed, ref, shallowRef } from 'vue'
import type { NavigationFailure, RouteLocationNormalizedGeneric, Router } from 'vue-router'

import { getRouteParam } from '@/v2/features/app/helpers/get-route-param'
import { groupWorkspacesByTeam } from '@/v2/features/app/helpers/group-workspaces'
import { getActiveEnvironment } from '@/v2/helpers/get-active-environment'
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

type WorkspaceOption = ScalarListboxOption & { teamUid: string; namespace: string; slug: string }

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
    state: ComputedRef<Tab[]>
    /** The active tab index */
    activeTabIndex: ComputedRef<number>
    /** Copies the URL of the tab at the given index to the clipboard */
    copyTabUrl: (index: number) => Promise<void>
  }
  /** The workspace management */
  workspace: {
    /** Creates a new workspace and navigates to it */
    create: (payload: {
      teamUid?: string
      namespace?: string
      slug?: string
      name: string
    }) => Promise<{ name: string; namespace: string; slug: string; teamUid: string } | undefined>
    /** All workspace list */
    workspaceList: Ref<WorkspaceOption[]>
    /** Filtered workspace list, based on the current teamUid */
    filteredWorkspaceList: ComputedRef<WorkspaceOption[]>
    /**
     * Groups workspaces into team and local categories for display in the workspace picker.
     * Team workspaces are shown first (when not on local team), followed by local workspaces.
     */
    workspaceGroups: ComputedRef<WorkspaceGroup[]>
    /** The currently active workspace */
    activeWorkspace: ShallowRef<{ id: string; label: string } | null>
    /** Navigates to the specified workspace */
    navigateToWorkspace: (namespace?: string, slug?: string) => Promise<void | NavigationFailure | undefined>
    /** Whether the workspace page is open */
    isOpen: ComputedRef<boolean>
  }
  /** The workspace event bus for handling workspace-level events */
  eventBus: WorkspaceEventBus
  /** The router instance */
  router: Router
  /** The current route derived from the router */
  currentRoute: ComputedRef<RouteLocationNormalizedGeneric | null>
  /** Whether the workspace is currently syncing */
  loading: Ref<boolean>
  /** The currently active entities */
  activeEntities: {
    /** The namespace of the current entity, e.g. "default" or a custom namespace */
    namespace: Ref<string | undefined>
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
    /** The unique identifier for the selected team context */
    teamUid: Ref<string>
  }
  /** The currently active environment */
  environment: ComputedRef<XScalarEnvironment>
  /** The currently active document */
  document: ComputedRef<WorkspaceDocument | null>
  /** Whether the current color mode is dark */
  isDarkMode: ComputedRef<boolean>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default debounce delay in milliseconds for workspace store persistence. */
const DEFAULT_DEBOUNCE_DELAY = 1000

/** Default sidebar width in pixels. */
const DEFAULT_SIDEBAR_WIDTH = 288

/** Workspace store extension key for persisted tabs. */
const TABS_KEY = 'x-scalar-tabs' as const

/** Workspace store extension key for the active tab index. */
const ACTIVE_TAB_KEY = 'x-scalar-active-tab' as const

// ---------------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------------

export const createAppState = async ({
  router,
  fileLoader,
}: {
  router: Router
  fileLoader?: LoaderPlugin
}): Promise<AppState> => {
  /** Workspace event bus for handling workspace-level events. */
  const eventBus = createWorkspaceEventBus({
    debug: import.meta.env.DEV,
  })

  const { workspace: persistence } = await createWorkspaceStorePersistence()

  /**
   * Run migration from localStorage to IndexedDB if needed.
   * This happens once per user and transforms old data to the new workspace format.
   */
  await migrateLocalStorageToIndexDb()

  // ---------------------------------------------------------------------------
  // Route and active entity state

  const currentRoute = computed(() => router.currentRoute.value ?? null)

  const teamUid = ref<string>('local')
  const namespace = ref<string | undefined>(undefined)
  const workspaceSlug = ref<string | undefined>(undefined)
  const documentSlug = ref<string | undefined>(undefined)
  const method = ref<HttpMethod | undefined>(undefined)
  const path = ref<string | undefined>(undefined)
  const exampleName = ref<string | undefined>(undefined)

  // ---------------------------------------------------------------------------
  // Workspace state

  const isSyncingWorkspace = ref(false)
  const activeWorkspace = shallowRef<{ id: string; label: string } | null>(null)
  const workspaces = ref<WorkspaceOption[]>([])
  const store = shallowRef<WorkspaceStore | null>(null)

  const filteredWorkspaces = computed(() => filterWorkspacesByTeam(workspaces.value, teamUid.value))
  const workspaceGroups = computed(() => groupWorkspacesByTeam(filteredWorkspaces.value, teamUid.value))

  const activeDocument = computed(() => store.value?.workspace.documents[documentSlug.value ?? ''] ?? null)

  /**
   * Merged environment variables from workspace and document levels.
   * Document-level variables take precedence over workspace-level ones.
   */
  const environment = computed<XScalarEnvironment>(() => getActiveEnvironment(store.value, activeDocument.value))

  workspaces.value = await persistence.getAll().then((all) =>
    all.map(({ teamUid, namespace, slug, name }) => ({
      id: getWorkspaceId(namespace, slug),
      teamUid,
      namespace,
      slug,
      label: name,
    })),
  )

  // ---------------------------------------------------------------------------
  // Workspace loading and creation

  /**
   * Creates a client-side workspace store with persistence enabled for the given workspace.
   */
  const createClientStore = async ({ namespace, slug }: { namespace: string; slug: string }): Promise<WorkspaceStore> =>
    createWorkspaceStore({
      plugins: [
        await persistencePlugin({
          workspaceId: getWorkspaceId(namespace, slug),
          debounceDelay: DEFAULT_DEBOUNCE_DELAY,
        }),
      ],
      fileLoader,
    })

  /**
   * Attempts to load and activate a workspace by namespace and slug.
   * Returns a discriminated union indicating success or failure.
   */
  const loadWorkspace = async (
    namespace: string,
    slug: string,
  ): Promise<{ success: true; workspace: Workspace } | { success: false }> => {
    const persisted = await persistence.getItem({ namespace, slug })
    if (!persisted) {
      return { success: false }
    }

    const client = await createClientStore({ namespace, slug })
    client.loadWorkspace(persisted.workspace)
    activeWorkspace.value = { id: getWorkspaceId(persisted.namespace, persisted.slug), label: persisted.name }
    store.value = client

    return { success: true, workspace: client.workspace }
  }

  /**
   * Creates a workspace with a default "drafts" document and persists it to storage.
   * Also appends the new workspace to the in-memory workspace list.
   */
  const createAndPersistWorkspace = async ({
    name,
    teamUid,
    namespace,
    slug,
  }: {
    name: string
    teamUid?: string
    namespace?: string
    slug: string
  }) => {
    const draftStore = createWorkspaceStore()
    await draftStore.addDocument({
      name: 'drafts',
      document: {
        openapi: '3.1.0',
        info: { title: 'Drafts', version: '1.0.0' },
        paths: { '/': { get: {} } },
        'x-scalar-original-document-hash': 'drafts',
        'x-scalar-icon': 'interface-edit-tool-pencil',
      },
    })

    const workspace = await persistence.setItem(
      { namespace, slug },
      { name, teamUid, workspace: draftStore.exportWorkspace() },
    )

    workspaces.value.push({
      id: getWorkspaceId(workspace.namespace, workspace.slug),
      teamUid: workspace.teamUid,
      namespace: workspace.namespace,
      slug: workspace.slug,
      label: workspace.name,
    })

    return workspace
  }

  /**
   * Navigates to the overview page of the specified workspace.
   */
  const navigateToWorkspace = async (
    namespace?: string,
    slug?: string,
  ): Promise<void | NavigationFailure | undefined> => {
    // Hit the default route
    if (!namespace || !slug) {
      return await router.push('/')
    }

    // Workspace was not loaded
    if (!store.value) {
      console.error(
        'No store value, navigating to default route. You must ensure you load the workspace before navigating to it.',
      )
      return await router.push('/')
    }

    const document = store.value?.workspace.documents.drafts ?? Object.values(store.value?.workspace.documents ?? {})[0]
    const documentSlug = document?.['x-scalar-navigation']?.name ?? 'drafts'
    const path = Object.keys(document?.paths ?? {})[0] ?? '/'
    const method = Object.keys(document?.paths?.[path] ?? {}).filter(isHttpMethod)[0]

    // If no method we go to the document overview page
    if (!method) {
      return await router.push({
        name: 'document.overview',
        params: {
          documentSlug,
        },
      })
    }

    // Otherwise we go to the example page
    return await router.push({
      name: 'example',
      params: {
        namespace,
        workspaceSlug: slug,
        documentSlug,
        pathEncoded: encodeURIComponent(path),
        method: method,
        exampleName: 'default',
      },
    })
  }

  /**
   * Creates a new workspace:
   * - Generates a unique slug (uses provided slug if unique, otherwise derives one from the name).
   * - Adds a default "drafts" document.
   * - Persists and navigates to the new workspace.
   *
   * Example usage:
   *   await createWorkspace({ name: 'My Awesome API' })
   *   // -> Navigates to /workspace/my-awesome-api (if available)
   */
  const createWorkspace = async ({
    teamUid,
    namespace,
    slug,
    name,
  }: {
    teamUid?: string
    namespace?: string
    slug?: string
    name: string
  }) => {
    // Clear the current store to show the loading state immediately.
    store.value = null

    const newSlug = await generateUniqueValue({
      defaultValue: slug ?? name,
      validation: async (value) => !(await persistence.has({ namespace: namespace ?? 'local', slug: value })),
      maxRetries: 100,
      transformation: slugify,
    })

    if (!newSlug) {
      console.error('Failed to generate a unique workspace slug')
      return undefined
    }

    const created = await createAndPersistWorkspace({ teamUid, namespace, slug: newSlug, name })
    if (!created) {
      console.error('Failed to create the workspace, something went wrong, can not load the workspace')
      return undefined
    }

    const loaded = await loadWorkspace(created.namespace, created.slug)
    if (!loaded.success) {
      console.error('Failed to load the newly created workspace, something went wrong, can not load the workspace')
      return undefined
    }

    await navigateToWorkspace(created.namespace, created.slug)
    return created
  }

  /**
   * Handles changing the active workspace when the workspace identifier changes in the route.
   * - Clears the current store and shows a loading state.
   * - On success: restores the previously active tab or initializes a fresh one.
   * - On failure: redirects to an existing workspace, or bootstraps a new default one.
   */
  const changeWorkspace = async (namespace: string, slug: string) => {
    store.value = null
    isSyncingWorkspace.value = true

    const result = await loadWorkspace(namespace, slug)

    if (result.success) {
      const { workspace } = result
      const tabIndex = workspace[ACTIVE_TAB_KEY] ?? 0
      const savedTabs = workspace[TABS_KEY]
      const activeTab = savedTabs?.[tabIndex]

      if (activeTab) {
        // Preserve query parameters (e.g. environment) when restoring the tab
        await router.replace({ path: activeTab.path, query: currentRoute.value?.query ?? {} })
      }

      // Heal an out-of-bounds tab index
      if (savedTabs && tabIndex >= savedTabs.length) {
        eventBus.emit('tabs:update:tabs', { [ACTIVE_TAB_KEY]: 0 })
      }

      // Bootstrap tabs when none are persisted yet
      if (!savedTabs) {
        eventBus.emit('tabs:update:tabs', {
          [TABS_KEY]: [createTabFromRoute(currentRoute.value)],
          [ACTIVE_TAB_KEY]: 0,
        })
      }

      isSyncingWorkspace.value = false
      return
    }

    // Workspace not found - redirect to the first accessible workspace
    const fallback =
      filteredWorkspaces.value.find((w) => w.teamUid === 'local' && w.slug === 'default') ?? filteredWorkspaces.value[0]

    if (fallback) {
      // Leave isSyncingWorkspace true - the navigation will trigger changeWorkspace again
      return navigateToWorkspace(fallback.namespace, fallback.slug)
    }

    // No workspaces exist yet - bootstrap with a default one
    const created = await createWorkspace({ name: 'Default Workspace', slug: 'default' })

    isSyncingWorkspace.value = false

    if (!created) {
      console.error('Failed to create the default workspace, something went wrong, can not load the workspace')
      return
    }

    sidebarState.reset()
  }

  // ---------------------------------------------------------------------------
  // Sidebar

  const entries = computed<TraversedEntry[]>(() => {
    const activeStore = store.value
    if (!activeStore) {
      return []
    }

    const docKeys = Object.keys(activeStore.workspace.documents)
    const order = activeStore.workspace['x-scalar-order'] ?? docKeys

    return sortByOrder(docKeys, order, (item) => item)
      .map((doc) => activeStore.workspace.documents[doc]?.['x-scalar-navigation'])
      .filter(isDefined) as TraversedEntry[]
  })

  const sidebarState = createSidebarState(entries)

  /**
   * Generates a stable lookup key from an API location.
   * Undefined segments are filtered out to keep keys as short as possible.
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
  }) => JSON.stringify([document, path, method, example].filter(isDefined))

  /**
   * Computed reverse index mapping location keys to sidebar entries.
   * Only indexes document, operation, and example nodes for precise lookups.
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
   * Looks up a sidebar entry by its API location.
   * First tries an exact match (including example), then falls back to the operation level.
   * This allows resolving examples, operations, or documents as appropriate.
   */
  const getEntryByLocation: GetEntryByLocation = (location) =>
    locationIndex.value.get(generateId(location)) ??
    locationIndex.value.get(generateId({ document: location.document, path: location.path, method: location.method }))

  /**
   * Handles sidebar item selection and routes to the corresponding page.
   */
  const handleSelectItem = (id: string) => {
    const entry = sidebarState.getEntryById(id)

    if (!entry) {
      console.warn(`Could not find sidebar entry with id ${id} to select`)
      return
    }

    if (entry.type === 'document') {
      // If already selected, toggle expansion instead of re-navigating
      if (sidebarState.selectedItem.value === id) {
        sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
        return
      }

      sidebarState.setSelected(id)
      sidebarState.setExpanded(id, true)
      void router.push({ name: 'document.overview', params: { documentSlug: entry.name } })
      return
    }

    // TODO: temporary until we have the operation overview page
    if (entry.type === 'operation') {
      // If already selected, toggle expansion instead of re-navigating
      if (sidebarState.isSelected(id)) {
        sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
        return
      }

      const firstExample = entry.children?.find((child) => child.type === 'example')

      if (firstExample) {
        sidebarState.setSelected(firstExample.id)
        sidebarState.setExpanded(firstExample.id, true)
      } else {
        sidebarState.setSelected(id)
      }

      void router.push({
        name: 'example',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
          pathEncoded: encodeURIComponent(entry.path),
          method: entry.method,
          exampleName: firstExample?.name ?? 'default',
        },
      })
      return
    }

    if (entry.type === 'example') {
      sidebarState.setSelected(id)
      const operation = getParentEntry('operation', entry)
      void router.push({
        name: 'example',
        params: {
          documentSlug: getParentEntry('document', entry)?.name,
          pathEncoded: encodeURIComponent(operation?.path ?? ''),
          method: operation?.method,
          exampleName: entry.name,
        },
      })
      return
    }

    if (entry.type === 'text') {
      void router.push({
        name: 'document.overview',
        params: { documentSlug: getParentEntry('document', entry)?.name },
      })
      return
    }

    sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
  }

  /** Width of the sidebar, with fallback to default. */
  const sidebarWidth = computed(() => store.value?.workspace?.['x-scalar-sidebar-width'] ?? DEFAULT_SIDEBAR_WIDTH)

  /** Updates the persisted sidebar width. */
  const handleSidebarWidthUpdate = (width: number) => store.value?.update('x-scalar-sidebar-width', width)

  const isSidebarOpen = ref(true)

  // ---------------------------------------------------------------------------
  // Tabs

  /**
   * Creates a tab from the given route. Used when no saved tab state exists or
   * when the active tab's path needs to be updated after a navigation.
   */
  const createTabFromRoute = (to: RouteLocationNormalizedGeneric | null): Tab => ({
    ...getTabDetails({
      workspace: getRouteParam('workspaceSlug', to),
      document: getRouteParam('documentSlug', to),
      path: getRouteParam('pathEncoded', to),
      method: getRouteParam('method', to),
      getEntryByLocation,
    }),
    path: to?.path ?? '',
  })

  const tabs = computed(() => store.value?.workspace[TABS_KEY] ?? [createTabFromRoute(currentRoute.value)])
  const activeTabIndex = computed(() => store.value?.workspace[ACTIVE_TAB_KEY] ?? 0)

  /**
   * Copies the full URL of the tab at the given index to the clipboard.
   * Constructs the URL using the current origin and the tab path.
   */
  const copyTabUrl = async (index: number): Promise<void> => {
    const tab = tabs.value[index]

    if (!tab) {
      console.warn(`Cannot copy URL: tab at index ${index} does not exist`)
      return
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${tab.path}`)
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error)
    }
  }

  // ---------------------------------------------------------------------------
  // Route syncing

  /**
   * Navigates to the currently active tab's path.
   * Skips navigation when on the document redirect route to avoid redirect loops.
   */
  const navigateToCurrentTab = async (): Promise<void> => {
    if (!store.value) {
      return
    }

    const tabIndex = store.value.workspace[ACTIVE_TAB_KEY] ?? 0
    const activeTab = store.value.workspace[TABS_KEY]?.[tabIndex]

    if (activeTab) {
      await router.replace(activeTab.path)
    }
  }

  /**
   * Triggers a sidebar rebuild for the given document.
   * Used after structural changes like adding or removing items.
   */
  const rebuildSidebar = (documentName: string | undefined) => {
    if (documentName) {
      store.value?.buildSidebar(documentName)
    }
  }

  /**
   * Ensures the sidebar is up to date after a new example is created.
   * If the sidebar entry for the example does not exist yet, rebuilds the sidebar.
   */
  const refreshSidebarAfterExampleCreation = (payload: OperationExampleMeta) => {
    const documentName = activeDocument.value?.['x-scalar-navigation']?.name
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
      rebuildSidebar(documentName)
      if (currentRoute.value) {
        syncSidebar(currentRoute.value)
      }
    }
  }

  /**
   * Syncs the active tab's metadata with the current route.
   * Mutates the tab in-place since the workspace store array is already reactive
   * and a full update event would be overly expensive for a path-only change.
   */
  const syncTabs = (to: RouteLocationNormalizedGeneric) => {
    const currentTabs = store.value?.workspace[TABS_KEY] ?? []
    const index = store.value?.workspace[ACTIVE_TAB_KEY] ?? 0
    const tab = currentTabs[index]

    if (!tab || tab.path === to.path) {
      return
    }

    currentTabs[index] = createTabFromRoute(to)
  }

  /** Syncs the sidebar selection state with the current route. */
  const syncSidebar = (to: RouteLocationNormalizedGeneric) => {
    const document = getRouteParam('documentSlug', to)

    if (!document) {
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

  /**
   * Central handler for route changes. Responsible for:
   * - Updating active entity refs from route params.
   * - Triggering a workspace switch when the workspace identifier changes.
   * - Syncing the active document, tabs, and sidebar for same-workspace navigations.
   */
  const handleRouteChange = async (to: RouteLocationNormalizedGeneric) => {
    const slug = getRouteParam('workspaceSlug', to)
    const document = getRouteParam('documentSlug', to)
    const namespaceValue = getRouteParam('namespace', to)

    if (!namespaceValue || !slug) {
      return
    }

    const matchedWorkspace = workspaces.value.find((w) => w.slug === slug && w.namespace === namespaceValue)

    // Redirect away if the user cannot access this workspace (e.g. wrong team context)
    if (matchedWorkspace && !canLoadWorkspace(matchedWorkspace.teamUid, teamUid.value)) {
      await navigateToWorkspace('local', 'default')
      return
    }

    namespace.value = namespaceValue
    workspaceSlug.value = slug
    documentSlug.value = document
    method.value = getRouteParam('method', to)
    path.value = getRouteParam('pathEncoded', to)
    exampleName.value = getRouteParam('exampleName', to)

    if (to.path !== '') {
      workspaceStorage.setCurrentPath(to.path)
    }

    if (getWorkspaceId(namespace.value, slug) !== activeWorkspace.value?.id) {
      await changeWorkspace(namespace.value, slug)
      return
    }

    if (document && document !== store.value?.workspace[extensions.workspace.activeDocument]) {
      store.value?.update('x-scalar-active-document', document)
    }

    syncTabs(to)
    syncSidebar(to)
  }

  router.afterEach((to) => handleRouteChange(to))

  // ---------------------------------------------------------------------------
  // Events

  initializeAppEventHandlers({
    eventBus,
    router,
    store,
    navigateToCurrentTab,
    rebuildSidebar,
    onAfterExampleCreation: refreshSidebarAfterExampleCreation,
    onSelectSidebarItem: handleSelectItem,
    onCopyTabUrl: copyTabUrl,
    onToggleSidebar: () => (isSidebarOpen.value = !isSidebarOpen.value),
  })

  // ---------------------------------------------------------------------------
  // Dark mode

  const isDarkMode = computed(() => {
    const colorMode = store.value?.workspace['x-scalar-color-mode'] ?? 'system'
    if (colorMode === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
    }
    return colorMode === 'dark'
  })

  // ---------------------------------------------------------------------------
  // Return

  return {
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
      namespace,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
      teamUid,
    },
    environment,
    document: activeDocument,
    isDarkMode,
  }
}
