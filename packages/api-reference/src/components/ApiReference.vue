<script setup lang="ts">
import { provideUseId } from '@headlessui/vue'
import { OpenApiClientButton } from '@scalar/api-client/components'
import { LAYOUT_SYMBOL } from '@scalar/api-client/hooks'
import {
  addScalarClassesToHeadless,
  ScalarColorModeToggleButton,
  ScalarColorModeToggleIcon,
  ScalarSidebarFooter,
} from '@scalar/components'
import { redirectToProxy } from '@scalar/oas-utils/helpers'
import { dereference } from '@scalar/openapi-parser'
import { createSidebarState, ScalarSidebar } from '@scalar/sidebar'
import { getThemeStyles, hasObtrusiveScrollbars } from '@scalar/themes'
import {
  apiReferenceConfigurationSchema,
  type AnyApiReferenceConfiguration,
  type ApiReferenceConfiguration,
  type ApiReferenceConfigurationRaw,
} from '@scalar/types/api-reference'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { ScalarToasts } from '@scalar/use-toasts'
import {
  createWorkspaceStore,
  type UrlDoc,
} from '@scalar/workspace-store/client'
import { onCustomEvent } from '@scalar/workspace-store/events'
import type {
  TraversedEntry,
  TraversedTag,
} from '@scalar/workspace-store/schemas/navigation'
import diff from 'microdiff'
import {
  computed,
  onBeforeMount,
  onServerPrefetch,
  provide,
  ref,
  useId,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue'

import ClassicHeader from '@/components/ClassicHeader.vue'
import Content from '@/components/Content/Content.vue'
import IntersectionObserver from '@/components/IntersectionObserver.vue'
import {
  addLazyCompleteCallback,
  freeze,
  intersectionEnabled,
  scrollToLazy,
} from '@/components/Lazy/lazyBus'
import MobileHeader from '@/components/MobileHeader.vue'
import DocumentSelector from '@/features/multiple-documents/DocumentSelector.vue'
import SearchButton from '@/features/Search/components/SearchButton.vue'
import ApiReferenceToolbar from '@/features/toolbar/ApiReferenceToolbar.vue'
import { getIdFromUrl, makeUrlFromId } from '@/hooks/id-routing'
import { downloadDocument } from '@/libs/download'
import { createPluginManager, PLUGIN_MANAGER_SYMBOL } from '@/plugins'
import { mapConfigToClientStore } from '@/v2/helpers/map-config-to-client-store'
import { mapConfigToWorkspaceStore } from '@/v2/helpers/map-config-to-workspace-store'
import { mapConfiguration } from '@/v2/helpers/map-configuration'
import {
  normalizeConfigurations,
  type NormalizedConfiguration,
} from '@/v2/helpers/normalize-configurations'
import { useWorkspaceStoreEvents } from '@/v2/hooks/use-workspace-store-events'

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

if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => workspaceStore
}

const root = useTemplateRef('root')
const { mediaQueries } = useBreakpoints()
const { copyToClipboard } = useClipboard()

/**
 * Used to inject the environment into built packages
 *
 * Primary use case is the open-in-client button
 */
const isDevelopment = import.meta.env.DEV

const obtrusiveScrollbars = computed(hasObtrusiveScrollbars)

const isSidebarOpen = ref(false)

watch(mediaQueries.lg, (newValue, oldValue) => {
  // Close the drawer when we go from desktop to mobile
  if (oldValue && !newValue) {
    isSidebarOpen.value = false
  }
})

watchEffect(() => {
  console.log('is large desktop', mediaQueries.lg.value)
})

/**
 * Due to a bug in headless UI, we need to set an ID here that can be shared across server/client
 * TODO remove this once the bug is fixed
 *
 * @see https://github.com/tailwindlabs/headlessui/issues/2979
 */
provideUseId(() => useId())

// Provide the client layout
provide(LAYOUT_SYMBOL, 'modal')

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
    basePaths.find(
      (p) => p && url.pathname.startsWith(p.startsWith('/') ? p : `/${p}`),
    ),
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

/** Configuration overrides to apply to the selected document (from the localhost toolbar) */
const configurationOverrides = ref<
  Partial<Omit<ApiReferenceConfiguration, 'slug' | 'title' | ''>>
>({})

/** Any dev toolbar modifications are merged with the active configuration */
const mergedConfig = computed<ApiReferenceConfigurationRaw>(() => ({
  // Provides a default set of values when the lookup fails
  ...apiReferenceConfigurationSchema.parse({}),
  // The active configuration based on the slug
  ...configList.value[activeSlug.value]?.config,
  // Any overrides from the localhost toolbar
  ...configurationOverrides.value,
}))

/** Convenience break out var to determine which routing mode we are using */
const basePath = computed(() => mergedConfig.value.pathRouting?.basePath)

const themeStyle = computed(() =>
  getThemeStyles(mergedConfig.value.theme, {
    fonts: mergedConfig.value.withDefaultFonts,
  }),
)

/** Plugin injection is not reactive. All plugins must be provided at first render */
provide(
  PLUGIN_MANAGER_SYMBOL,
  createPluginManager({
    plugins: Object.values(configList.value).flatMap(
      (c) => c.config.plugins ?? [],
    ),
  }),
)
// ---------------------------------------------------------------------------
/** Navigation State Handling */

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
const workspaceStore = createWorkspaceStore()

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
 * Create top level sidebar entries for each document
 * This allows sharing a single sidebar state for across the workspace
 */
const itemsFromWorkspace = computed<TraversedEntry[]>(() => {
  return Object.entries(workspaceStore.workspace.documents).map(
    ([slug, document]) => ({
      id: slug,
      type: 'document',
      description: document.info.description,
      name: document.info.title ?? slug,
      title: document.info.title ?? slug,
      children: document?.['x-scalar-navigation']?.children ?? [],
    }),
  )
})

/** Initialize the sidebar */
const sidebarState = createSidebarState<TraversedEntry>(itemsFromWorkspace, {
  hooks: {},
})

/** Recursively set all children of the given items to open */
const setChildrenOpen = (items: TraversedEntry[]): void => {
  items.forEach((item) => {
    if (item.type === 'tag') {
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

  const docItems =
    sidebarState.items.value.find(
      (item): item is TraversedTag => item.id === activeSlug.value,
    )?.children ?? []

  // When the default open all tags configuration is enabled we open all the children of the document
  if (config.defaultOpenAllTags) {
    setChildrenOpen(docItems)
  }

  // When the expand all model sections configuration is enabled we open all the children of the models tag
  if (config.expandAllModelSections) {
    const models = docItems.find(
      (item): item is TraversedTag =>
        item.type === 'tag' && item.id === 'models',
    )
    if (models) {
      sidebarState.setExpanded(models.id, true)
      models.children?.forEach((child) => {
        sidebarState.setExpanded(child.id, true)
      })
    }
  }

  return docItems.filter((item) =>
    config.hideModels ? item.id !== 'models' : true,
  )
})

/** Find the sidebar entry that represents the introduction section */
const infoSectionId = computed(
  () =>
    sidebarItems.value.find(
      (item) => item.type === 'text' && item.title === 'Introduction',
    )?.id,
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
  scrollToLazy(id, sidebarState.setExpanded, sidebarState.getEntryById)
}

/** Set up event listeners for client store events */
useWorkspaceStoreEvents(workspaceStore, root)

/** Maps some config values to the workspace store to keep it reactive */
mapConfigToWorkspaceStore({
  config: () => mergedConfig.value,
  store: workspaceStore,
  isDarkMode,
})

// ---------------------------------------------------------------------------
// Document Management

/**
 * Handle changing the active document
 *
 * 1. If the document has not be loaded to the workspace store we set it to empty and asynchronously load it
 * 2. If the document has been loaded to the workspace store we just set it to active
 * 3. If the content from the configuration has changes we need to update the document in the workspace store
 * 4. The API client temporary store will always be reset and re-initialized when the slug changes
 */
const changeSelectedDocument = async (
  slug: string,
  elementId?: string | undefined,
) => {
  // Always set it to active; if the document is null we show a loading state
  workspaceStore.update('x-scalar-active-document', slug)
  const normalized = configList.value[slug]

  if (!normalized) {
    console.warn(`Document ${slug} not found in configList`)
    return
  }

  const config = {
    ...normalized.config,
    ...configurationOverrides.value,
  }

  // Set the active slug and update any routing
  syncSlugAndUrlWithDocument(slug, elementId, config)

  const isFirstLoad = !workspaceStore.workspace.documents[slug]

  // If the document is not in the store, we asynchronously load it
  if (isFirstLoad) {
    const proxy: UrlDoc['fetch'] = (input, init) =>
      fetch(
        redirectToProxy(
          config.proxyUrl ?? 'https://proxy.scalar.com',
          input.toString(),
        ),
        init,
      )

    await workspaceStore.addDocument(
      normalized.source.url
        ? {
            name: slug,
            url: normalized.source.url,
            config: mapConfiguration(config),
            fetch: config.fetch ?? proxy,
          }
        : {
            name: slug,
            document: normalized.source.content ?? {},
            config: mapConfiguration(config),
          },
    )
    config.onLoaded?.(slug)
  }

  /** When loading to a specified element we need to freeze and scroll */
  if (elementId && elementId !== slug) {
    console.log('elementId', elementId)
    const unfreeze = freeze(elementId)
    addLazyCompleteCallback(unfreeze)
    scrollToLazyElement(elementId)
  } else {
    /** If there is no child element of the document specified we expand the first tag */
    const firstTag = sidebarItems.value.find((item) => item.type === 'tag')
    if (firstTag) {
      sidebarState.setExpanded(firstTag.id, true)
    }
  }

  // Map the document to the client store for now
  const raw = JSON.parse(workspaceStore.exportActiveDocument('json') ?? '{}')
  dereferenced.value = dereference(raw).schema
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
      /** If we have not loaded the document previously we don't need to handle any updates to store */
      if (!workspaceStore.workspace.documents[updated.slug]) {
        return
      }
      /** If the URL has changed we fetch and rebase */
      if (updated.source.url && updated.source.url !== previous?.source.url) {
        const proxy: UrlDoc['fetch'] = (input, init) =>
          fetch(
            redirectToProxy(
              updated.config.proxyUrl ?? 'https://proxy.scalar.com',
              input.toString(),
            ),
            init,
          )

        await workspaceStore.addDocument({
          name: updated.slug,
          url: updated.source.url,
          config: mapConfiguration(updated.config),
          fetch: updated.config.fetch ?? proxy,
        })

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
        await workspaceStore.addDocument({
          name: updated.slug,
          document: updated.source.content,
          config: mapConfiguration(updated.config),
        })
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

/** Preload the first document during SSR */
onServerPrefetch(() => changeSelectedDocument(activeSlug.value))

/** Load the first document on page load */
onBeforeMount(() =>
  changeSelectedDocument(
    activeSlug.value,
    getIdFromUrl(
      window.location.href,
      configList.value[activeSlug.value]?.config.pathRouting?.basePath,
      isMultiDocument.value ? undefined : activeSlug.value,
    ),
  ),
)

// --------------------------------------------------------------------------- */

/**
 * @deprecated
 * We keep a copy of the workspace store document in dereferenced format
 * to allow mapping to the legacy client store
 */
const dereferenced = ref<ReturnType<typeof dereference>['schema'] | null>(null)

const modal = useTemplateRef<HTMLElement>('modal')

/**
 * Keeps the client store in sync with the workspace store
 *
 * Handles resetting the client store when the document changes
 */
const { activeServer, getSecuritySchemes, openClient } = mapConfigToClientStore(
  {
    workspaceStore,
    config: mergedConfig,
    el: modal,
    root,
    dereferencedDocument: dereferenced,
  },
)

// ---------------------------------------------------------------------------
// Top level event handlers and user specified callbacks

/** Open the client modal on the custom event */
onCustomEvent(root, 'scalar-open-client', (event) => {
  openClient(event.detail)
})

/** Set the sidebar item to open and run any config handlers */
onCustomEvent(root, 'scalar-on-show-more', (event) => {
  mergedConfig.value.onShowMore?.(event.detail.id)
  return sidebarState.setExpanded(event.detail.id, true)
})

onCustomEvent(root, 'scalar-update-selected-server', (event) => {
  // Ensure we call the onServerChange callback
  if (mergedConfig.value.onServerChange) {
    mergedConfig.value.onServerChange(event.detail.value ?? '')
  }
})

onCustomEvent(root, 'scalar-download-document', async (event) => {
  if (event.detail.format === 'direct') {
    const url = configList.value[activeSlug.value]?.source?.url
    if (!url) {
      console.error(
        'Direct download is not supported for documents without a URL source',
      )
      return
    }
    const result = await fetch(
      redirectToProxy(
        mergedConfig.value.proxyUrl ?? 'https://proxy.scalar.com',
        url,
      ),
    ).then((r) => r.text())

    downloadDocument(result, activeSlug.value ?? 'openapi')
    // Will be handled in the ApiReference component. Only valid for integrations that rely on a configuration with a URL.
    return
  }

  const format = event.detail.format
  const document = workspaceStore.exportActiveDocument(format)
  if (!document) {
    console.error('No document found to download')
    return
  }
  downloadDocument(document, activeSlug.value ?? 'openapi', format)
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
const handleSelectItem = async (id: string) => {
  const item = sidebarState.getEntryById(id)

  if (item?.type === 'tag' && sidebarState.isExpanded(id)) {
    return sidebarState.setExpanded(id, false)
  }

  scrollToLazyElement(id)

  const url = makeUrlFromId(id, basePath.value, isMultiDocument.value)
  if (url) {
    window.history.pushState({}, '', url)
  }
}

const handleToggleTag = (id: string, open: boolean) => {
  sidebarState.setExpanded(id, open)
}

const handleToggleSchema = (id: string, open: boolean) => {
  sidebarState.setExpanded(id, open)
}

const handleToggleOperation = (id: string, open: boolean) => {
  sidebarState.setExpanded(id, open)
}

/** Ensure we copy the hash OR path if pathRouting is enabled */
const handleCopyAnchorUrl = (id: string) => {
  const url = makeUrlFromId(
    id,
    basePath.value,
    isMultiDocument.value,
  )?.toString()
  return url && copyToClipboard(url)
}

/** Update the URL as the page is scrolled and the anchors intersect */
const handleIntersecting = (id: string) => {
  if (!intersectionEnabled.value) {
    return
  }

  sidebarState.setSelected(id)
  setBreadcrumb(id)

  const url = makeUrlFromId(id, basePath.value, isMultiDocument.value)
  if (url && workspaceStore.workspace.activeDocument) {
    window.history.replaceState({}, '', url.toString())
  }
}

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
      scrollToLazy(id, sidebarState.setExpanded, sidebarState.getEntryById)
    }
  })
})
</script>

<template>
  <!-- SingleApiReference -->
  <div ref="root">
    <!-- Inject any custom CSS directly into a style tag -->
    <component :is="'style'">
      {{ mergedConfig.customCss }}
      {{ themeStyle }}
    </component>
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
      ]">
      <!-- Mobile Header and Sidebar when in modern layout -->

      <MobileHeader
        v-if="mergedConfig.layout === 'modern' && mergedConfig.showSidebar"
        :breadcrumb="breadcrumb"
        :isSidebarOpen="isSidebarOpen"
        @toggleSidebar="() => (isSidebarOpen = !isSidebarOpen)">
        <template #sidebar="{ sidebarClasses }">
          <ScalarSidebar
            v-if="
              (mergedConfig.showSidebar || !mediaQueries.lg.value) &&
              mergedConfig.layout === 'modern'
            "
            :aria-label="`Sidebar for ${workspaceStore.workspace.activeDocument?.info?.title}`"
            class="t-doc__sidebar"
            :class="sidebarClasses"
            :isExpanded="sidebarState.isExpanded"
            :isSelected="sidebarState.isSelected"
            :items="sidebarItems"
            layout="reference"
            :options="{
              operationTitleSource: mergedConfig.operationTitleSource,
            }"
            role="navigation"
            @selectItem="(id) => handleSelectItem(id)">
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
                class="scalar-api-references-standalone-search">
                <SearchButton
                  :document="workspaceStore.workspace.activeDocument"
                  :hideModels="mergedConfig.hideModels"
                  :items="sidebarItems"
                  :searchHotKey="mergedConfig.searchHotKey"
                  @toggleSidebarItem="(id) => handleSelectItem(id)" />
              </div>
              <!-- Sidebar Start -->
              <slot
                name="sidebar-start"
                v-bind="slotProps" />
            </template>
            <template #footer>
              <slot
                name="sidebar-end"
                v-bind="slotProps">
                <!-- We default the sidebar footer to the standard scalar elements -->
                <ScalarSidebarFooter class="darklight-reference">
                  <OpenApiClientButton
                    v-if="!mergedConfig.hideClientButton"
                    buttonSource="sidebar"
                    :integration="mergedConfig._integration"
                    :isDevelopment="isDevelopment"
                    :url="configList[activeSlug]?.source?.url" />
                  <!-- Override the dark mode toggle slot to hide it -->
                  <template #toggle>
                    <ScalarColorModeToggleButton
                      v-if="!mergedConfig.hideDarkModeToggle"
                      :modelValue="
                        !!workspaceStore.workspace['x-scalar-dark-mode']
                      "
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
        :aria-label="`Open API Documentation for ${workspaceStore.workspace.activeDocument?.info?.title}`"
        class="references-rendered">
        <Content
          :activeServer="activeServer"
          :document="workspaceStore.workspace.activeDocument"
          :expandedItems="sidebarState.expandedItems.value"
          :getSecuritySchemes="getSecuritySchemes"
          :infoSectionId="infoSectionId ?? 'description/introduction'"
          :items="sidebarItems"
          :options="{
            headingSlugGenerator:
              mergedConfig.generateHeadingSlug ??
              ((heading) => `description/${heading.slug}`),
            slug: mergedConfig.slug,
            hiddenClients: mergedConfig.hiddenClients,
            layout: mergedConfig.layout,
            persistAuth: mergedConfig.persistAuth,
            showOperationId: mergedConfig.showOperationId,
            hideTestRequestButton: mergedConfig.hideTestRequestButton,
            expandAllResponses: mergedConfig.expandAllResponses,
            expandAllModelSections: mergedConfig.expandAllModelSections,
            orderRequiredPropertiesFirst:
              mergedConfig.orderRequiredPropertiesFirst,
            orderSchemaPropertiesBy: mergedConfig.orderSchemaPropertiesBy,
            documentDownloadType: mergedConfig.documentDownloadType,
          }"
          :xScalarDefaultClient="
            workspaceStore.workspace['x-scalar-default-client']
          "
          @copyAnchorUrl="handleCopyAnchorUrl"
          @intersecting="handleIntersecting"
          @toggleOperation="handleToggleOperation"
          @toggleSchema="handleToggleSchema"
          @toggleTag="handleToggleTag">
          <template #start>
            <ApiReferenceToolbar
              v-if="workspaceStore.workspace.activeDocument"
              v-model:overrides="configurationOverrides"
              :configuration="mergedConfig"
              :workspace="workspaceStore" />

            <!-- Placeholder intersection observer that emits an empty string to clear the hash when scrolled to the top -->
            <IntersectionObserver
              id="scalar-document-start"
              @intersecting="() => handleIntersecting(activeSlug)">
            </IntersectionObserver>

            <!--  -->
            <ClassicHeader v-if="mergedConfig.layout === 'classic'">
              <div class="w-64 *:!p-0 empty:hidden">
                <DocumentSelector
                  v-if="documentOptionList.length > 1"
                  :modelValue="activeSlug"
                  :options="documentOptionList"
                  @update:modelValue="changeSelectedDocument" />
              </div>
              <SearchButton
                v-if="!mergedConfig.hideSearch"
                class="t-doc__sidebar max-w-64"
                :hideModels="mergedConfig.hideModels"
                :items="sidebarItems"
                :searchHotKey="mergedConfig.searchHotKey"
                @toggleSidebarItem="
                  (id) =>
                    sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
                " />
              <template #dark-mode-toggle>
                <ScalarColorModeToggleIcon
                  v-if="!mergedConfig.hideDarkModeToggle"
                  class="text-c-2 hover:text-c-1"
                  :mode="
                    !!workspaceStore.workspace['x-scalar-dark-mode']
                      ? 'dark'
                      : 'light'
                  "
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
@import '@/style.css';

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
</style>
<style scoped>
/* Configurable Layout Variables */
@layer scalar-config {
  .scalar-api-reference {
    --refs-sidebar-width: var(--scalar-sidebar-width, 0px);
    /* The header height */
    --refs-header-height: calc(
      var(--scalar-custom-header-height) + var(--scalar-header-height, 0px)
    );
    /* The offset of visible references content (minus headers) */
    --refs-viewport-offset: calc(
      var(--refs-header-height, 0px) + var(--refs-content-offset, 0px)
    );
    /* The calculated height of visible references content (minus headers) */
    --refs-viewport-height: calc(
      var(--full-height, 100dvh) - var(--refs-viewport-offset, 0px)
    );
    --refs-content-max-width: var(--scalar-content-max-width, 1540px);
  }

  .scalar-api-reference.references-classic {
    /* Classic layout is wider */
    --refs-content-max-width: var(--scalar-content-max-width, 1420px);
    min-height: 100dvh;
    --refs-sidebar-width: 0;
  }

  /* When the toolbar is present, we need to offset the content */
  .scalar-api-reference:has(.api-reference-toolbar) {
    --refs-content-offset: 48px;
  }
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
    --refs-sidebar-width: var(--scalar-sidebar-width, 280px);
  }
}

/* Footer */
.references-footer {
  grid-area: footer;
}
/* ----------------------------------------------------- */
/* Responsive / Mobile Layout */

@media (max-width: 1150px) {
  /* Hide rendered view for tablets */
  .references-layout {
    grid-template-columns: var(--refs-sidebar-width) 1fr 0px;
  }
}

@media (max-width: 1000px) {
  /* Stack view on mobile */
  .references-layout {
    grid-template-columns: auto;
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
@media (max-width: 1000px) {
  .scalar-api-references-standalone-mobile {
    --scalar-header-height: 50px;
  }
}
</style>
<style scoped>
.scalar-api-references-standalone-search {
  display: flex;
  flex-direction: column;
  padding: 12px 12px 6px 12px;
}
.darklight-reference {
  width: 100%;
  margin-top: auto;
}
</style>
