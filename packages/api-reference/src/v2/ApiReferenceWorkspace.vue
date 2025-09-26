<script lang="ts" setup>
/**
 * API Reference Workspace will be a temporary wrapping layer for handling all workspace state.
 *
 * Once the migration to the new workspace store is complete the top level component composition
 * can be simplified to handle two use cases:
 *
 * - Externally provided store (store is initialized outside of the component and passed in)
 * - Standalone mode (store is initialized inside the component and configuration is merged)
 *
 * The configuration should be merged with the workspace store and all components should consume
 * only portions of the workspace store.
 *
 * No state updates should be handled in children of this components. When updates are required
 * a custom event should be emitted to the workspace store and handled here.
 */
import {
  REFERENCE_LS_KEYS,
  safeLocalStorage,
} from '@scalar/helpers/object/local-storage'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { redirectToProxy } from '@scalar/oas-utils/helpers'
import type {
  AnyApiReferenceConfiguration,
  ApiReferenceConfigurationWithSources,
} from '@scalar/types'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { type WorkspaceStore } from '@scalar/workspace-store/client'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import {
  computed,
  onBeforeMount,
  provide,
  ref,
  toRef,
  useTemplateRef,
  watch,
} from 'vue'

import ApiReferenceLayout from '@/components/ApiReferenceLayout.vue'
import {
  DocumentSelector,
  useMultipleDocuments,
} from '@/features/multiple-documents'
import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'
import { isClient } from '@/v2/blocks/scalar-request-example-block/helpers/find-client'
import { getDocumentName } from '@/v2/helpers/get-document-name'
import { mapConfiguration } from '@/v2/helpers/map-configuration'
import { normalizeContent } from '@/v2/helpers/normalize-content'
import { useWorkspaceStoreEvents } from '@/v2/hooks/use-workspace-store-events'

const props = defineProps<{
  configuration?: AnyApiReferenceConfiguration
  store: WorkspaceStore
}>()

defineEmits<{
  (e: 'updateContent', content: any): void
}>()

// ---------------------------------------------------------------------------
/**
 * DEPRECATED: This is a temporary state solution while we migrate to the new workspace store
 *
 */

const {
  availableDocuments,
  selectedConfiguration,
  selectedDocumentIndex,
  isIntersectionEnabled,
  hash,
  hashPrefix,
} = useMultipleDocuments({
  configuration: toRef(props, 'configuration'),
  isIntersectionEnabled: ref(false),
  hash: ref(''),
  hashPrefix: ref(''),
})

/**
 * Creates a proxy function that redirects requests through a proxy URL.
 * This is used to handle CORS issues by routing requests through a proxy server.
 *
 * @param input - The URL or Request object to proxy
 * @param init - Optional fetch init parameters
 * @returns A Promise that resolves to the Response from the proxied request
 */
const proxy = (
  input: string | URL | globalThis.Request,
  // eslint-disable-next-line no-undef
  init?: RequestInit,
) => {
  return fetch(
    redirectToProxy(selectedConfiguration.value.proxyUrl, input.toString()),
    init,
  )
}

// Provide the intersection observer which has defaults
provide(NAV_STATE_SYMBOL, { isIntersectionEnabled, hash, hashPrefix })

// ---------------------------------------------------------------------------

const root = useTemplateRef<HTMLElement>('root')
const store = props.store

// Do this a bit quicker than onMounted
onBeforeMount(() => {
  const storedClient = safeLocalStorage().getItem(
    REFERENCE_LS_KEYS.SELECTED_CLIENT,
  )
  if (isClient(storedClient) && !store.workspace['x-scalar-default-client']) {
    store.update('x-scalar-default-client', storedClient)
  }
})

/**
 * Adds a document to the workspace store based on the provided configuration.
 * Handles both in-memory documents (via content) and remote documents (via URL).
 * If the document is already in the store, it will be updated, otherwise it will be added.
 *
 * @param config - The document configuration containing either content or URL
 * @returns The result of adding the document to the store, or undefined if skipped
 */
const addOrUpdateDocument = async (
  config: Partial<ApiReferenceConfigurationWithSources>,
) => {
  const document = normalizeContent(config.content)

  /** Generate a name from the document/config */
  const name = getDocumentName({
    name: config.slug || config.title,
    url: config.url,
    document,
  })

  // If the document is already in the store, we may want to update it
  if (store.workspace.documents[name]) {
    if (document) {
      // Disable intersection observer to prevent url changing
      isIntersectionEnabled.value = false

      store.replaceDocument(name, document)

      // Lets set it to active as well just in case the name changed
      store.update('x-scalar-active-document', name)

      // Re-enable intersection observer
      setTimeout(() => {
        isIntersectionEnabled.value = true
      }, 300)
    }

    return
  }

  if (document) {
    return await store.addDocument({
      name,
      document,
      config: mapConfiguration(config),
    })
  }

  if (config.url) {
    return await store.addDocument({
      name: config.slug ?? 'default',
      url: makeUrlAbsolute(config.url, {
        basePath: selectedConfiguration.value.pathRouting?.basePath,
      }),
      fetch: config.fetch ?? proxy,
      config: mapConfiguration(config),
    })
  }

  return
}

/** Watch for changes to the slug, url, or content */
watch(
  [
    () => selectedConfiguration.value.slug,
    () => selectedConfiguration.value.url,
    () => selectedConfiguration.value.content,
  ],
  ([newSlug, newUrl, newContent]) => {
    if (newSlug || newUrl || newContent) {
      addOrUpdateDocument(selectedConfiguration.value)
    }
  },
  { immediate: true },
)

/** Set up event listeners for client store events */
useWorkspaceStoreEvents(store, root)

// Update the workspace store if default client changes
watch(
  () => selectedConfiguration.value.defaultHttpClient,
  (newValue) => {
    if (newValue) {
      const { targetKey, clientKey } = newValue

      const clientId = `${targetKey}/${clientKey}`
      if (isClient(clientId)) {
        store.update('x-scalar-default-client', clientId)
      }
    }
  },
  { immediate: true },
)

// ---------------------------------------------------------------------------
// TODO: Remove this legacy code block. Directly copied from SingleApiReference.vue
// Logic should be mapped to the workspace store

/**
 * Determines the initial color mode based on the dark mode configuration.
 * Returns 'dark' for explicit true, 'light' for explicit false, or undefined for auto.
 */
function getInitialColorMode(
  darkMode: boolean | undefined,
): 'dark' | 'light' | undefined {
  if (darkMode === true) {
    return 'dark'
  }

  if (darkMode === false) {
    return 'light'
  }

  return undefined
}

// TODO: persistence should be hoisted into standalone
// Client side integrations will want to handle dark mode externally
const { toggleColorMode, isDarkMode } = useColorMode({
  initialColorMode: getInitialColorMode(selectedConfiguration.value.darkMode),
  overrideColorMode: selectedConfiguration.value.forceDarkModeState,
})

/** Update the dark mode state when props change */
watch(
  () => selectedConfiguration.value.darkMode,
  (isDark) => store.update('x-scalar-dark-mode', !!isDark),
)

// Temporary mapping of isDarkMode until we update the standalone component
watch(
  () => isDarkMode.value,
  (newValue) => store.update('x-scalar-dark-mode', newValue),
  { immediate: true },
)

// Temporary mapping of active document until we update the standalone component
watch(
  () => selectedDocumentIndex.value,
  (newValue) =>
    store.update(
      'x-scalar-active-document',
      availableDocuments.value[newValue]?.slug,
    ),
  { immediate: true },
)

if (selectedConfiguration.value.metaData) {
  useSeoMeta(selectedConfiguration.value.metaData)
}

// TODO: defineSlots

const favicon = computed(() => selectedConfiguration.value.favicon)
useFavicon(favicon)

// ---------------------------------------------------------------------------
</script>

<template>
  <!-- SingleApiReference -->
  <div ref="root">
    <!-- Inject any custom CSS directly into a style tag -->
    <component
      :is="'style'"
      v-if="selectedConfiguration?.customCss">
      {{ selectedConfiguration.customCss }}
    </component>
    <ApiReferenceLayout
      :configuration="selectedConfiguration"
      :isDark="!!store.workspace['x-scalar-dark-mode']"
      :store="store"
      @toggleDarkMode="() => toggleColorMode()"
      @updateContent="$emit('updateContent', $event)">
      <template #document-selector>
        <DocumentSelector
          v-model="selectedDocumentIndex"
          :options="availableDocuments" />
      </template>
      <!-- Pass through content, sidebar and footer slots -->
      <template #content-start><slot name="content-start" /></template>
      <template #content-end><slot name="content-end" /></template>
      <template #sidebar-start><slot name="sidebar-start" /></template>
      <template #sidebar-end><slot name="sidebar-end" /></template>
      <template #footer><slot name="footer" /></template>
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
