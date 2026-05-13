import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence, generateWorkspaceUid } from '@scalar/workspace-store/persistence'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import 'fake-indexeddb/auto'

import { createAppState } from './app-state'
import { filterWorkspacesByTeam } from './helpers/filter-workspaces'
import { groupWorkspacesByTeam } from './helpers/group-workspaces'
import { getPlaceholderWorkspaceId } from './helpers/placeholder-workspace-id'
import { ROUTES } from './helpers/routes'

/**
 * Seeds a workspace into IndexedDB at a known slug pair so the app state
 * under test can resolve it via the URL. The default `teamUid` mirrors
 * the team slug so tests written before UID-based identity (which
 * passed only `teamSlug`) keep working — team-scoped lookups still
 * group correctly.
 */
const persistWorkspace = async ({
  teamUid,
  teamSlug = 'local',
  slug,
  name = 'Test Workspace',
  tabs,
}: {
  teamUid?: string
  teamSlug?: string
  slug: string
  name?: string
  tabs?: { path: string; title: string }[]
}) => {
  const store = createWorkspaceStore()

  if (tabs) {
    store.workspace['x-scalar-tabs'] = tabs
    store.workspace['x-scalar-active-tab'] = 0
  }

  const persistence = await createWorkspaceStorePersistence()
  await persistence.workspace.setItem(
    { workspaceUid: generateWorkspaceUid(), teamUid: teamUid ?? teamSlug, teamSlug, slug },
    { name, workspace: store.exportWorkspace() },
  )
}

/** Avoids duplicate `local`/`default` rows — the catalog index is unique on `[teamSlug, slug]`. */
const ensureLocalDefaultWorkspace = async (): Promise<void> => {
  const persistence = await createWorkspaceStorePersistence()
  if (await persistence.workspace.getItemBySlug({ slug: 'default' })) {
    return
  }
  await persistWorkspace({ slug: 'default', name: 'Local Default' })
}

const setupRouter = () => createRouter({ history: createMemoryHistory(), routes: ROUTES })

/**
 * Builds the metadata object that `handleRouteChange` expects with
 * `ComputedRef` values. `teamUid` defaults to the slug so tests that
 * only care about slug-level routing keep working without thinking
 * about UID identity explicitly.
 */
const routeMetadata = (appState: Awaited<ReturnType<typeof createAppState>>, teamSlug: string, teamUid = teamSlug) => ({
  teamSlug: computed(() => teamSlug),
  teamUid: computed(() => teamUid),
  filteredWorkspaces: computed(() => filterWorkspacesByTeam(appState.workspace.workspaceList.value, teamSlug)),
})

const waitForNavigation = async () => {
  await nextTick()
  await flushPromises()
  // Multiple flushes are needed to drain the nested promise chain (IndexedDB load → router.replace → afterEach again).
  await flushPromises()
  await flushPromises()
}

describe('app-state', () => {
  it('preserves the initial route when workspace has saved tabs on first load', async () => {
    const savedTabPath = '/@local/preserve-route/document/drafts/servers'
    await persistWorkspace({
      slug: 'preserve-route',
      tabs: [{ path: savedTabPath, title: 'Saved Tab' }],
    })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'document.overview',
      params: { teamSlug: 'local', workspaceSlug: 'preserve-route', documentSlug: 'drafts' },
    })
    await router.isReady()

    // Simulate what App.vue does in router.afterEach
    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, 'local'))
    await waitForNavigation()

    // The URL routing should take precedence over the saved tab on initial load
    expect(router.currentRoute.value.name).toBe('document.overview')
    expect(router.currentRoute.value.path).not.toBe(savedTabPath)
  })

  it('stays on the current route when workspace has no saved tabs on initial load', async () => {
    await persistWorkspace({ slug: 'no-tabs' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'document.overview',
      params: { teamSlug: 'local', workspaceSlug: 'no-tabs', documentSlug: 'drafts' },
    })
    await router.isReady()

    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, 'local'))
    await waitForNavigation()

    expect(router.currentRoute.value.name).toBe('document.overview')
  })

  it('syncs the active tab path to the URL-based route on initial load when saved tabs exist', async () => {
    const savedTabPath = '/@local/sync-tabs/document/drafts/servers'
    await persistWorkspace({
      slug: 'sync-tabs',
      tabs: [{ path: savedTabPath, title: 'Saved Tab' }],
    })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'document.overview',
      params: { teamSlug: 'local', workspaceSlug: 'sync-tabs', documentSlug: 'drafts' },
    })

    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, 'local'))

    // Wait until the workspace has finished loading — once store.value is populated
    // the tabs computed switches from the currentRoute fallback to persisted tabs.
    // Without the fix, that persisted path would still be stale.
    await vi.waitFor(() => {
      expect(appState.store.value).not.toBeNull()
    })

    const activeIndex = appState.tabs.activeTabIndex.value
    const activeTab = appState.tabs.state.value[activeIndex]
    // The active tab must track the URL-based route, not the stale persisted path
    expect(activeTab?.path).toBe(router.currentRoute.value.path)
    expect(activeTab?.path).not.toBe(savedTabPath)
  })

  it('navigates to the existing team workspace instead of creating a duplicate', async () => {
    await persistWorkspace({ teamUid: 'acme-uid', teamSlug: 'acme', slug: 'first-team-workspace', name: 'First' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    const result = await appState.workspace.create({
      teamUid: 'acme-uid',
      teamSlug: 'acme',
      name: 'Second',
    })

    // The existing workspace is returned verbatim — `teamUid` matches so
    // the dedup branch fires before any new workspace can be persisted.
    expect(result).toMatchObject({
      teamUid: 'acme-uid',
      teamSlug: 'acme',
      slug: 'first-team-workspace',
      name: 'First',
    })

    const acmeWorkspaces = appState.workspace.workspaceList.value.filter((w) => w.teamUid === 'acme-uid')
    expect(acmeWorkspaces).toHaveLength(1)

    await waitForNavigation()
    expect(router.currentRoute.value.params.teamSlug).toBe('acme')
    expect(router.currentRoute.value.params.workspaceSlug).toBe('first-team-workspace')
  })

  it('still allows creating multiple local workspaces', async () => {
    await persistWorkspace({ slug: 'first-local', name: 'First' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    const result = await appState.workspace.create({ name: 'Second Local' })

    expect(result).toBeDefined()
    const localWorkspaces = appState.workspace.workspaceList.value.filter((w) => w.teamSlug === 'local')
    expect(localWorkspaces.length).toBeGreaterThanOrEqual(2)
  })

  it('creates a new team workspace when the team has none yet', async () => {
    await persistWorkspace({ teamSlug: 'team-a', slug: 'a-workspace', name: 'A' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    const result = await appState.workspace.create({ teamSlug: 'team-b', name: 'B' })

    expect(result).toEqual(
      expect.objectContaining({
        teamSlug: 'team-b',
        name: 'B',
      }),
    )
    expect(appState.workspace.workspaceList.value.some((w) => w.teamSlug === 'team-b')).toBe(true)
  })

  it('shows the team workspaces group with a placeholder when the team has no workspace yet', async () => {
    const router = setupRouter()
    // Use a team slug that no other test has persisted a workspace under so
    // only the synthetic default option appears in the team group.
    const appState = await createAppState({ router })

    // workspaceGroups is now computed in the shell (App.vue) using
    // groupWorkspacesByTeam, so we replicate that here.
    const filtered = filterWorkspacesByTeam(appState.workspace.workspaceList.value, 'placeholder-team')
    const groups = groupWorkspacesByTeam(filtered, 'placeholder-team', {
      placeholder: {
        slug: 'default',
        label: 'Team workspace',
      },
    })
    const teamGroup = groups.find((g) => g.label === 'Team Workspaces')

    expect(teamGroup).toBeDefined()
    expect(teamGroup?.options).toEqual([
      {
        // The picker placeholder uses the `pending:` prefix so picker
        // consumers can tell it apart from a real `workspaceUid` and
        // route it to the team's get-started page.
        id: getPlaceholderWorkspaceId('placeholder-team', 'default'),
        label: 'Team workspace',
      },
    ])
    expect(groups.find((g) => g.label === 'Local Workspaces')).toBeDefined()
  })

  it('creates the default team workspace on demand when navigating to a team workspace URL', async () => {
    const router = setupRouter()
    const appState = await createAppState({ router })
    const teamSlug = 'autocreate-team'

    expect(appState.workspace.workspaceList.value.some((w) => w.teamSlug === teamSlug)).toBe(false)

    await router.push({
      name: 'document.overview',
      params: { teamSlug, workspaceSlug: 'default', documentSlug: 'drafts' },
    })
    await router.isReady()

    // Simulate what App.vue does: call handleRouteChange with the team context
    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, teamSlug))
    await waitForNavigation()

    await vi.waitFor(() => {
      expect(router.currentRoute.value.params.teamSlug).toBe(teamSlug)
    })
    await vi.waitFor(() => {
      expect(appState.workspace.workspaceList.value.some((w) => w.teamSlug === teamSlug && w.slug === 'default')).toBe(
        true,
      )
    })
    // Team workspaces land on get-started instead of a drafts deep link.
    expect(router.currentRoute.value.name).toBe('workspace.get-started')
  })

  it('does not seed a drafts document when loading a persisted team workspace', async () => {
    // Persist an empty team workspace before bootstrapping app state so it
    // is in IndexedDB by the time the route handler asks for it. Using
    // persistence avoids depending on the on-demand create path for this case.
    const teamSlug = 'no-drafts-team'
    await persistWorkspace({ teamSlug, slug: 'default', name: 'Team Workspace' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'workspace.get-started',
      params: { teamSlug, workspaceSlug: 'default' },
    })
    await router.isReady()

    // Simulate the shell calling handleRouteChange with team context
    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, teamSlug))
    await waitForNavigation()

    await vi.waitFor(() => {
      expect(appState.store.value).not.toBeNull()
    })

    // Team workspaces start empty - no auto-seeded "drafts" document.
    expect(appState.store.value?.workspace.documents.drafts).toBeUndefined()
    expect(Object.keys(appState.store.value?.workspace.documents ?? {})).toHaveLength(0)
  })

  it('navigates team workspaces to the get-started page instead of the drafts route', async () => {
    const router = setupRouter()
    const appState = await createAppState({ router })

    // Capture the initial push target before downstream tab-sync effects can
    // replace the route - tabs:update:tabs is wired to navigateToCurrentTab
    // which would otherwise mutate currentRoute before our assertion runs.
    const pushed: { name?: string; params?: Record<string, unknown> }[] = []
    const originalPush = router.push.bind(router)
    router.push = ((to: any) => {
      if (typeof to === 'object' && to !== null) {
        pushed.push({ name: to.name, params: to.params })
      }
      return originalPush(to)
    }) as typeof router.push

    await appState.workspace.navigateToWorkspace('team-nav', 'default')

    expect(pushed[0]?.name).toBe('workspace.get-started')
    expect(pushed[0]?.params?.documentSlug).toBeUndefined()
  })

  it('still navigates local workspaces directly to the drafts example route', async () => {
    const router = setupRouter()
    const appState = await createAppState({ router })

    const pushed: { name?: string; params?: Record<string, unknown> }[] = []
    const originalPush = router.push.bind(router)
    router.push = ((to: any) => {
      if (typeof to === 'object' && to !== null) {
        pushed.push({ name: to.name, params: to.params })
      }
      return originalPush(to)
    }) as typeof router.push

    await appState.workspace.navigateToWorkspace('local', 'drafts-target')

    expect(pushed[0]?.name).toBe('example')
    expect(pushed[0]?.params?.documentSlug).toBe('drafts')
  })

  it('keeps a team workspace after navigation once team loading finishes (reload regression)', async () => {
    // Reproduces the reload bug: the user has switched to a team
    // workspace, then refreshes the page. The route fires before
    // `currentTeam` resolves, so without the gate the team check would
    // see the stale `'local'` fallback and bounce the user back to the
    // local default. With the gate, the shell (App.vue) defers calling
    // handleRouteChange until the team lands, so we end up on the team
    // workspace as intended.
    const teamSlug = 'reload-team'
    await persistWorkspace({ teamSlug, slug: 'team-default', name: 'Team Default' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'workspace.get-started',
      params: { teamSlug, workspaceSlug: 'team-default' },
    })
    await router.isReady()
    await waitForNavigation()

    // Before the shell calls handleRouteChange, the workspace is not yet loaded.
    // The shell holds off calling handleRouteChange until the team is resolved.
    expect(appState.store.value).toBeNull()
    expect(router.currentRoute.value.params.teamSlug).toBe(teamSlug)
    expect(router.currentRoute.value.params.workspaceSlug).toBe('team-default')

    // Simulate the shell resolving the team and then calling handleRouteChange
    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, teamSlug))

    await vi.waitFor(() => {
      expect(appState.store.value).not.toBeNull()
    })

    // After team data resolves and routing replays, we must still be on a
    // team-backed workspace — not redirected to local/default.
    expect(appState.workspace.isTeamWorkspace.value).toBe(true)
    expect(router.currentRoute.value.params.teamSlug).toBe(teamSlug)
    // `id` is now the stable workspaceUid, so we check by slug pair via
    // the dedicated `teamSlug` / `slug` fields. Picker placeholders for
    // teams without a real workspace are built separately via
    // `getPlaceholderWorkspaceId` and do not flow through this path.
    expect(appState.workspace.activeWorkspace.value?.teamSlug).toBe(teamSlug)
    expect(appState.workspace.activeWorkspace.value?.slug).toBe('team-default')
  })

  it('redirects off a team workspace URL when the resolved team context is still local', async () => {
    // Documents why `handleRouteChange` must wait while `currentTeam` is
    // loading: this is the redirect that used to run on reload before the
    // active team had been fetched (same `canLoadWorkspace` branch).
    await persistWorkspace({ slug: 'default', name: 'Local Default' })
    await persistWorkspace({ teamSlug: 'foreign-team', slug: 'default', name: 'Foreign' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'workspace.get-started',
      params: { teamSlug: 'foreign-team', workspaceSlug: 'default' },
    })
    await router.isReady()
    await waitForNavigation()

    // The shell resolves the team as 'local' (not logged in / not on that team),
    // so handleRouteChange is called with teamSlug='local'. The canLoadWorkspace
    // check sees the foreign-team workspace is not accessible and redirects.
    await appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, 'local'))

    await vi.waitFor(() => {
      expect(router.currentRoute.value.params.teamSlug).toBe('local')
    })

    // The redirect navigated to the local default workspace. We need to call
    // handleRouteChange again for the new route to load the workspace store.
    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, 'local'))

    await vi.waitFor(() => {
      expect(appState.store.value).not.toBeNull()
    })

    expect(appState.workspace.isTeamWorkspace.value).toBe(false)
    expect(router.currentRoute.value.params.workspaceSlug).toBe('default')
  })

  it('loads the target workspace when switching workspaces after initial load', async () => {
    await persistWorkspace({ slug: 'switch-source' })
    await persistWorkspace({ slug: 'switch-target' })

    const router = setupRouter()
    const appState = await createAppState({ router })
    const teamSlug = 'local'

    // Initial load on workspace A
    await router.push({
      name: 'document.overview',
      params: { teamSlug, workspaceSlug: 'switch-source', documentSlug: 'drafts' },
    })
    await router.isReady()

    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, teamSlug))
    await waitForNavigation()

    // Verify workspace A is loaded (by slug pair — `id` is now the
    // workspaceUid which we cannot predict from the seed.)
    await vi.waitFor(() => {
      expect(appState.workspace.activeWorkspace.value?.slug).toBe('switch-source')
    })

    // Switch to workspace B
    await router.push({
      name: 'document.overview',
      params: { teamSlug, workspaceSlug: 'switch-target', documentSlug: 'drafts' },
    })

    await appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, teamSlug))

    // changeWorkspace loaded the target workspace
    await vi.waitFor(() => {
      expect(appState.store.value).not.toBeNull()
    })
    expect(appState.workspace.activeWorkspace.value?.slug).toBe('switch-target')
    expect(router.currentRoute.value.params.workspaceSlug).toBe('switch-target')
  })

  it('redirects to the canonical slug pair when the URL slugs are stale for a known team UID', async () => {
    // The user lands on a stale `/@old-slug/api` URL after the server
    // renamed the team. The local catalog already reflects the rename
    // (teamSlug=new-slug). The route's `teamSlug` mismatch is detected
    // and the user is redirected to the workspace's current slug pair.
    const teamUid = 'rename-team-uid'
    await persistWorkspace({ teamUid, teamSlug: 'new-slug', slug: 'api', name: 'Renamed Workspace' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'workspace.get-started',
      params: { teamSlug: 'old-slug', workspaceSlug: 'api' },
    })
    await router.isReady()

    // `useTeams` resolves with the *current* server-advertised slug
    // (`new-slug`) — the URL is the stale value the user reloaded onto.
    appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, 'new-slug', teamUid))
    await waitForNavigation()

    expect(router.currentRoute.value.params.teamSlug).toBe('new-slug')
    expect(router.currentRoute.value.params.workspaceSlug).toBe('api')
  })

  it('falls through to the local default when /@local/… misses while the shell team is non-local', async () => {
    const teamUid = 'logged-in-team-uid'
    const teamSlug = 'acme-local-fallback-test'
    await ensureLocalDefaultWorkspace()
    await persistWorkspace({
      teamUid,
      teamSlug,
      slug: 'only-team-ws',
      name: 'Team WS',
    })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await router.push({
      name: 'workspace.get-started',
      params: { teamSlug: 'local', workspaceSlug: 'does-not-exist' },
    })
    await router.isReady()

    // Shell team is the org, but the URL explicitly targets a missing local workspace.
    await appState.handleRouteChange(router.currentRoute.value, routeMetadata(appState, teamSlug, teamUid))
    await waitForNavigation()

    expect(router.currentRoute.value.params.teamSlug).toBe('local')
    expect(router.currentRoute.value.params.workspaceSlug).toBe('default')
  })

  it('reconciles the cached team slug and strips stale tab metadata when the server slug changes', async () => {
    // Persist a workspace whose locally-known teamSlug is `acme` but
    // whose meta tabs were captured under that old slug. After
    // reconciliation, the catalog should report the new slug and the
    // stale tab paths should be gone from persistence.
    const teamUid = 'acme-uid'
    await persistWorkspace({
      teamUid,
      teamSlug: 'acme',
      slug: 'api',
      name: 'Acme API',
      tabs: [{ path: '/@acme/api/document/drafts', title: 'Drafts' }],
    })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await appState.workspace.reconcileTeamSlug(teamUid, 'acme-corp')

    const workspace = appState.workspace.workspaceList.value.find((w) => w.teamUid === teamUid)
    expect(workspace?.teamSlug).toBe('acme-corp')

    // Persisted meta no longer references the stale `/@acme/...` path.
    const persistence = await createWorkspaceStorePersistence()
    const persisted = await persistence.workspace.getItemBySlug({ teamSlug: 'acme-corp', slug: 'api' })
    expect(persisted?.workspace.meta).not.toHaveProperty('x-scalar-tabs')
    expect(persisted?.workspace.meta).not.toHaveProperty('x-scalar-active-tab')
  })

  it('reconcileTeamSlug is a no-op when teamUid is local', async () => {
    await persistWorkspace({ slug: 'local-one', name: 'Local One' })

    const router = setupRouter()
    const appState = await createAppState({ router })

    const before = appState.workspace.workspaceList.value.map((w) => ({ ...w }))
    await appState.workspace.reconcileTeamSlug('local', 'whatever')
    const after = appState.workspace.workspaceList.value.map((w) => ({ ...w }))

    expect(after).toEqual(before)
  })

  it('reconcileTeamSlug skips in-memory slug refresh when persistence rejects a slug collision', async () => {
    const teamUid = 'collision-team-uid'
    await persistWorkspace({
      teamUid,
      teamSlug: 'acme-new',
      slug: 'api',
      name: 'Already on new slug',
    })
    await persistWorkspace({
      teamUid,
      teamSlug: 'acme-old',
      slug: 'api',
      name: 'Stale slug row',
    })

    const router = setupRouter()
    const appState = await createAppState({ router })

    await appState.workspace.reconcileTeamSlug(teamUid, 'acme-new')

    const staleRow = appState.workspace.workspaceList.value.find((w) => w.label === 'Stale slug row')
    expect(staleRow?.teamSlug).toBe('acme-old')

    const persistence = await createWorkspaceStorePersistence()
    expect(await persistence.workspace.getItemBySlug({ teamSlug: 'acme-old', slug: 'api' })).toMatchObject({
      name: 'Stale slug row',
    })
    expect(
      (await persistence.workspace.getAllByTeamUid(teamUid))
        .filter((w) => w.slug === 'api')
        .map((w) => w.teamSlug)
        .sort(),
    ).toEqual(['acme-new', 'acme-old'])
  })

  it('routes a picker placeholder selection to the team get-started page instead of the local default', async () => {
    // Regression: the picker surfaces a synthetic "Team workspace"
    // option for non-local teams that do not yet own a real workspace.
    // Its id is `pending:<teamSlug>/<slug>`. The picker forwards it as
    // `resumeOrGetStarted({ workspaceUid })`. The UID lookup misses
    // (real UIDs are UUIDs), so without the placeholder fast-path the
    // call falls through to `navigateToWorkspace('local', 'default')`
    // and silently bounces the user to the local workspace.
    const router = setupRouter()
    const appState = await createAppState({ router })

    const placeholderId = getPlaceholderWorkspaceId('acme', 'default')
    await appState.workspace.resumeOrGetStarted({ workspaceUid: placeholderId })
    await waitForNavigation()

    expect(router.currentRoute.value.name).toBe('workspace.get-started')
    expect(router.currentRoute.value.params.teamSlug).toBe('acme')
    expect(router.currentRoute.value.params.workspaceSlug).toBe('default')
  })
})
