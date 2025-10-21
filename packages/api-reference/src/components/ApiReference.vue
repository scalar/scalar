<script setup lang="ts">
import { redirectToProxy } from '@scalar/oas-utils/helpers'
import { dereference } from '@scalar/openapi-parser'
import {
  apiReferenceConfigurationSchema,
  type AnyApiReferenceConfiguration,
  type ApiReferenceConfiguration,
  type ApiReferenceConfigurationRaw,
} from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import {
  createWorkspaceStore,
  type UrlDoc,
} from '@scalar/workspace-store/client'
import { onCustomEvent } from '@scalar/workspace-store/events'
import diff from 'microdiff'
import {
  computed,
  onBeforeMount,
  onServerPrefetch,
  provide,
  ref,
  useTemplateRef,
  watch,
} from 'vue'

import ApiReferenceLayout from '@/components/ApiReferenceLayout.vue'
import DocumentSelector from '@/features/multiple-documents/DocumentSelector.vue'
import ApiReferenceToolbar from '@/features/toolbar/ApiReferenceToolbar.vue'
import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'
import { downloadDocument } from '@/libs/download'
import { useSidebar } from '@/v2/blocks/scalar-sidebar-block'
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

/** These slots render in their respective slots in the underlying ApiReferenceLayout component */
defineSlots<{
  'content-start'?(): unknown
  'content-end'?(): unknown
  'sidebar-start'?(): unknown
  'sidebar-end'?(): unknown
  footer?(): unknown
}>()

if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => workspaceStore
}

const root = useTemplateRef('root')

// ---------------------------------------------------------------------------
/**
 * Configuration Handling
 *
 * We will normalize the configurations and store them in a computed property.
 * The active configuration will be associated with the active document.
 */
const configList = computed(() => normalizeConfigurations(props.configuration))

/** Search for the source with a default attribute or use the first one */
const activeSlug = ref<string>(
  Object.values(configList.value).find((c) => c.default)?.slug ??
    configList.value[Object.keys(configList.value)?.[0] ?? '']?.slug ??
    '',
)

// If we detect a slug query parameter we set the active slug from that value
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href)
  const slug = url.searchParams.get('api')
  if (slug) {
    activeSlug.value = slug
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

// ---------------------------------------------------------------------------
/** Navigation State Handling */

// Initialized navigation state
const isIntersectionEnabled = ref(false)
const hash = ref('')
const hashPrefix = ref('')

// Provide the intersection observer which has defaults
provide(NAV_STATE_SYMBOL, {
  isIntersectionEnabled,
  hash,
  hashPrefix,
  basePath: () => mergedConfig.value.pathRouting?.basePath,
  generateHeadingSlug: () => mergedConfig.value.generateHeadingSlug,
})

const QUERY_PARAMETER = 'api'

/**
 * Sets the active slug and updates the URL with the selected document slug
 */
function syncSlugAndUrlWithDocument(
  slug: string,
  config: ApiReferenceConfigurationRaw,
) {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)

  // Clear path if pathRouting is enabled
  if (config.pathRouting && slug !== activeSlug.value) {
    url.pathname = config.pathRouting?.basePath ?? ''
  }

  // Use slug if available, then fallback to index
  const parameterValue = slug

  if (Object.keys(configList.value).length > 1) {
    url.searchParams.set(QUERY_PARAMETER, parameterValue)
  } else {
    url.searchParams.delete(QUERY_PARAMETER)
  }

  window.history.replaceState({}, '', url.toString())

  hash.value = ''
  hashPrefix.value = ''
  isIntersectionEnabled.value = false

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

/** Initialize the sidebar
 * @todo Remove hook and do custom events for actions
 */
const { setCollapsedSidebarItem } = useSidebar(workspaceStore)

/** Set up event listeners for client store events */
useWorkspaceStoreEvents(workspaceStore, root)

/** Maps some config values to the workspace store to keep it reactive */
mapConfigToWorkspaceStore({
  config: () => mergedConfig.value,
  store: workspaceStore,
  isDarkMode,
})

/**
 * Handle changing the active document
 *
 * 1. If the document has not be loaded to the workspace store we set it to empty and asynchronously load it
 * 2. If the document has been loaded to the workspace store we just set it to active
 * 3. If the content from the configuration has changes we need to update the document in the workspace store
 * 4. The API client temporary store will always be reset and re-initialized when the slug changes
 */
const changeSelectedDocument = async (slug: string) => {
  // Set the active slug and update any routing
  syncSlugAndUrlWithDocument(slug, mergedConfig.value)

  // Always set it to active; if the document is null we show a loading state
  workspaceStore.update('x-scalar-active-document', slug)
  const normalized = configList.value[slug]
  if (!normalized) {
    return
  }
  const config = {
    ...normalized.config,
    ...configurationOverrides.value,
  }

  const isFirstLoad = !workspaceStore.workspace.documents[slug]

  isIntersectionEnabled.value = false

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
  }

  // Re-enable intersection observer
  setTimeout(() => {
    isIntersectionEnabled.value = true

    // The first time we load a document, run the onLoaded callback
    if (isFirstLoad) {
      mergedConfig.value.onLoaded?.(slug)
    }
  }, 300)

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
      previous: NormalizedConfiguration,
    ) => {
      /** If we have not loaded the document previously we don't need to handle any updates to store */
      if (!workspaceStore.workspace.documents[updated.slug]) {
        return
      }
      /** If the URL has changed we fetch and rebase */
      if (updated.source.url && updated.source.url !== previous.source.url) {
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
          'content' in previous.source ? (previous.source.content ?? {}) : {},
        ).length
      ) {
        await workspaceStore.addDocument({
          name: updated.slug,
          document: updated.source.content,
          config: mapConfiguration(updated.config),
        })
      }
    }

    newConfigList.forEach((newConfig, index) => {
      updateSource(newConfig, oldConfigList[index])
    })

    const newSlugs = newConfigList.map((c) => c.slug)
    const oldSlugs = oldConfigList.map((c) => c.slug)

    // If the slugs have changed, we need to update the active document and the URL query param
    if (
      newSlugs.length !== oldSlugs.length ||
      !newSlugs.every((slug, index) => slug === oldSlugs[index])
    ) {
      changeSelectedDocument(newSlugs[0])
    }
  },
  {
    deep: true,
  },
)

/** Preload the first document during SSR */
onServerPrefetch(() => changeSelectedDocument(activeSlug.value))

/** Load the first document on page load */
onBeforeMount(() => changeSelectedDocument(activeSlug.value))

// --------------------------------------------------------------------------- */

/**
 * @deprecated
 * We keep a copy of the workspace store document in dereferenced format
 * to allow mapping to the legacy client store
 */
const dereferenced = ref<ReturnType<typeof dereference>['schema'] | null>(null)

const modal = useTemplateRef('modal')

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
    isIntersectionEnabled: ref(true),
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
  setCollapsedSidebarItem(event.detail.id, true)
  mergedConfig.value.onShowMore?.(event.detail.id)
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

/**
 * Used to inject the environment into built packages
 *
 * Primary use case is the open-in-client button
 */
const isDevelopment = import.meta.env.DEV
</script>

<template>
  <!-- SingleApiReference -->
  <div ref="root">
    <!-- Inject any custom CSS directly into a style tag -->
    <component
      :is="'style'"
      v-if="mergedConfig.customCss">
      {{ mergedConfig.customCss }}
    </component>
    <ApiReferenceLayout
      :activeServer="activeServer"
      :configuration="mergedConfig"
      :document="workspaceStore.workspace.activeDocument"
      :getSecuritySchemes="getSecuritySchemes"
      :isDark="!!workspaceStore.workspace['x-scalar-dark-mode']"
      :isDevelopment="isDevelopment"
      :url="configList[activeSlug]?.source?.url"
      :xScalarDefaultClient="
        workspaceStore.workspace['x-scalar-default-client']
      "
      @toggleDarkMode="() => toggleColorMode()">
      <template #document-selector>
        <DocumentSelector
          v-if="documentOptionList.length > 1"
          :modelValue="activeSlug"
          :options="documentOptionList"
          @update:modelValue="changeSelectedDocument" />
      </template>
      <!-- Pass through content, sidebar and footer slots -->
      <template #content-start>
        <!-- Only appears on localhost -->
        <ApiReferenceToolbar
          v-if="workspaceStore.workspace.activeDocument"
          v-model:overrides="configurationOverrides"
          :configuration="mergedConfig"
          :workspace="workspaceStore" />
        <slot name="content-start" />
      </template>
      <template #content-end><slot name="content-end" /></template>
      <template #sidebar-start><slot name="sidebar-start" /></template>
      <template #sidebar-end><slot name="sidebar-end" /></template>
      <template #footer><slot name="footer" /></template>
      <!-- Client modal element -->
      <template #client-modal><div ref="modal" /></template>
    </ApiReferenceLayout>
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
</style>
