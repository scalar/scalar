import type { ScalarListboxOption } from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { sortByOrder } from '@scalar/helpers/array/sort-by-order'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { slugify } from '@scalar/helpers/string/slugify'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { migrateLocalStorageToIndexDb } from '@scalar/oas-utils/migrations'
import { createSidebarState, generateReverseIndex, getChildEntry } from '@scalar/sidebar'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import {
  type OperationExampleMeta,
  type WorkspaceEventBus,
  createWorkspaceEventBus,
} from '@scalar/workspace-store/events'
import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import { createWorkspaceStorePersistence, generateWorkspaceUid } from '@scalar/workspace-store/persistence'
import { persistencePlugin } from '@scalar/workspace-store/plugins/client'
import { getActiveEnvironment } from '@scalar/workspace-store/request-example'
import type { Workspace, WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace/x-scalar-tabs'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { type ComputedRef, type Ref, type ShallowRef, computed, ref, shallowRef, watch } from 'vue'
import type { RouteLocationNormalizedGeneric, RouteLocationRaw, Router } from 'vue-router'

import type { ApiClientAppOptions } from '@/features/app/helpers/create-api-client-app'
import { getRouteParam } from '@/features/app/helpers/get-route-param'
import { getTabDetails } from '@/helpers/get-tab-details'
import { workspaceStorage } from '@/helpers/storage'

import { initializeAppEventHandlers } from './app-events'
import { canLoadWorkspace } from './helpers/filter-workspaces'
import { getPlaceholderWorkspaceId, parsePlaceholderWorkspaceId } from './helpers/placeholder-workspace-id'

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

/**
 * Picker / route shape for a single workspace.
 *
 * `id` always equals `workspaceUid`: that is the stable identifier the
 * runtime uses to load chunks, persist updates, and match the active
 * workspace. `teamUid` is the source of truth for team membership.
 *
 * `teamSlug` and `slug` come along as URL metadata only — they drive
 * `/@<teamSlug>/<workspaceSlug>` and can change without the workspace
 * itself changing. Never key persistence or active-workspace lookups
 * off the slug pair.
 */
type WorkspaceOption = ScalarListboxOption & {
  workspaceUid: string
  teamUid: string
  teamSlug: string
  slug: string
}

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
    /**
     * Creates a new workspace and navigates to it. `teamSlug` / `slug`
     * are URL metadata for the new record; `teamUid` is the canonical
     * team identifier and defaults to `'local'`.
     */
    create: (payload: {
      teamUid?: string
      teamSlug?: string
      slug?: string
      name: string
    }) => Promise<{ workspaceUid: string; teamUid: string; teamSlug: string; slug: string; name: string } | undefined>
    /** All workspace list */
    workspaceList: Ref<WorkspaceOption[]>
    /**
     * Currently active workspace. `id` is the workspaceUid; `teamUid`
     * carries the canonical team identifier and `teamSlug` / `slug` are
     * the URL metadata for the active record.
     */
    activeWorkspace: ShallowRef<{
      id: string
      label: string
      workspaceUid: string
      teamUid: string
      teamSlug: string
      slug: string
    } | null>
    /** Navigates to the specified workspace using its URL slug pair. */
    navigateToWorkspace: (teamSlug?: string, slug?: string) => Promise<void>
    /**
     * Routes to the get-started page of a workspace identified by its
     * stable `workspaceUid`. The picker, breadcrumb, and header menu all
     * funnel through here so they stay in sync.
     *
     * Synthetic placeholder ids (see `getPlaceholderWorkspaceId`) are
     * accepted as well so the picker can offer a not-yet-persisted team
     * workspace and let the route handler create it on demand.
     */
    navigateToWorkspaceGetStarted: (workspaceId: string, activeTeamSlug: string) => void
    /**
     * Navigates to a workspace, restoring the last active tab if one
     * is stored. Falls back to the workspace's get-started page when
     * there is no prior session.
     *
     * Pass `{ workspaceUid }` to route to a specific workspace, or
     * `{ teamUid }` to route to the first workspace under that team
     * (creating one on demand when none exists yet). `teamSlug` is an
     * optional URL hint used only for the placeholder route when no
     * workspace exists yet for the given team.
     */
    resumeOrGetStarted: (
      options:
        | { workspaceUid: string; teamUid?: never; teamSlug?: never }
        | { workspaceUid?: never; teamUid: string; teamSlug: string },
    ) => Promise<void>
    /**
     * Reconciles the locally-known `teamSlug` for every workspace
     * belonging to `teamUid`. Updates the catalog row and strips stale
     * tab metadata. Safe to call repeatedly; a no-op when the local
     * record is already in sync.
     */
    reconcileTeamSlug: (teamUid: string, teamSlug: string) => Promise<void>
    /** Whether the workspace page is open */
    isOpen: ComputedRef<boolean>
    /**
     * Whether the currently active workspace is a team workspace (i.e. has a
     * `teamUid` other than `'local'`). Useful for gating team-only UI such as
     * the registry-backed document list and its loading state.
     */
    isTeamWorkspace: ComputedRef<boolean>
  }
  /** The workspace event bus for handling workspace-level events */
  eventBus: WorkspaceEventBus
  /** The router instance */
  router: Router
  /**
   * Fired on every route change. `teamSlug` is the current user's team
   * slug (used for `canLoadWorkspace`) and `teamUid` is the canonical
   * team identifier used to resolve workspaces when the URL's slug has
   * gone stale.
   */
  handleRouteChange: (
    to: RouteLocationNormalizedGeneric,
    metadata: {
      teamSlug: ComputedRef<string>
      teamUid: ComputedRef<string>
      filteredWorkspaces: ComputedRef<WorkspaceOption[]>
    },
  ) => Promise<void>
  /** The current route derived from the router */
  currentRoute: Ref<RouteLocationNormalizedGeneric | null>
  /**
   * Whether the shell should keep the splash screen up. True while the
   * workspace store is syncing or while the host is still resolving the
   * active team (see `createAppState`'s `isCurrentTeamLoading` argument).
   */
  loading: ComputedRef<boolean>
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
  }
  /** The currently active environment */
  environment: ComputedRef<XScalarEnvironment>
  /** The currently active document */
  document: ComputedRef<WorkspaceDocument | null>
  /** Whether the current color mode is dark */
  isDarkMode: ComputedRef<boolean>
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
/** Default display name for the local workspace when it is first created. */
const DEFAULT_LOCAL_WORKSPACE_NAME = 'Local workspace'
/** Default display name used when auto-creating a team workspace on demand. */
export const DEFAULT_TEAM_WORKSPACE_NAME = 'Team workspace'

// ---------------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------------
export const createAppState = async ({
  router,
  fileLoader,
  telemetryDefault,
  options,
}: {
  router: Router
  fileLoader?: LoaderPlugin
  telemetryDefault?: boolean
  /** Runtime behaviour overrides */
  options?: ApiClientAppOptions
}): Promise<AppState> => {
  /** Workspace event bus for handling workspace-level events. */
  const eventBus = createWorkspaceEventBus({
    debug: import.meta.env.DEV,
  })

  const { workspace: persistence, meta: metaPersistence } = await createWorkspaceStorePersistence()

  /**
   * Run migration from localStorage to IndexedDB if needed
   * This happens once per user and transforms old data structure to new workspace format
   */
  await migrateLocalStorageToIndexDb()

  // ---------------------------------------------------------------------------
  // Active entities
  // ---------------------------------------------------------------------------
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
  const currentRoute = computed(() => router.currentRoute.value ?? null)

  // ---------------------------------------------------------------------------
  // Workspace persistence state management
  /**
   * Active workspace pointer. `id` mirrors `workspaceUid` so consumers
   * built around `{ id, label }` keep working, while UID/teamUid/slugs
   * are surfaced explicitly for code that needs the canonical identity.
   */
  const activeWorkspace = shallowRef<{
    id: string
    label: string
    workspaceUid: string
    teamUid: string
    teamSlug: string
    slug: string
  } | null>(null)
  const workspaces = ref<WorkspaceOption[]>([])

  /**
   * `true` when the active workspace is backed by a team (i.e. its
   * `teamUid` is not the built-in `'local'` sentinel). Reads directly
   * off `activeWorkspace.teamUid` so it survives slug renames.
   */
  const isTeamWorkspace = computed(() => Boolean(activeWorkspace.value && activeWorkspace.value.teamUid !== 'local'))
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
    w.map(({ workspaceUid, teamUid, teamSlug, slug, name }) => ({
      id: workspaceUid,
      workspaceUid,
      teamUid,
      teamSlug,
      slug,
      label: name,
    })),
  )

  /**
   * Renames the currently active workspace.
   * Updates the workspace name in persistence and refreshes the cached
   * workspace list / active workspace pointer when the write succeeds.
   */
  const renameWorkspace = async (name: string) => {
    const active = activeWorkspace.value
    if (!active) {
      return
    }
    const updated = await persistence.updateName(active.workspaceUid, name)
    if (!updated) {
      return
    }

    workspaces.value = workspaces.value.map((workspace) =>
      workspace.workspaceUid === active.workspaceUid ? { ...workspace, label: name } : workspace,
    )
    activeWorkspace.value = { ...active, label: name }
  }

  /**
   * Creates a client-side workspace store with persistence enabled for
   * the given `workspaceUid`. The chunk tables are keyed by UID, so the
   * workspace survives any future slug rename without re-keying.
   */
  const createClientStore = async (workspaceUid: string): Promise<WorkspaceStore> => {
    return createWorkspaceStore({
      plugins: [
        await persistencePlugin({
          workspaceId: workspaceUid,
          debounceDelay: DEFAULT_DEBOUNCE_DELAY,
        }),
      ],
      fileLoader,
      fetch: options?.customFetch,
    })
  }

  /**
   * Activates a previously-loaded workspace record. Centralised so every
   * load path produces an identical `activeWorkspace` shape.
   */
  const setActiveWorkspaceFromRecord = (record: {
    workspaceUid: string
    teamUid: string
    teamSlug: string
    slug: string
    name: string
  }) => {
    activeWorkspace.value = {
      id: record.workspaceUid,
      workspaceUid: record.workspaceUid,
      teamUid: record.teamUid,
      teamSlug: record.teamSlug,
      slug: record.slug,
      label: record.name,
    }
  }

  /**
   * Reconciles every locally-known workspace belonging to `teamUid` with
   * the team slug the server is currently advertising.
   *
   * When a team rename happens on the server, the local catalog still
   * holds the old `teamSlug` value and the meta chunk still holds tab
   * paths built around `/@<old-slug>/...`. Both surfaces become land
   * mines: URL routing rejects the workspace via `canLoadWorkspace`, and
   * the persisted tabs push the router back to dead paths. This helper
   * heals both in one pass — we update the catalog row and strip the
   * stale tab fields from meta so the runtime can resume from a fresh
   * route on next load.
   *
   * `teamUid === 'local'` is a no-op so signed-out users do not have
   * their local workspaces accidentally rewritten.
   *
   * When another workspace already owns the target `[teamSlug, slug]`
   * pair, persistence skips that row — the in-memory catalog matches
   * only rows that actually moved.
   */
  const reconcileTeamSlug = async (teamUid: string, teamSlug: string): Promise<void> => {
    if (!teamUid || teamUid === 'local') {
      return
    }

    const stale = workspaces.value.filter(
      (workspace) => workspace.teamUid === teamUid && workspace.teamSlug !== teamSlug,
    )
    if (stale.length === 0) {
      return
    }

    const updatedWorkspaceUids = new Set<string>()

    await Promise.all(
      stale.map(async (workspace) => {
        // Sync the catalog row's slug so future URL lookups resolve via
        // `[teamSlug, slug]` again. When another row already owns the
        // target pair, persistence rejects the write — keep the in-memory
        // catalog aligned with IndexedDB by skipping failed rows.
        const updated = await persistence.updateSlugs(workspace.workspaceUid, { teamSlug })
        if (!updated) {
          return
        }
        updatedWorkspaceUids.add(workspace.workspaceUid)

        // Strip stale tab fields from the persisted meta chunk. Read only
        // the meta row so large OpenAPI chunks are not assembled into memory.
        const meta = await metaPersistence.getItem(workspace.workspaceUid)
        if (meta && ('x-scalar-tabs' in meta || 'x-scalar-active-tab' in meta)) {
          const { 'x-scalar-tabs': _tabs, 'x-scalar-active-tab': _activeTab, ...rest } = meta
          await metaPersistence.setItem(workspace.workspaceUid, rest)
        }
      }),
    )

    if (updatedWorkspaceUids.size === 0) {
      return
    }

    // Refresh the in-memory list and active pointer so consumers see the
    // new slug without waiting for the next IndexedDB roundtrip.
    workspaces.value = workspaces.value.map((workspace) =>
      updatedWorkspaceUids.has(workspace.workspaceUid) ? { ...workspace, teamSlug } : workspace,
    )
    const active = activeWorkspace.value
    if (active && updatedWorkspaceUids.has(active.workspaceUid)) {
      activeWorkspace.value = { ...active, teamSlug }
    }

    // The active workspace store mirrors persistence in memory. Clear
    // its in-memory tabs too so the tab bar does not keep pushing the
    // router back to a stale `/@<old-slug>/...` path. Any successful
    // slug move for this team can leave tab paths behind for every open
    // workspace on the team, not only the rows we touched.
    const activeStore = store.value
    if (activeStore && activeWorkspace.value?.teamUid === teamUid) {
      activeStore.update('x-scalar-tabs', [])
      activeStore.update('x-scalar-active-tab', 0)
    }
  }

  /**
   * Attempts to load a workspace by its URL slug pair. The slug pair is
   * mutable metadata, so this is only used when the runtime starts with
   * a URL in hand; everything else should route through the UID-keyed
   * helpers.
   */
  const loadWorkspaceBySlug = async (
    teamSlug: string,
    slug: string,
  ): Promise<{ success: true; workspace: Workspace; workspaceUid: string } | { success: false }> => {
    const workspace = await persistence.getItemBySlug({ teamSlug, slug })
    if (!workspace) {
      return { success: false }
    }

    const client = await createClientStore(workspace.workspaceUid)
    client.loadWorkspace(workspace.workspace)
    setActiveWorkspaceFromRecord(workspace)
    store.value = client

    return { success: true, workspace: client.workspace, workspaceUid: workspace.workspaceUid }
  }

  /**
   * Creates and persists a new workspace.
   *
   * Local workspaces are seeded with a blank "drafts" document so the
   * user lands on a usable starting point. Team workspaces start empty —
   * their documents come from the registry, so seeding a local-only
   * draft would just create dead state that is never synced.
   */
  const createAndPersistWorkspace = async ({
    name,
    teamUid,
    teamSlug,
    slug,
  }: {
    name: string
    teamUid: string
    teamSlug: string
    slug: string
  }) => {
    const draftStore = createWorkspaceStore()
    const isTeam = teamUid !== 'local'

    if (!isTeam) {
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
              get: {
                summary: 'First Request',
              },
            },
          },
          'x-scalar-original-document-hash': 'drafts',
          'x-scalar-icon': 'interface-edit-tool-pencil',
        },
      })
    }

    const workspaceUid = generateWorkspaceUid()
    const workspace = await persistence.setItem(
      { workspaceUid, teamUid, teamSlug, slug },
      { name, workspace: draftStore.exportWorkspace() },
    )

    workspaces.value.push({
      id: workspace.workspaceUid,
      workspaceUid: workspace.workspaceUid,
      teamUid: workspace.teamUid,
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

    // Team workspaces no longer ship with a default "drafts" document, so
    // there is nothing meaningful to deep-link to. Drop the user on the
    // workspace get-started page where they can import or create a document.
    if (teamSlug !== 'local') {
      await router.push({
        name: 'workspace.get-started',
        params: {
          teamSlug,
          workspaceSlug: slug,
        },
      })
      return
    }

    // Local workspaces always have the seeded drafts document available, so
    // we can land directly on its first example.
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
   * Routes to the get-started page of a workspace identified by its
   * stable `workspaceUid`.
   *
   * Get-started is the right landing surface on a workspace switch
   * because the user has effectively arrived at a fresh workspace and
   * may not have any documents loaded yet. We look the workspace up
   * against the unfiltered `workspaces` list so callers can switch into
   * a workspace that is not visible under the current team filter.
   *
   * The picker may also surface a synthetic placeholder option (see
   * `getPlaceholderWorkspaceId`) for teams that have no real workspace
   * yet. We accept that shape too and route it through the normal flow
   * so the route handler can create the workspace on demand.
   */
  const navigateToWorkspaceGetStarted = (workspaceId: string, activeTeamSlug: string): void => {
    const emitNavigation = (target: string, slug: string) => {
      eventBus.emit('ui:navigate', {
        page: 'workspace',
        path: 'get-started',
        teamSlug: target,
        workspaceSlug: slug,
      })
    }

    const workspace = workspaces.value?.find((w) => w.workspaceUid === workspaceId)
    if (workspace) {
      emitNavigation(workspace.teamSlug, workspace.slug)
      return
    }

    const placeholder = parsePlaceholderWorkspaceId(workspaceId)
    if (placeholder && activeTeamSlug && activeTeamSlug !== 'local' && placeholder.teamSlug === activeTeamSlug) {
      emitNavigation(placeholder.teamSlug, placeholder.slug)
    }
  }

  /**
   * Navigates to a workspace, restoring the last active tab when one
   * exists in persistence. Falls back to the workspace's get-started
   * page when no prior session is stored.
   *
   * The caller picks the lookup strategy through the options object:
   *
   * - `{ workspaceUid }` routes to that exact workspace by its stable
   *   identifier. Used by pickers where the user selected a specific
   *   workspace from the list. The picker may also forward a synthetic
   *   placeholder id (see `getPlaceholderWorkspaceId`) for a team that
   *   does not own a real workspace yet — those route through the
   *   team's get-started page so the route handler can create the
   *   workspace on demand.
   * - `{ teamUid }` routes to the first workspace owned by that team.
   *   Used after login or team switch where the caller only knows
   *   which team is active. If no workspace exists for the team yet,
   *   a placeholder URL is emitted so the route handler creates the
   *   workspace on demand.
   *
   * `teamSlug` is optional and only used to build the placeholder URL
   * when there is no workspace to derive a slug pair from — slugs are
   * URL metadata only, never the identity.
   */
  const resumeOrGetStarted = async (
    options:
      | { workspaceUid: string; teamUid?: never; teamSlug?: never }
      | { workspaceUid?: never; teamUid: string; teamSlug: string },
  ): Promise<void> => {
    const { workspaceUid, teamUid, teamSlug } = options
    // When operating by `teamUid` we may have to navigate using the
    // workspace's stored slugs. Reconcile stale slug metadata first so
    // the saved tab path below points at a routable URL.
    if (teamUid && teamSlug) {
      await reconcileTeamSlug(teamUid, teamSlug)
    }

    // Picker placeholder fast-path: the id is `pending:<teamSlug>/<slug>`
    // and points at a team that has no real workspace yet. There is
    // nothing to resume — route straight to the team's get-started page
    // and let the route handler create the workspace on demand. Without
    // this branch the UID lookup below would miss and the caller would
    // silently land on the local default workspace.
    if (workspaceUid) {
      const placeholder = parsePlaceholderWorkspaceId(workspaceUid)
      if (placeholder) {
        navigateToWorkspaceGetStarted(workspaceUid, placeholder.teamSlug)
        return
      }
    }

    const workspace = (() => {
      if (workspaceUid) {
        return workspaces.value?.find((w) => w.workspaceUid === workspaceUid)
      }
      if (teamUid) {
        return workspaces.value?.find((w) => w.teamUid === teamUid)
      }
      return undefined
    })()

    if (workspace) {
      // Read tabs from the meta chunk only so large OpenAPI rows are not
      // assembled into memory. The reconciliation above will have stripped
      // any URLs that referenced a stale team slug.
      const meta = await metaPersistence.getItem(workspace.workspaceUid)
      const tabs = meta['x-scalar-tabs']
      const index = meta['x-scalar-active-tab'] ?? 0
      const tab = tabs?.[index]

      if (tab?.path) {
        await router.push(tab.path)
        return
      }

      navigateToWorkspaceGetStarted(workspace.workspaceUid, workspace.teamSlug)
      return
    }

    // No workspace yet — only meaningful for a team we know the slug
    // for. We bounce through the placeholder URL so the route handler
    // can create the workspace on demand. Local has no analogous flow.
    if (teamUid && teamUid !== 'local' && teamSlug) {
      return navigateToWorkspaceGetStarted(getPlaceholderWorkspaceId(teamSlug, DEFAULT_TEAM_WORKSPACE_SLUG), teamSlug)
    }

    // We navigate to the default workspace for the local team.
    await navigateToWorkspace('local', 'default')
  }

  /**
   * Creates a new workspace with the provided name.
   *
   * - Picks a unique slug (uses the provided one if free, otherwise
   *   suffixes via `generateUniqueValue`).
   * - Records `teamUid` as the canonical team identifier; the slug only
   *   shapes the URL and can change later via `updateSlugs`.
   * - Adds a default blank document ("drafts") for local workspaces.
   * - Persists the workspace and navigates to it.
   */
  const createWorkspace = async ({
    teamUid,
    teamSlug,
    slug,
    name,
  }: {
    teamUid?: string
    teamSlug?: string
    slug?: string
    name: string
  }) => {
    const resolvedTeamUid = teamUid ?? 'local'
    const resolvedTeamSlug = teamSlug ?? 'local'

    // Restrict users to a single workspace per team. Local workspaces
    // remain unrestricted. When a team workspace already exists for the
    // given `teamUid`, navigate to it instead of creating a duplicate.
    if (resolvedTeamUid !== 'local') {
      const existing = workspaces.value.find((w) => w.teamUid === resolvedTeamUid)
      if (existing) {
        console.warn(
          `A workspace already exists for team "${resolvedTeamUid}". Navigating to the existing workspace instead.`,
        )
        await navigateToWorkspace(existing.teamSlug, existing.slug)
        return {
          workspaceUid: existing.workspaceUid,
          teamUid: existing.teamUid,
          teamSlug: existing.teamSlug,
          slug: existing.slug,
          name: existing.label,
        }
      }
    }

    // Clear up the current store, in order to show the loading state
    store.value = null

    // Slug uniqueness is enforced by the `[teamSlug, slug]` unique
    // index. We pre-check via `hasSlug` so collisions are visible to
    // the user before we hit the database.
    const newWorkspaceSlug = await generateUniqueValue({
      defaultValue: slug ?? name,
      validation: async (value) => !(await persistence.hasSlug({ teamSlug: resolvedTeamSlug, slug: value })),
      maxRetries: 100,
      transformation: slugify,
    })

    if (!newWorkspaceSlug) {
      return undefined
    }

    const createdWorkspace = await createAndPersistWorkspace({
      name,
      teamUid: resolvedTeamUid,
      teamSlug: resolvedTeamSlug,
      slug: newWorkspaceSlug,
    })

    await navigateToWorkspace(createdWorkspace.teamSlug, createdWorkspace.slug)
    return createdWorkspace
  }

  /**
   * Handles changing the active workspace when the workspace slug
   * changes in the route.
   *
   * - Tries to resolve the URL's `[teamSlug, slug]` pair via persistence.
   * - When the lookup fails on a non-`local` team route while the shell
   *   has a real `teamUid`, falls back to the first workspace owned by
   *   that `teamUid` when its slug pair differs from the URL. This is
   *   the slug-rename recovery path: server rotated the slug, the URL is
   *   stale, but the workspace still exists locally under the same UID.
   *   Intentional `/@local/…` URLs never use this branch so they can
   *   resolve to local defaults even while authenticated.
   * - When neither succeeds, falls back to the local default workspace
   *   (creating it on demand if needed).
   */
  const changeWorkspace = async (
    teamSlug: string,
    slug: string,
    teamUid: string,
    filteredWorkspaces: ComputedRef<WorkspaceOption[]>,
    to: RouteLocationNormalizedGeneric,
  ) => {
    store.value = null
    isSyncingWorkspace.value = true

    const result = await loadWorkspaceBySlug(teamSlug, slug)

    if (result.success) {
      const tabs = result.workspace['x-scalar-tabs']
      const index = result.workspace['x-scalar-active-tab'] ?? 0

      if (tabs && index >= tabs.length) {
        eventBus.emit('tabs:update:tabs', { 'x-scalar-active-tab': 0 })
      }

      if (!tabs) {
        eventBus.emit('tabs:update:tabs', {
          'x-scalar-tabs': [createTabFromRoute(currentRoute.value)],
          'x-scalar-active-tab': 0,
        })
      }

      syncTabs(to)
      syncSidebar(to)

      isSyncingWorkspace.value = false
      return
    }

    // Slug-rename recovery: when the URL targets a *team* path (not
    // `/@local/…`) and the shell has resolved a real team membership,
    // try redirecting to the catalog's current slug pair for that
    // `teamUid`. The route's `[teamSlug, slug]` can be stale after a
    // server-side rename; IndexedDB keeps the canonical slugs.
    //
    // We must not run this for `/@local/…` while authenticated: in that
    // case `teamUid` is still the org UID from the token, so a naive
    // `teamUid !== 'local'` check would hijack intentional local routes.
    if (teamSlug !== 'local' && teamUid !== 'local') {
      const teamWorkspace = workspaces.value.find((w) => w.teamUid === teamUid)
      if (teamWorkspace && (teamWorkspace.teamSlug !== teamSlug || teamWorkspace.slug !== slug)) {
        isSyncingWorkspace.value = false
        return navigateToWorkspace(teamWorkspace.teamSlug, teamWorkspace.slug)
      }
    }

    const targetWorkspace =
      filteredWorkspaces.value.find((workspace) => workspace.teamSlug === 'local' && workspace.slug === 'default') ??
      filteredWorkspaces.value[0]

    if (targetWorkspace) {
      isSyncingWorkspace.value = false
      return navigateToWorkspace(targetWorkspace.teamSlug, targetWorkspace.slug)
    }

    // Nothing to load: create the default local workspace and go there.
    const createResult = await createWorkspace({
      name: DEFAULT_LOCAL_WORKSPACE_NAME,
      slug: 'default',
    })

    isSyncingWorkspace.value = false

    if (!createResult) {
      return console.error('Failed to create the default workspace, something went wrong, can not load the workspace')
    }

    // Must reset the sidebar state when the workspace changes
    sidebarState.reset()
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
      .map((doc) => {
        const entry = activeStore.workspace.documents[doc]
        return isOpenApiDocument(entry) ? entry['x-scalar-navigation'] : undefined
      })
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

    // Selecting a document expands it and jumps to its first operation,
    // falling back to the overview only when there are no operations.
    if (entry.type === 'document') {
      // Toggle expansion when the document or any descendant is already selected.
      // Strict equality on `selectedItem` would miss this, since clicking a
      // document recurses into a leaf (operation/example).
      if (sidebarState.isSelected(id)) {
        sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
        return
      }

      sidebarState.setExpanded(id, true)

      const firstOperation = getChildEntry('operation', entry)
      if (firstOperation) {
        return handleSelectItem(firstOperation.id)
      }

      sidebarState.setSelected(id)
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
    const activeDoc = activeDocument.value
    const documentName =
      payload.documentName ?? (isOpenApiDocument(activeDoc) ? activeDoc['x-scalar-navigation']?.name : undefined)
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

  /**
   * When the route changes we update the active entities in the store
   * and switch workspaces if needed.
   *
   * The URL is treated as a slug-pair *hint*. We look up persistence by
   * that pair, but the active workspace identity is the resolved
   * `workspaceUid` / `teamUid` — never the slug. That is what lets the
   * runtime survive server-side slug renames without losing state.
   */
  const handleRouteChange = async (
    to: RouteLocationNormalizedGeneric,
    {
      teamSlug,
      teamUid,
      filteredWorkspaces,
    }: {
      teamSlug: ComputedRef<string>
      teamUid: ComputedRef<string>
      filteredWorkspaces: ComputedRef<WorkspaceOption[]>
    },
  ): Promise<void> => {
    const slug = getRouteParam('workspaceSlug', to)
    const document = getRouteParam('documentSlug', to)
    const nextTeamSlug = getRouteParam('teamSlug', to)

    // Must have an active workspace to syncs
    if (!nextTeamSlug || !slug) {
      return
    }

    // Reconcile cached `teamSlug` values against the team slug the
    // server currently advertises. This must happen before any
    // workspace lookup so a fresh URL hitting a stale local catalog
    // (server-side rename) routes through the updated slug pair
    // instead of bouncing to the local default.
    await reconcileTeamSlug(teamUid.value, teamSlug.value)

    // Try to see if the user can load this workspace based on the team slug.
    const workspace = workspaces.value.find(
      (workspace) => workspace.slug === slug && workspace.teamSlug === nextTeamSlug,
    )

    // If the workspace exists but is not accessible by the current team, redirect to the default workspace.
    if (workspace && !canLoadWorkspace(workspace.teamSlug, teamSlug.value)) {
      await navigateToWorkspace('local', 'default')
      return
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

    const active = activeWorkspace.value
    const isSameWorkspace = Boolean(active && workspace && active.workspaceUid === workspace.workspaceUid)

    if (!isSameWorkspace) {
      // If the user is navigating into their team context but the team
      // workspace does not exist yet (picker placeholder, login redirect,
      // …), create it on demand. Otherwise `changeWorkspace` would fall
      // back to the local default and silently swallow the navigation.
      const isUnknownTeamWorkspace = nextTeamSlug !== 'local' && nextTeamSlug === teamSlug.value && !workspace
      if (isUnknownTeamWorkspace) {
        await createWorkspace({
          teamUid: teamUid.value,
          teamSlug: nextTeamSlug,
          slug,
          name: DEFAULT_TEAM_WORKSPACE_NAME,
        })
        return
      }
      await changeWorkspace(nextTeamSlug, slug, teamUid.value, filteredWorkspaces, to)
      return
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

  /**
   * Splash-screen gate exposed to the shell. Combines workspace syncing with
   * the host-driven team fetch so the UI stays on the splash until both the
   * active workspace and the active team are ready - otherwise a reload onto
   * a team workspace flashes the local fallback before the team resolves.
   */
  const loading = computed(() => isSyncingWorkspace.value)

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
      activeWorkspace,
      navigateToWorkspace,
      navigateToWorkspaceGetStarted,
      resumeOrGetStarted,
      reconcileTeamSlug,
      isOpen: computed(() => Boolean(workspaceSlug.value && !documentSlug.value)),
      isTeamWorkspace,
    },
    eventBus,
    router,
    handleRouteChange,
    currentRoute,
    loading,
    activeEntities: {
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    },
    environment,
    document: activeDocument,
    isDarkMode,
    telemetry,
    options,
  }
}
