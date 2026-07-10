<script lang="ts">
/* global PACKAGE_VERSION */
// Injected by Vite at build time (see vite.config.ts and vite.standalone.config.ts).
// Read via process.env so the constant is replaced inline without pulling package.json
// into the TypeScript program — that would expand rootDir and emit declarations under dist/src/.
const version = PACKAGE_VERSION

if (version && typeof window !== 'undefined') {
  console.info(`@scalar/api-reference@${version}`)
}
</script>

<script setup lang="ts">
import { provideUseId } from '@headlessui/vue'
import { OpenApiClientButton } from '@scalar/api-client/blocks/operation-block'
import type { ApiClientModal } from '@scalar/api-client/modal'
import {
  ScalarColorModeToggleButton,
  ScalarColorModeToggleIcon,
} from '@scalar/components/color-mode-toggle'
import { addScalarClassesToHeadless } from '@scalar/components/helpers'
import {
  ScalarSidebarFooter,
  ScalarSidebarSection,
} from '@scalar/components/sidebar'
import { toJsonCompatible } from '@scalar/helpers/object/to-json-compatible'
import { slugify } from '@scalar/helpers/string/slugify'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { apiReferenceConfigurationSchema } from '@scalar/schemas/api-reference'
import {
  createSidebarState,
  ScalarSidebar,
  scrollSidebarToTop,
} from '@scalar/sidebar'
import { getThemeStyles, hasObtrusiveScrollbars } from '@scalar/themes'
import {
  DEFAULT_MODELS_SECTION_LABEL,
  type AnyApiReferenceConfiguration,
  type ApiReferenceConfiguration,
  type ApiReferenceConfigurationRaw,
} from '@scalar/types/api-reference'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { ScalarToasts } from '@scalar/use-toasts'
import { coerce } from '@scalar/validation'
import { getAsyncApiServers } from '@scalar/workspace-store/channel-example'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getActiveEnvironment,
  getServers,
} from '@scalar/workspace-store/request-example'
import type {
  TraversedEntry,
  TraversedTag,
} from '@scalar/workspace-store/schemas/navigation'
import {
  isAsyncApiDocument,
  isOpenApiDocument,
} from '@scalar/workspace-store/schemas/type-guards'
import { useScrollLock } from '@vueuse/core'
import diff from 'microdiff'
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onServerPrefetch,
  provide,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'

import {
  AsyncApiSidebarFilters,
  filterAsyncApiNavigation,
} from '@/blocks/scalar-asyncapi-sidebar-filters-block'
import {
  AgentScalarButton,
  AgentScalarDrawer,
  OpenMCPButton,
} from '@/components/AgentScalar'
import ClassicHeader from '@/components/ClassicHeader.vue'
import Content from '@/components/Content/Content.vue'
import MobileHeader from '@/components/MobileHeader.vue'
import { DeveloperTools } from '@/features/developer-tools'
import {
  provideLocalization,
  resolveLocalization,
} from '@/features/localization'
import DocumentSelector from '@/features/multiple-documents/DocumentSelector.vue'
import SearchButton from '@/features/Search/components/SearchButton.vue'
import { getSystemModePreference } from '@/helpers/color-mode'
import { downloadDocument } from '@/helpers/download'
import {
  getIdFromUrl,
  makeUrlFromId,
  matchesBasePath,
  redirectUrl,
} from '@/helpers/id-routing'
import {
  INTRODUCTION_ENTRY_ID_SUFFIX,
  isIntroductionEntry,
} from '@/helpers/is-introduction-entry'
import {
  scrollToLazy as _scrollToLazy,
  addToPriorityQueue,
  blockIntersection,
  intersectionEnabled,
} from '@/helpers/lazy-bus'
import {
  loadAuthFromStorage,
  loadClientFromStorage,
} from '@/helpers/load-from-perssistance'
import { mapConfigPlugins } from '@/helpers/map-config-plugins'
import { mapConfigToWorkspaceStore } from '@/helpers/map-config-to-workspace-store'
import {
  normalizeConfigurations,
  type NormalizedConfiguration,
} from '@/helpers/normalize-configurations'
import { safeDeepClone } from '@/helpers/safe-deep-clone'
import { AGENT_CONTEXT_SYMBOL, useAgent } from '@/hooks/use-agent'
import { useIntersection } from '@/hooks/use-intersection'
import { createPluginManager, PLUGIN_MANAGER_SYMBOL } from '@/plugins'
import { persistencePlugin } from '@/plugins/persistence-plugin'

const props = defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?: AnyApiReferenceConfiguration
}>()

defineSlots<{
  'content-start'?(): { breadcrumb: string }
  'content-end'?(): { breadcrumb: string }
  'sidebar-start'?(): { breadcrumb: string }
  'sidebar-end'?(): { breadcrumb: string }
  'editor-placeholder'?(): { breadcrumb: string }
  footer?(): { breadcrumb: string }
}>()

const { copyToClipboard } = useClipboard()

/**
 * Used to inject the environment into built packages
 *
 * Primary use case is the open-in-client button
 */
const isDevelopment = import.meta.env.DEV

/**
 * Whether scrollbars take up screen real estate.
 *
 * This defaults to `false` so the first client render matches the server (where
 * there is no DOM to measure). The real value is resolved in `onMounted` to
 * avoid a hydration mismatch on the root class.
 */
const obtrusiveScrollbars = ref(false)
onMounted(() => {
  obtrusiveScrollbars.value = hasObtrusiveScrollbars()
})

const eventBus = createWorkspaceEventBus({ debug: isDevelopment })
const isSidebarOpen = ref(false)

/**
 * Due to a bug in headless UI, we need to set an ID here that can be shared across server/client
 * TODO remove this once the bug is fixed
 *
 * @see https://github.com/tailwindlabs/headlessui/issues/2979
 */
provideUseId(() => useId())

/**
 * Stable id for the SSR state payload (see `ssrState` below).
 *
 * `useId` returns the same value on the server and the client for a given
 * component position, so the client can find the exact `<script>` the server
 * emitted and hydrate from it. The prefix keeps the id from colliding with the
 * bare ids Headless UI generates from the same sequence.
 */
const ssrStateId = `scalar-ssr-state-${useId()}`

/**
 * True only while the component is being server-rendered.
 *
 * `onServerPrefetch` runs exclusively during `renderToString`, so this flag lets
 * us serialize the store state on the server without relying on a `typeof window`
 * check (which is unreliable under jsdom, where `window` always exists).
 */
const isServerRendering = ref(false)

// ---------------------------------------------------------------------------
/**
 * Configuration Handling
 *
 * We will normalize the configurations and store them in a computed property.
 * The active configuration will be associated with the active document.
 */
const configList = computed(() => normalizeConfigurations(props.configuration))

const isMultiDocument = computed(() => Object.keys(configList.value).length > 1)

/** Search for the source with a default attribute or use the first one */
const activeSlug = ref<string>(
  Object.values(configList.value).find((c) => c.default)?.slug ??
    configList.value[Object.keys(configList.value)?.[0] ?? '']?.slug ??
    '',
)

/**
 * On initial page load we need to determine if there is a valid document slug in the URL
 *
 * If there is we set the active slug to the document slug
 */
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href)

  // To handle legacy query parameter multi-document support we redirect
  // to the new path routing format
  const apiParam = url.searchParams.get('api')
  if (apiParam && configList.value[apiParam]) {
    activeSlug.value = apiParam
    const idFromUrl = getIdFromUrl(
      url,
      configList.value[apiParam].config.pathRouting?.basePath,
      apiParam,
    )
    const newUrl = makeUrlFromId(
      idFromUrl,
      configList.value[apiParam].config.pathRouting?.basePath,
      isMultiDocument.value,
    )
    if (newUrl) {
      newUrl.searchParams.delete('api')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }

  /**
   * For path routing on initial load we do not know which basePath to check for
   * we need to search the configs to see if any of the base paths match the URL
   * and then use that basePath to get the initial id
   *
   * With this approach we cannot support multi-document mode with one of configs having
   * an empty basePath
   *
   * Other conflicts are possible.
   */
  const basePaths = Object.values(configList.value).map(
    (c) => c.config.pathRouting?.basePath,
  )

  const initialId = getIdFromUrl(
    url,
    basePaths.find((p) => (p ? matchesBasePath(url, p) : false)),
    isMultiDocument.value ? undefined : activeSlug.value,
  )
  const documentSlug = initialId.split('/')[0]

  if (documentSlug && configList.value[documentSlug]) {
    activeSlug.value = documentSlug
  }
}

/** Computed document options list for the selector logic */
const documentOptionList = computed(() =>
  Object.values(configList.value).map((c) => ({
    label: c.title,
    id: c.slug,
  })),
)

/**
 * AsyncAPI sidebar filters (protocol + server).
 *
 * These mirror the document picker: stacked dropdowns at the top of the sidebar
 * that narrow the visible operations. State resets whenever the active document
 * changes so a filter never leaks across documents.
 */
const selectedProtocol = ref<string>('')
const selectedServer = ref<string>('')

/** The active document, narrowed to AsyncAPI (or `null` for OpenAPI documents). */
const activeAsyncApiDocument = computed(() => {
  const document = workspaceStore.workspace.activeDocument
  return isAsyncApiDocument(document) ? document : null
})

// Reset the filters when switching documents.
watch(activeSlug, () => {
  selectedProtocol.value = ''
  selectedServer.value = ''
})

/** Configuration overrides to apply to the selected document (from the localhost toolbar) */
const configurationOverrides = ref<
  Partial<Omit<ApiReferenceConfiguration, 'slug' | 'title' | ''>>
>({})

const withLocalizedConfigurationDefaults = (
  config: ApiReferenceConfiguration,
  activeConfig: Partial<ApiReferenceConfiguration> | undefined,
): ApiReferenceConfiguration => {
  const localization = resolveLocalization(config.localization)
  const configuredModelsSectionLabel =
    configurationOverrides.value.modelsSectionLabel ??
    (activeConfig?.modelsSectionLabel !== DEFAULT_MODELS_SECTION_LABEL
      ? activeConfig?.modelsSectionLabel
      : undefined)

  return {
    ...config,
    modelsSectionLabel:
      configuredModelsSectionLabel ??
      localization.translations.models.label ??
      DEFAULT_MODELS_SECTION_LABEL,
  }
}

/** Any dev toolbar modifications are merged with the active configuration */
const mergedConfig = computed<ApiReferenceConfiguration>(() => {
  const activeConfig = configList.value[activeSlug.value]?.config
  const merged = {
    // Provides a default set of values when the lookup fails
    ...coerce(apiReferenceConfigurationSchema, {}),
    // The active configuration based on the slug
    ...activeConfig,
    // Any overrides from the localhost toolbar
    ...configurationOverrides.value,
  }

  return withLocalizedConfigurationDefaults(merged, activeConfig)
})

const apiReferenceLocalization = provideLocalization(
  () => mergedConfig.value.localization,
)

const sidebarOptions = computed(() => ({
  ...mergedConfig.value,
  labels: {
    closeGroup: apiReferenceLocalization.translate('navigation.closeGroup'),
    httpMethod: apiReferenceLocalization.translate('common.httpMethod'),
    openGroup: apiReferenceLocalization.translate('navigation.openGroup'),
  },
}))

/**
 * Locale string for the `lang` attribute. We normalize underscores to hyphens so values like
 * `es_MX` become valid BCP-47 language tags (`es-MX`).
 */
const documentLang = computed(() =>
  apiReferenceLocalization.locale.value.replace('_', '-'),
)

/** Convenience break out var to determine which routing mode we are using */
const basePath = computed(() => mergedConfig.value.pathRouting?.basePath)

const themeStyle = computed(() =>
  getThemeStyles(mergedConfig.value.theme, {
    fonts: mergedConfig.value.withDefaultFonts,
  }),
)

/**
 * Custom CSS plus the theme styles, injected into a single `<style>` tag.
 *
 * This is rendered with `v-html` so the CSS is emitted verbatim. Interpolating
 * it as text content makes Vue HTML-escape characters like `"` into `&quot;` on
 * the server while the client keeps `"`, which both breaks the CSS and causes a
 * hydration mismatch.
 */
const styleContent = computed(
  () => `${mergedConfig.value.customCss ?? ''}\n${themeStyle.value}`,
)

// ---------------------------------------------------------------------------
/** Navigation State Handling */

// Rewrite outdated `model/` and `models/` schema URLs to the current models
// section slug so bookmarks from before the slug changed keep resolving.
if (typeof window !== 'undefined') {
  const canonical = redirectUrl(
    window.location.href,
    slugify(
      mergedConfig.value.modelsSectionLabel ?? DEFAULT_MODELS_SECTION_LABEL,
    ),
    activeSlug.value,
    isMultiDocument.value,
    mergedConfig.value.pathRouting?.basePath,
  )
  if (canonical) {
    window.history.replaceState({}, '', canonical.toString())
  }
}

// Front-end redirect
if (mergedConfig.value.redirect && typeof window !== 'undefined') {
  const newPath = mergedConfig.value.redirect(
    (mergedConfig.value.pathRouting ? window.location.pathname : '') +
      window.location.hash,
  )
  if (newPath) {
    window.history.replaceState({}, '', newPath)
  }
}

/**
 * Sets the active slug and updates the URL with the selected document slug
 *
 * If an element ID is passed in we will configure the path or hash routing
 */
function syncSlugAndUrlWithDocument(
  slug: string,
  elementId: string | undefined,
  config: ApiReferenceConfigurationRaw,
) {
  // We create a new URL and go to the root element if an ID is not provided
  const url = makeUrlFromId(
    elementId || slug,
    config.pathRouting?.basePath,
    isMultiDocument.value,
  )

  if (url) {
    window.history.replaceState({}, '', url.toString())
  }

  // Update the active slug
  activeSlug.value = slug
}

// ---------------------------------------------------------------------------
/** Workspace Store Initialization */

/**
 * Initializes the new client workspace store.
 */
const workspaceStore = createWorkspaceStore({
  verbose: isDevelopment,
})

/**
 * We need to keep the client store separate from the workspace store
 * This is because we want the client store to be a playground where users can test out their requests without affecting the references store
 */
const clientStore = createWorkspaceStore({
  verbose: isDevelopment,
  plugins: [
    persistencePlugin({
      persistAuth: () => mergedConfig.value.persistAuth ?? false,
    }),
  ],
})

// ---------------------------------------------------------------------------
/**
 * SSR state transfer.
 *
 * On the server the document is preloaded (`onServerPrefetch`) before rendering,
 * so the markup already contains the full reference. On the client the document
 * is loaded asynchronously (`onBeforeMount`), which Vue does not wait for — so
 * without help the first client render is an empty loading state and hydration
 * mismatches the server.
 *
 * To keep both sides in sync we serialize the loaded stores into a `<script>`
 * payload during server rendering, then read it back synchronously here so the
 * client's first render already has the document. The redundant client load in
 * `onBeforeMount` then becomes a no-op because the document is already present.
 *
 * This is self-contained: the payload travels inside the component's own markup,
 * so no host wiring is required.
 */

/** Read and apply the server payload synchronously, before the first client render. */
const ssrPayload =
  typeof document !== 'undefined'
    ? (document.getElementById(ssrStateId)?.textContent ?? '')
    : ''

if (ssrPayload) {
  try {
    const state = JSON.parse(ssrPayload)
    workspaceStore.loadWorkspace(state.workspace)
    clientStore.loadWorkspace(state.client)
  } catch (error) {
    console.error('Failed to hydrate Scalar SSR state', error)
  }
}

/**
 * The serialized store state emitted into the markup.
 *
 * Every `<` is escaped so a closing script tag inside the document can never end
 * the payload early. Rendered with `v-html` to avoid Vue escaping the JSON as text.
 */
const ssrState = computed(() => {
  // Client hydration: re-emit the exact bytes the server sent so the node matches.
  if (ssrPayload) {
    return ssrPayload
  }

  // Server render: serialize the freshly loaded stores for the client to pick up.
  if (isServerRendering.value) {
    return JSON.stringify({
      workspace: workspaceStore.exportWorkspace(),
      client: clientStore.exportWorkspace(),
    }).replaceAll('<', '\\u003C')
  }

  // Plain client-only mount: there is nothing to transfer.
  return ''
})

/**
 * Plugin injection is not reactive. All plugins must be provided at first render.
 *
 * Created after the client store so the auth accessor below can read from it — plugin `onInit`
 * hooks may call `auth` synchronously during `notifyInit`. The reference-side Authentication panel
 * (Content → Auth.vue) persists credentials into `clientStore.auth`, so plugins must read the same
 * store to see what the user entered.
 */
const pluginManager = createPluginManager({
  plugins: Object.values(configList.value).flatMap(
    (c) => c.config.plugins ?? [],
  ),
  /**
   * Read-only view of the global authentication state, so plugins can read stored secrets and
   * the selected security schemes without being able to mutate them. Wraps the client store's
   * auth methods (rather than passing the store directly) to keep the setters out of the plugin API.
   *
   * The getters return a deep copy (`export` already snapshots internally, the others go through
   * `toJsonCompatible`) so plugins receive plain data rather than the store's live reactive proxies —
   * mutating what they get back can never leak into the store.
   */
  auth: {
    export: () => clientStore.auth.export(),
    getAuthSecrets: (documentName, schemeName) =>
      toJsonCompatible(
        clientStore.auth.getAuthSecrets(documentName, schemeName),
      ),
    getAuthSelectedSchemas: (payload) =>
      toJsonCompatible(clientStore.auth.getAuthSelectedSchemas(payload)),
  },
})
provide(PLUGIN_MANAGER_SYMBOL, pluginManager)

pluginManager.notifyInit(mergedConfig.value)

watch(mergedConfig, (config) => pluginManager.notifyConfigChange(config))

// TODO: persistence should be hoisted into standalone
// Client side integrations will want to handle dark mode externally
const { toggleColorMode, isDarkMode } = useColorMode({
  initialColorMode: {
    true: 'dark' as const,
    false: 'light' as const,
    undefined: 'system' as const,
  }[String(mergedConfig.value.darkMode)],
  overrideColorMode: mergedConfig.value.forceDarkModeState,
})

/**
 * The active document passed to the search modal. Both OpenAPI and AsyncAPI
 * documents are surfaced so the search index can pick up info.description
 * headings from either spec; AsyncAPI-specific entries (channels, operations,
 * messages) are not indexed yet.
 */
const activeSearchableDocument = computed(
  () => workspaceStore.workspace.activeDocument,
)

/**
 * Sidebar entries contributed by plugin views (content.start / content.end).
 *
 * Each entry reuses the same id as the rendered plugin component, so the existing
 * navigation and scroll-spy logic can scroll to and highlight it. Plugins are static for
 * the lifetime of the manager, so this only needs to be resolved once.
 */
const pluginSidebarEntries = computed(() =>
  pluginManager
    .getSidebarEntries(activeSlug.value)
    .reduce<Record<'content.start' | 'content.end', TraversedEntry[]>>(
      (grouped, entry) => {
        grouped[entry.viewName].push({
          id: entry.id,
          title: entry.label,
          type: 'text',
        })
        return grouped
      },
      { 'content.start': [], 'content.end': [] },
    ),
)

/**
 * Localize the synthetic labels we generate for the sidebar (introduction, webhooks, and the models
 * section). Entries are only cloned when a label actually changes, so the common English-default case
 * does not allocate a new navigation tree on every recompute.
 */
const localizeNavigationEntries = (
  entries: TraversedEntry[],
): TraversedEntry[] => {
  const introductionTitle = apiReferenceLocalization.translate(
    'navigation.introduction',
  )
  const webhooksTitle = apiReferenceLocalization.translate(
    'navigation.webhooks',
  )
  const modelsSectionLabel =
    mergedConfig.value.modelsSectionLabel ?? DEFAULT_MODELS_SECTION_LABEL

  const localize = (list: TraversedEntry[]): TraversedEntry[] => {
    let changed = false

    const result = list.map((entry) => {
      let localized = entry

      if (isIntroductionEntry(entry) && entry.title !== introductionTitle) {
        localized = { ...entry, title: introductionTitle } as TraversedEntry
      } else if (
        entry.type === 'tag' &&
        entry.isWebhooks === true &&
        (entry.title !== webhooksTitle || entry.name !== webhooksTitle)
      ) {
        localized = {
          ...entry,
          title: webhooksTitle,
          name: webhooksTitle,
        } as TraversedEntry
      } else if (
        entry.type === 'models' &&
        (entry.title !== modelsSectionLabel ||
          entry.name !== modelsSectionLabel)
      ) {
        localized = {
          ...entry,
          title: modelsSectionLabel,
          name: modelsSectionLabel,
        } as TraversedEntry
      }

      if ('children' in entry && entry.children) {
        const localizedChildren = localize(entry.children)

        if (localizedChildren !== entry.children) {
          localized =
            localized === entry ? ({ ...entry } as TraversedEntry) : localized
          ;(localized as { children?: TraversedEntry[] }).children =
            localizedChildren
        }
      }

      if (localized !== entry) {
        changed = true
      }

      return localized
    })

    // Preserve the original reference when nothing changed to avoid downstream re-renders.
    return changed ? result : list
  }

  return localize(entries)
}

/**
 * Create top level sidebar entries for each document
 * This allows sharing a single sidebar state for across the workspace
 */
const itemsFromWorkspace = computed<TraversedEntry[]>(() => {
  return Object.entries(workspaceStore.workspace.documents).map(
    ([slug, document]) => {
      // Both OpenAPI and AsyncAPI documents carry an `x-scalar-navigation` tree.
      const children = document['x-scalar-navigation']?.children ?? []

      // Plugin views render once for the active document, so only surface their sidebar
      // entries there. `content.start` sits above the Introduction, `content.end` below.
      const childrenWithPlugins =
        slug === activeSlug.value
          ? [
              ...pluginSidebarEntries.value['content.start'],
              ...localizeNavigationEntries(children),
              ...pluginSidebarEntries.value['content.end'],
            ]
          : localizeNavigationEntries(children)

      return {
        id: slug,
        type: 'document',
        description: document.info.description,
        name: document.info.title ?? slug,
        title: document.info.title ?? slug,
        children: childrenWithPlugins,
      }
    },
  )
})

/** Initialize the sidebar */
const sidebarState = createSidebarState<TraversedEntry>(itemsFromWorkspace, {
  hooks: {},
})

/** Recursively set all children of the given items to open */
const setChildrenOpen = (items: TraversedEntry[]): void => {
  items.forEach((item) => {
    if (item.type === 'tag' || item.type === 'models') {
      sidebarState.setExpanded(item.id, true)
    }
    if ('children' in item && item.children) {
      setChildrenOpen(item.children)
    }
  })
}

/** We get the sub items for the sidebar based on the configuration/document slug */
const sidebarItems = computed<TraversedEntry[]>(() => {
  const config = mergedConfig.value

  if (!config) {
    return []
  }

  const rawDocItems =
    sidebarState.items.value.find(
      (item): item is TraversedTag => item.id === activeSlug.value,
    )?.children ?? []

  // Apply the AsyncAPI protocol/server filters to the sidebar tree. This is a no-op
  // for OpenAPI documents and when no filter is selected.
  const docItems = activeAsyncApiDocument.value
    ? filterAsyncApiNavigation(rawDocItems, activeAsyncApiDocument.value, {
        protocol: selectedProtocol.value,
        server: selectedServer.value,
      })
    : rawDocItems

  // When the default open all tags configuration is enabled we open all the children of the document
  if (config.defaultOpenAllTags) {
    setChildrenOpen(docItems)
  }

  // When the expand all model sections configuration is enabled we open all the children of the models tag
  if (config.expandAllModelSections) {
    const models = docItems.find(
      (item): item is TraversedTag => item.type === 'models',
    )
    if (models) {
      sidebarState.setExpanded(models.id, true)
      models.children?.forEach((child) => {
        sidebarState.setExpanded(child.id, true)
      })
    }
  }

  return docItems
})

/** Find the sidebar entry that represents the introduction section */
const infoSectionId = computed(
  () =>
    sidebarItems.value.find(isIntroductionEntry)?.id ??
    `${activeSlug.value}${INTRODUCTION_ENTRY_ID_SUFFIX}`,
)

/** User for mobile navigation */
const breadcrumb = ref('')

const slotProps = computed(() => ({
  breadcrumb: breadcrumb.value,
}))

const setBreadcrumb = (id: string) => {
  const item = sidebarState.getEntryById(id)

  if (!item || item.type === 'document') {
    breadcrumb.value = ''
  } else {
    breadcrumb.value = item.title
  }
}

const scrollToLazyElement = (id: string) => {
  setBreadcrumb(id)
  sidebarState.setSelected(id)
  _scrollToLazy(id, sidebarState.setExpanded, sidebarState.getEntryById)
}

/**
 * Updates the browser tab title via the user-provided `setPageTitle` callback.
 *
 * Called whenever the section in view changes — on sidebar clicks, on scroll, and
 * when switching documents — so the tab title always reflects what the reader sees.
 */
const updatePageTitle = (id: string) => {
  const setPageTitle = mergedConfig.value?.setPageTitle
  const entry = sidebarState.getEntryById(id)

  if (!setPageTitle || typeof document === 'undefined' || !entry?.title) {
    return
  }

  const activeDocument = workspaceStore.workspace.activeDocument

  document.title = setPageTitle({
    title: entry.title,
    document: {
      title: activeDocument?.info?.title ?? activeSlug.value,
      slug: activeSlug.value,
    },
  })
}

/** Maps some config values to the workspace store to keep it reactive */
mapConfigToWorkspaceStore({
  config: () => mergedConfig.value,
  store: workspaceStore,
  isDarkMode,
})

mapConfigToWorkspaceStore({
  config: () => mergedConfig.value,
  store: clientStore,
  isDarkMode,
})

/** Merged environment variables from workspace and document levels */
const environment = computed(
  () =>
    getActiveEnvironment(
      workspaceStore,
      workspaceStore.workspace.activeDocument ?? null,
    ).environment,
)

if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => workspaceStore
}

// For testing
defineExpose({
  eventBus,
  workspaceStore,
  sidebarItems,
})

/**
 * Computes a mapping from model names to their sidebar entry IDs.
 * This is used for quick lookups and navigation within the sidebar.
 */
const modelsIndex = computed(() => {
  return sidebarItems.value
    .filter((item) => item.type === 'models')
    .flatMap((item) => item.children ?? [])
    .filter((item) => item.type === 'model')
    .reduce(
      (acc, item) => {
        acc[item.name] = item.id
        return acc
      },
      {} as Record<string, string>,
    )
})

eventBus.on('scroll-to:model-by-name', ({ name }) => {
  /** Find the model in the models index */
  const model = modelsIndex.value[name]

  if (model) {
    scrollToLazyElement(model)
  }
})

const addDocument: typeof workspaceStore.addDocument = async (
  input,
  navigationOptions,
) => {
  const result = await workspaceStore.addDocument(input, navigationOptions)
  // Now add it to the client store
  const state = workspaceStore.exportWorkspace()
  clientStore.loadWorkspace({
    auth: {},
    documents: {
      [input.name]: safeDeepClone(state.documents[input.name]) ?? {
        'openapi': '3.1.0',
        'info': {
          title: '',
          version: '',
        },
        'x-scalar-original-document-hash': '',
      },
    },
    intermediateDocuments: {},
    originalDocuments: {},
    overrides: {},
    history: {},
    meta: {},
  })
  return result
}

// ---------------------------------------------------------------------------
// Document Management

/**
 * Handle changing the active document
 *
 * 1. If the document has not be loaded to the workspace store we set it to empty and asynchronously load it
 * 2. If the document has been loaded to the workspace store we just set it to active
 * 3. If the content from the configuration has changes we need to update the document in the workspace store
 */
const changeSelectedDocument = async (
  slug: string,
  elementId?: string | undefined,
) => {
  const normalized = configList.value[slug]

  if (!normalized) {
    console.warn(`Document ${slug} not found in configList`)
    return
  }

  const config = withLocalizedConfigurationDefaults(
    {
      ...normalized.config,
      ...configurationOverrides.value,
    },
    normalized.config,
  )

  // Store `onDocumentSelect` result to await its execution later, before calling `onLoaded`
  const onDocumentSelectPromise = config.onDocumentSelect?.()

  // Set the active slug and update any routing
  syncSlugAndUrlWithDocument(slug, elementId, config)

  // Update the document on the route as well, the method and path don't matter as we update them before opening
  apiClient.value?.route({
    documentSlug: slug,
    method: 'get',
    path: '/',
  })

  const isFirstLoad = !workspaceStore.workspace.documents[slug]

  // If the document is not in the store, we asynchronously load it
  if (isFirstLoad) {
    const result = await addDocument(
      normalized.source.url
        ? {
            name: slug,
            url: normalized.source.url,
            fetch: config.customFetch,
          }
        : {
            name: slug,
            document: normalized.source.content ?? {},
          },
      config,
    )

    const document = clientStore.workspace.documents[slug]

    // If the document does not have a selected server we set it to the first server
    if (
      result === true &&
      isOpenApiDocument(document) &&
      document['x-scalar-selected-server'] === undefined
    ) {
      // Set the active server if the document is loaded successfully
      const servers = getServers(
        normalized.config.servers ?? document.servers,
        {
          baseServerUrl: mergedConfig.value.baseServerURL,
          documentUrl: normalized.source.url,
        },
      )
      if (servers.length > 0) {
        clientStore.updateDocument(
          slug,
          'x-scalar-selected-server',
          servers[0]!.url,
        )
      }
    }
  }

  // Always set it to active; if the document is null we show a loading state
  workspaceStore.update('x-scalar-active-document', slug)
  clientStore.update('x-scalar-active-document', slug)

  // If the document has persistence enabled we load the auth schemes from storage
  if (config.persistAuth) {
    loadAuthFromStorage(clientStore, slug)
  }

  // ensure that `onLoaded` hook doesn't block execution but is executed after `onDocumentSelect`
  void (async () => {
    await onDocumentSelectPromise
    void config.onLoaded?.(slug)
  })()

  // When loading to a specified element we need to freeze and scroll
  if (elementId && elementId !== slug) {
    scrollToLazyElement(elementId)
  }
  // If there is no child element of the document specified and defaultOpenFirstTag is enabled, we expand the first tag
  else if (config.defaultOpenFirstTag) {
    const firstTag = sidebarItems.value.find((item) => item.type === 'tag')
    if (firstTag) {
      sidebarState.setExpanded(firstTag.id, true)
    }
  }

  // Reflect the freshly selected document in the browser tab title
  updatePageTitle(elementId && elementId !== slug ? elementId : slug)
}

/**
 * TODO:Move this to a dedicated updateDocument function in the future and
 * away from vue-reactivity based updates
 */
watch(
  () => Object.values(configList.value),
  async (newConfigList, oldConfigList) => {
    /**
     * Handles replacing and updating documents within the workspace store
     * when we detect configuration changes.
     */
    const updateSource = async (
      updated: NormalizedConfiguration,
      previous: NormalizedConfiguration | undefined,
    ) => {
      const config = withLocalizedConfigurationDefaults(
        {
          ...updated.config,
          ...configurationOverrides.value,
        },
        updated.config,
      )

      /** If we have not loaded the document previously we don't need to handle any updates to store */
      if (!workspaceStore.workspace.documents[updated.slug]) {
        return
      }
      /** If the URL has changed we fetch and rebase */
      if (updated.source.url && updated.source.url !== previous?.source.url) {
        await addDocument(
          {
            name: updated.slug,
            url: updated.source.url,
            fetch: config.customFetch,
          },
          config,
        )

        return
      }

      // If the was not a URL change then we require a document to continue
      if (!updated.source.content) {
        return
      }

      /**
       * We need to deeply check for document changes. Parse documents and then only rebase
       * if we detect deep changes in the two sources
       */
      if (
        diff(
          updated.source.content,
          previous && 'content' in previous.source
            ? (previous.source.content ?? {})
            : {},
        ).length
      ) {
        await addDocument(
          {
            name: updated.slug,
            document: updated.source.content,
          },
          config,
        )
      }
    }

    newConfigList.forEach((newConfig, index) =>
      updateSource(newConfig, oldConfigList[index]),
    )

    const newSlugs = newConfigList.map((c) => c.slug)
    const oldSlugs = oldConfigList.map((c) => c.slug)

    // If the slugs have changed, we need to update the active document and the URL query param
    if (
      newSlugs.length !== oldSlugs.length ||
      !newSlugs.every((slug, index) => slug === oldSlugs[index])
    ) {
      await changeSelectedDocument(newSlugs[0] ?? '')
    }
  },
  {
    deep: true,
  },
)

/** Preload the first document during SSR and flag the render so state is serialized */
onServerPrefetch(async () => {
  isServerRendering.value = true
  await changeSelectedDocument(activeSlug.value)
})

/** Load the first document on page load */
onBeforeMount(async () => {
  // We read the client from the client store so we need to set it to the client store
  loadClientFromStorage(clientStore)

  await changeSelectedDocument(
    activeSlug.value,
    getIdFromUrl(
      window.location.href,
      configList.value[activeSlug.value]?.config.pathRouting?.basePath,
      isMultiDocument.value ? undefined : activeSlug.value,
    ),
  )
})

const documentUrl = computed(() => {
  return configList.value[activeSlug.value]?.source?.url
})

// --------------------------------------------------------------------------- */
// Agent Scalar

/**
 * Determines if Agent Scalar should be enabled based on the configuration and the current URL
 *
 * - If the agent is disabled in the configuration, it should not be enabled
 * - If the current URL is a local URL, it should be enabled
 * - If the agent key is set, it should be enabled
 */
const agent = useAgent({
  agentEnabled: computed(() => {
    const currentConfiguration = configList.value[activeSlug.value]

    if (currentConfiguration?.agent?.disabled) {
      return false
    }

    if (typeof window !== 'undefined' && isLocalUrl(window.location.href)) {
      return true
    }

    return Boolean(configList.value[activeSlug.value]?.agent?.key)
  }),
})
provide(AGENT_CONTEXT_SYMBOL, agent)

// --------------------------------------------------------------------------- */
// Api Client Modal

// Setup the ApiClient on mount.
// The modal is dynamic-imported so its dependency graph (CodeMirror, the request
// editor, the response viewer, etc.) becomes a separate chunk that loads
// asynchronously after the API reference paints.
const modal = useTemplateRef<HTMLElement>('modal')
const apiClient = ref<ApiClientModal | null>(null)
onMounted(async () => {
  if (!modal.value) {
    return
  }

  const { createApiClientModal } = await import('@scalar/api-client/modal')

  // Bail if the component unmounted while the chunk was loading.
  if (!modal.value) {
    return
  }

  apiClient.value = createApiClientModal({
    el: modal.value,
    eventBus,
    workspaceStore: clientStore,
    options: mergedConfig,
    plugins: [
      ...pluginManager.getApiClientPlugins(),
      ...mapConfigPlugins(mergedConfig, environment),
    ],
  })
})
onBeforeUnmount(() => {
  pluginManager.notifyDestroy()
  apiClient.value?.app.unmount()
})

// ---------------------------------------------------------------------------
// Top level event handlers and user specified callbacks

/** Ensure we call the onServerChange callback */
eventBus.on('server:update:selected', ({ url }) =>
  mergedConfig.value.onServerChange?.(url),
)

/**
 * AsyncAPI servers are keyed by name, so resolve the selected name to its
 * constructed connection URL before firing onServerChange, keeping the callback
 * payload consistent with OpenAPI (a URL string).
 */
eventBus.on('asyncapi-server:update:selected', ({ name }) => {
  const document = clientStore.workspace.activeDocument
  if (!isAsyncApiDocument(document)) {
    return
  }

  const server = getAsyncApiServers(document, { webSocketOnly: false }).find(
    (s) => s.name === name,
  )
  mergedConfig.value.onServerChange?.(server?.url ?? name)
})

/** Download the document from the store */
eventBus.on('ui:download:document', ({ format }) => {
  const document = workspaceStore.exportActiveDocument(format)

  if (!document) {
    console.error('No document found to download')
    return
  }

  void downloadDocument(document, activeSlug.value ?? 'openapi', format)
})

// ---------------------------------------------------------------------------
// Local event and scroll handling

/**
 * Handler for a direct navigation event such as a sidebar or search click
 *
 * Depending on the item type we handle a selection event differently:
 *
 * - Tag: If a tag is closed we open it and all its parents and scroll to it
 *        If a tag is open we just close the tag
 * - Operation:
 *        Open all parents and scroll to the operation
 */
const handleSelectSidebarEntry = (id: string, caller?: 'sidebar') => {
  const item = sidebarState.getEntryById(id)

  updatePageTitle(id)

  if (
    (item?.type === 'tag' ||
      item?.type === 'models' ||
      item?.type === 'text') &&
    sidebarState.isExpanded(id) && // Only close if the item is expanded
    sidebarState.selectedItem.value === id // Only close if the item is not the currently selected item
  ) {
    // hack until we fix intersection logic
    const unblock = blockIntersection()

    sidebarState.setExpanded(id, false)

    unblock()

    return
  }

  // Close the mobile menu upon selecting any item that's not a tag or model
  if (item?.type !== 'tag' && item?.type !== 'models') {
    isSidebarOpen.value = false
  }

  scrollToLazyElement(id)

  const url = makeUrlFromId(id, basePath.value, isMultiDocument.value)
  if (url) {
    window.history.pushState({}, '', url)

    // Trigger the onSidebarClick callback if the caller is sidebar
    if (caller === 'sidebar') {
      mergedConfig.value.onSidebarClick?.(url.toString())
    }
  }

  if (agent.showAgent.value) {
    agent.closeAgent()
  }
}

/** Handle a navigation item selection event */
eventBus.on('select:nav-item', ({ id }) => handleSelectSidebarEntry(id))

/** Handle a scroll to navigation item event */
eventBus.on('scroll-to:nav-item', ({ id }) => handleSelectSidebarEntry(id))

/** Handle an intersecting navigation item event */
eventBus.on('intersecting:nav-item', ({ id }) => {
  if (!intersectionEnabled.value) {
    return
  }

  sidebarState.setSelected(id)
  setBreadcrumb(id)

  // Keep the browser tab title in sync with the section scrolled into view
  updatePageTitle(id)

  // Scroll the sidebar to keep the selected element near the top
  scrollSidebarToTop(id)

  const url = makeUrlFromId(id, basePath.value, isMultiDocument.value)
  if (url && workspaceStore.workspace.activeDocument) {
    window.history.replaceState({}, '', url.toString())
  }
})

eventBus.on('toggle:nav-item', ({ id, open }) => {
  if (open) {
    mergedConfig.value.onShowMore?.(id)

    // Pre-queue first child so it renders immediately when the tag expands
    const entry = sidebarState.getEntryById(id)
    if (entry && 'children' in entry && entry.children) {
      const first = entry.children[0]

      if (first) {
        addToPriorityQueue(first.id)
      }
    }
  }
  sidebarState.setExpanded(id, open ?? !sidebarState.isExpanded(id))
})

eventBus.on('copy-url:nav-item', ({ id }) => {
  const url = makeUrlFromId(
    id,
    basePath.value,
    isMultiDocument.value,
  )?.toString()
  return url && copyToClipboard(url)
})

// ---------------------------------------------------------------------------
// History and scroll restoration

onBeforeMount(() => {
  window.history.scrollRestoration = 'manual'
  // Ensure we add our scalar wrapper class to the headless ui root, mounted is too late
  addScalarClassesToHeadless()

  // When we detect a back button press we scroll to the new id
  window.addEventListener('popstate', () => {
    const id = getIdFromUrl(
      window.location.href,
      mergedConfig.value.pathRouting?.basePath,
      isMultiDocument.value ? undefined : activeSlug.value,
    )
    if (id) {
      scrollToLazyElement(id)
    }
  })
})

// ---------------------------------------------------------------------------
// Document start intersection observer

const documentStartRef = useTemplateRef<HTMLElement>('documentStartRef')

/**
 * Uses `immediate` so the sentinel fires as soon as it enters the viewport (not just at the center strip).
 * When the user scrolls away from the top, both this observer and the first section's center-strip
 * observer are intersecting simultaneously, so the section observer does not re-fire on its own.
 * The `onExit` callback bridges that gap by finding whichever section is at the viewport center
 * and re-emitting the nav event for it.
 *
 * We emit the Introduction entry rather than the document slug so this sentinel and the Introduction
 * section's own intersection observer resolve to the same entry. Otherwise the two race at the top of
 * the document and the tab title flickers between the section title and the document title.
 */
useIntersection(
  documentStartRef,
  () => {
    eventBus.emit('intersecting:nav-item', { id: infoSectionId.value })
  },
  {
    onExit: () => {
      const centerY = window.innerHeight / 2
      const section = document
        .elementsFromPoint(window.innerWidth / 2, centerY)
        .find((el) => el.tagName === 'SECTION' && el.id)

      if (section?.id) {
        eventBus.emit('intersecting:nav-item', { id: section.id })
      }
    },
    immediate: true,
  },
)

const colorMode = computed(() => {
  const mode = workspaceStore.workspace['x-scalar-color-mode']

  if (mode === 'system') {
    return getSystemModePreference()
  }

  return mode
})

const bodyScrollLocked = useScrollLock(
  typeof document !== 'undefined' ? document.body : null,
)

watch(agent.showAgent, () => (bodyScrollLocked.value = agent.showAgent.value))

const showMCPButton = computed(() => {
  if (mergedConfig.value.mcp?.disabled) {
    return false
  }

  if (typeof window !== 'undefined' && isLocalUrl(window.location.href)) {
    return true
  }

  if (mergedConfig.value.mcp) {
    return true
  }

  return false
})
</script>

<template>
  <!-- SingleApiReference -->
  <div>
    <!-- Inject any custom CSS directly into a style tag -->
    <!-- eslint-disable vue/no-v-text-v-html-on-component -->
    <component
      :is="'style'"
      v-html="styleContent" />
    <!-- SSR state so the client can hydrate the document synchronously (see `ssrState`) -->
    <component
      :is="'script'"
      v-if="ssrState"
      :id="ssrStateId"
      type="application/json"
      v-html="ssrState" />
    <!-- eslint-enable vue/no-v-text-v-html-on-component -->
    <div
      ref="documentEl"
      class="scalar-app scalar-api-reference references-layout"
      :class="[
        {
          'scalar-api-references-standalone-mobile': mergedConfig.showSidebar,
          'scalar-scrollbars-obtrusive': obtrusiveScrollbars,
          'references-editable': mergedConfig.isEditable,
          'references-sidebar': mergedConfig.showSidebar,
          'references-sidebar-mobile-open': isSidebarOpen,
          'references-classic': mergedConfig.layout === 'classic',
        },
        $attrs.class,
      ]"
      :dir="apiReferenceLocalization.direction.value"
      :lang="documentLang">
      <!-- Agent Scalar -->
      <AgentScalarDrawer
        v-if="agent.agentEnabled.value"
        :agentScalarConfiguration="configList[activeSlug]?.agent"
        :externalUrls="mergedConfig.externalUrls"
        :workspaceStore />

      <!-- Mobile Header and Sidebar when in modern layout -->

      <MobileHeader
        v-if="mergedConfig.layout === 'modern'"
        :breadcrumb="breadcrumb"
        :isSidebarOpen="isSidebarOpen"
        :showSidebar="mergedConfig.showSidebar"
        @toggleSidebar="() => (isSidebarOpen = !isSidebarOpen)">
        <template #search>
          <SearchButton
            v-if="!mergedConfig.hideSearch"
            class="my-2"
            :document="activeSearchableDocument"
            :eventBus="eventBus"
            :hideModels="mergedConfig.hideModels"
            :modelsSectionLabel="mergedConfig.modelsSectionLabel"
            :searchHotKey="mergedConfig.searchHotKey"
            :showSidebar="mergedConfig.showSidebar" />
        </template>
        <template #sidebar="{ sidebarClasses }">
          <ScalarSidebar
            v-if="mergedConfig.showSidebar && mergedConfig.layout === 'modern'"
            :aria-label="
              apiReferenceLocalization.translate('navigation.sidebarFor', {
                name:
                  workspaceStore.workspace.activeDocument?.info?.title ?? '',
              })
            "
            class="t-doc__sidebar"
            :class="sidebarClasses"
            :isExpanded="sidebarState.isExpanded"
            :isSelected="sidebarState.isSelected"
            :items="sidebarItems"
            layout="reference"
            :options="sidebarOptions"
            role="navigation"
            @selectItem="(id) => handleSelectSidebarEntry(id, 'sidebar')"
            @toggleGroup="
              (id: string) =>
                sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
            ">
            <template #header>
              <!-- Wrap in a div when slot is filled -->
              <DocumentSelector
                v-if="documentOptionList.length > 1"
                :modelValue="activeSlug"
                :options="documentOptionList"
                @update:modelValue="changeSelectedDocument" />

              <!-- Search -->
              <div
                v-if="!mergedConfig.hideSearch"
                class="flex gap-1.5 px-3 pt-3">
                <SearchButton
                  :document="activeSearchableDocument"
                  :eventBus="eventBus"
                  :hideModels="mergedConfig.hideModels"
                  :modelsSectionLabel="mergedConfig.modelsSectionLabel"
                  :searchHotKey="mergedConfig.searchHotKey" />

                <AgentScalarButton v-if="agent.agentEnabled.value" />
              </div>

              <!-- Sidebar Start -->
              <slot
                name="sidebar-start"
                v-bind="slotProps" />
            </template>
            <template #before>
              <!-- AsyncAPI protocol + server filters (only render with >1 choice) -->
              <AsyncApiSidebarFilters
                v-model:protocol="selectedProtocol"
                v-model:server="selectedServer"
                :document="activeAsyncApiDocument" />
              <ScalarSidebarSection
                v-if="activeAsyncApiDocument"
                class="asyncapi-sidebar-document-section">
                Document
              </ScalarSidebarSection>
            </template>
            <template #footer>
              <slot
                name="sidebar-end"
                v-bind="slotProps">
                <!-- We default the sidebar footer to the standard scalar elements -->
                <ScalarSidebarFooter class="darklight-reference">
                  <OpenApiClientButton
                    v-if="!mergedConfig.hideClientButton && !showMCPButton"
                    buttonSource="sidebar"
                    :integration="mergedConfig._integration"
                    :isDevelopment="isDevelopment"
                    :url="documentUrl" />
                  <OpenMCPButton
                    v-if="showMCPButton"
                    :config="mergedConfig.mcp"
                    :externalUrls="mergedConfig.externalUrls"
                    :isDevelopment="isDevelopment"
                    :url="documentUrl"
                    :workspace="workspaceStore" />
                  <template #description>
                    <a
                      class="no-underline hover:underline"
                      href="https://www.scalar.com"
                      target="_blank">
                      {{
                        apiReferenceLocalization.translate(
                          'footer.poweredByScalar',
                        )
                      }}
                    </a>
                  </template>
                  <!-- Override the dark mode toggle slot to hide it -->
                  <template #toggle>
                    <ScalarColorModeToggleButton
                      v-if="
                        !mergedConfig.hideDarkModeToggle &&
                        !mergedConfig.forceDarkModeState
                      "
                      :modelValue="colorMode === 'dark'"
                      @update:modelValue="() => toggleColorMode()" />
                    <span v-else />
                  </template>
                </ScalarSidebarFooter>
              </slot>
            </template>
          </ScalarSidebar>
        </template>
      </MobileHeader>

      <!-- Primary Content -->
      <main
        :aria-label="
          apiReferenceLocalization.translate('navigation.mainContent', {
            name: workspaceStore.workspace.activeDocument?.info?.title ?? '',
          })
        "
        class="references-rendered"
        :inert="agent.showAgent.value">
        <Content
          :authStore="clientStore.auth"
          :clientDocument="clientStore.workspace.activeDocument"
          :document="workspaceStore.workspace.activeDocument"
          :documentSlug="activeSlug"
          :environment
          :eventBus
          :expandedItems="sidebarState.expandedItems.value"
          :headingSlugGenerator="
            mergedConfig.generateHeadingSlug ??
            ((heading) => `${activeSlug}/description/${heading.slug}`)
          "
          :infoSectionId
          :items="sidebarItems"
          :options="mergedConfig"
          :xScalarDefaultClient="
            clientStore.workspace['x-scalar-default-client']
          "
          :xScalarDefaultExample="
            clientStore.workspace['x-scalar-default-example']
          ">
          <template #start>
            <!-- Placeholder intersection observer that emits an empty string to clear the hash when scrolled to the top -->
            <div ref="documentStartRef" />

            <DeveloperTools
              v-if="workspaceStore.workspace.activeDocument"
              v-model:overrides="configurationOverrides"
              class="references-developer-tools"
              :configuration="mergedConfig"
              :externalUrls="mergedConfig.externalUrls"
              :workspace="workspaceStore" />

            <ClassicHeader v-if="mergedConfig.layout === 'classic'">
              <div class="w-64 empty:hidden">
                <DocumentSelector
                  v-if="documentOptionList.length > 1"
                  :modelValue="activeSlug"
                  :options="documentOptionList"
                  @update:modelValue="changeSelectedDocument" />
              </div>
              <SearchButton
                v-if="!mergedConfig.hideSearch"
                class="t-doc__sidebar max-w-64"
                :document="activeSearchableDocument"
                :eventBus="eventBus"
                :hideModels="mergedConfig.hideModels"
                :modelsSectionLabel="mergedConfig.modelsSectionLabel"
                :searchHotKey="mergedConfig.searchHotKey" />
              <template #dark-mode-toggle>
                <ScalarColorModeToggleIcon
                  v-if="
                    !mergedConfig.hideDarkModeToggle &&
                    !mergedConfig.forceDarkModeState
                  "
                  class="text-c-2 hover:text-c-1"
                  :mode="colorMode"
                  style="transform: scale(1.4)"
                  variant="icon"
                  @click="() => toggleColorMode()" />
              </template>
            </ClassicHeader>
            <slot
              name="content-start"
              v-bind="slotProps" />
          </template>
          <!-- TODO: Remove this; we no longer directly support an inline editor -->
          <template
            v-if="mergedConfig.isEditable"
            #empty-state>
            <slot
              name="editor-placeholder"
              v-bind="slotProps" />
          </template>
          <template #end>
            <slot
              name="content-end"
              v-bind="slotProps" />
          </template>
        </Content>
      </main>
      <!-- Optional Footer -->
      <div
        v-if="$slots.footer"
        class="references-footer">
        <slot
          name="footer"
          v-bind="slotProps" />
      </div>
      <!-- Client Modal mount point -->
      <div ref="modal" />
    </div>
    <ScalarToasts />
  </div>
</template>

<style>
/* Add base styles to the body. Removed browser default margins for a better experience. */
@layer scalar-base {
  body {
    margin: 0;
    background-color: var(--scalar-background-1);
  }
}
/** Used to check if css is loaded */
:root {
  --scalar-loaded-api-reference: true;
}

.asyncapi-sidebar-document-section > .group\/spacer-after {
  height: 0;
}
</style>
<style scoped>
/* Configurable Layout Variables */
@layer scalar-config {
  .scalar-api-reference {
    /* The header height */
    --refs-header-height: calc(
      var(--scalar-custom-header-height, 0px) + var(--scalar-header-height, 0px)
    );
    /* The offset of visible references content (minus headers) */
    --refs-viewport-offset: calc(
      var(--refs-header-height, 0px) + var(--refs-content-offset, 0px)
    );
    /* The calculated height of visible references content (minus headers) */
    --refs-viewport-height: calc(
      var(--full-height, 100dvh) - var(--refs-viewport-offset, 0px)
    );
    /* The width of the sidebar */
    --refs-sidebar-width: var(--scalar-sidebar-width, 0px);
    /* The height of the sidebar */
    --refs-sidebar-height: calc(
      var(--full-height, 100dvh) - var(--refs-header-height, 0px)
    );
    /* The maximum width of the content column */
    --refs-content-max-width: var(--scalar-content-max-width, 1540px);
  }

  .scalar-api-reference.references-classic {
    /* Classic layout is wider */
    --refs-content-max-width: var(--scalar-content-max-width, 1420px);
    min-height: 100dvh;
    --refs-sidebar-width: 0;
  }
}
.t-doc__sidebar {
  z-index: 10;
}

/* ----------------------------------------------------- */
/* References Layout */
.references-layout {
  /* Try to fill the container */
  min-height: 100dvh;
  min-width: 100%;
  max-width: 100%;
  flex: 1;

  /*
  Calculated by a resize observer and set in the style attribute
  Falls back to the viewport height
  */
  --full-height: 100dvh;

  /* Grid layout */
  display: grid;
  grid-template-rows: var(--scalar-header-height, 0px) repeat(2, auto);
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'header header'
    'navigation rendered'
    'footer footer';

  background: var(--scalar-background-1);
}

.references-editor {
  grid-area: editor;
  display: flex;
  min-width: 0;
  background: var(--scalar-background-1);
}

.references-rendered {
  position: relative;
  grid-area: rendered;
  min-width: 0;
  background: var(--scalar-background-1);
}
.scalar-api-reference.references-classic,
.references-classic .references-rendered {
  height: initial !important;
  max-height: initial !important;
}

@layer scalar-config {
  .references-sidebar {
    /* Set a default width if references are enabled */
    --refs-sidebar-width: var(--scalar-sidebar-width, 288px);
  }
}

/* Footer */
.references-footer {
  grid-area: footer;
}
/* ----------------------------------------------------- */
/* Responsive / Mobile Layout */

/*
 * Stop just below the `lg` breakpoint (1000px). The sidebar visibility is driven
 * by Tailwind's `lg:` variant, which is `min-width: 1000px` and therefore treats
 * exactly 1000px as desktop. A `max-width: 1000px` query would make the grid
 * switch to the mobile (stacked) layout at the very same width, so the desktop
 * sidebar would render on top of the content. `width < 1000px` is the exact
 * complement of `lg:` (`width >= 1000px`), keeping the two in sync.
 */
@media (width < 1000px) {
  /* Keep toolbar hidden on mobile without forcing desktop display mode. */
  .references-developer-tools {
    display: none;
  }

  /* Stack view on mobile */
  .references-layout {
    /* Adjust the sidebar height to the viewport height minus the header height */
    --refs-sidebar-height: calc(
      var(--full-height, 100dvh) - var(--scalar-custom-header-height, 0px)
    );

    grid-template-columns: 100%;
    grid-template-rows: var(--scalar-header-height, 0px) 0px auto auto;

    grid-template-areas:
      'header'
      'navigation'
      'rendered'
      'footer';
  }
  .references-editable {
    grid-template-areas:
      'header'
      'navigation'
      'editor';
  }

  .references-rendered {
    position: static;
  }
}
</style>
<style scoped>
/**
* Sidebar CSS for standalone
* TODO: @brynn move this to the sidebar block OR the ApiReferenceStandalone component
* when the new elements are available
*/
/* Match the layout breakpoint above so the mobile header height is only applied below `lg`. */
@media (width < 1000px) {
  .scalar-api-references-standalone-mobile:not(.references-classic) {
    --scalar-header-height: 50px;
  }
}
</style>
<style scoped>
.darklight-reference {
  width: 100%;
  margin-top: auto;
}
</style>
