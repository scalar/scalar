<script setup lang="ts">
import { createWorkspaceStore as createClientStore } from '@scalar/api-client/store'
import { dereferenceSync } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type {
  AnyApiReferenceConfiguration,
  ApiReferenceConfiguration,
  ApiReferenceConfigurationRaw,
} from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { onCustomEvent } from '@scalar/workspace-store/events'
import {
  computed,
  nextTick,
  provide,
  ref,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue'

import ApiReferenceLayout from '@/components/ApiReferenceLayout.vue'
import DocumentSelector from '@/features/multiple-documents/DocumentSelector.vue'
import ApiReferenceToolbar from '@/features/toolbar/ApiReferenceToolbar.vue'
import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'
import { useSidebar } from '@/v2/blocks/scalar-sidebar-block'
import { addOrUpdateDocument } from '@/v2/helpers/add-update-document'
import { mapConfigToClientStore } from '@/v2/helpers/map-config-to-client-store'
import { mapConfigToWorkspaceStore } from '@/v2/helpers/map-config-to-workspace-store'
import { normalizeConfigurations } from '@/v2/helpers/normalize-configurations'
import { useWorkspaceStoreEvents } from '@/v2/hooks/use-workspace-store-events'

const props = defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?: AnyApiReferenceConfiguration
}>()

/** These slots render in their respective slots in the underlying ApiReferenceWorkspace component */
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
const configs = computed(() => normalizeConfigurations(props.configuration))

/** Search for the source with a default attribute or use the first one */
const activeSlug = ref<string>(
  Object.values(configs.value).find((c) => c.default)?.slug ??
    configs.value[Object.keys(configs.value)?.[0] ?? '']?.slug ??
    '',
)

const documentOptionList = computed(() =>
  Object.values(configs.value).map((c) => ({
    label: c.title,
    id: c.slug,
  })),
)

const changeSelectedDocument = (slug: string) => {
  console.log('changeSelectedDocument', slug)
  activeSlug.value = slug
}

const active = computed(() => configs.value[activeSlug.value])

/** Configuration overrides to apply to the selected document (from the localhost toolbar) */
const configurationOverrides = ref<
  Partial<Omit<ApiReferenceConfiguration, 'slug' | 'title' | ''>>
>({})

/** Any dev toolbar modifications are merged with the active configuration */
const mergedConfig = computed<ApiReferenceConfigurationRaw>(() => ({
  ...active.value.config,
  ...configurationOverrides.value,
}))

// Initialized navigation state
const isIntersectionEnabled = ref(false)
const hash = ref('')
const hashPrefix = ref('')

// Provide the intersection observer which has defaults
provide(NAV_STATE_SYMBOL, {
  isIntersectionEnabled,
  hash,
  hashPrefix,
  basePath: () => active.value.config.pathRouting?.basePath,
  generateHeadingSlug: () => active.value.config.generateHeadingSlug,
})

// ---------------------------------------------------------------------------
/**
 * Store Initialization
 *
 * During migration we must handle mapping between the legacy api-client store and the new workspace store.
 */

/**
 * Initializes the new client workspace store.
 */
const workspaceStore = createWorkspaceStore()

const colorModes = {
  true: 'dark',
  false: 'light',
  undefined: undefined,
} as const

// TODO: persistence should be hoisted into standalone
// Client side integrations will want to handle dark mode externally
const { toggleColorMode, isDarkMode } = useColorMode({
  initialColorMode:
    colorModes[String(active.value.config.darkMode) as keyof typeof colorModes],
  overrideColorMode: active.value.config.forceDarkModeState,
})
/** Initialize the sidebar */
useSidebar(workspaceStore)

/** Set up event listeners for client store events */
useWorkspaceStoreEvents(workspaceStore, root)

/** Maps some config values to the workspace store to keep it reactive */
mapConfigToWorkspaceStore({
  config: () => active.value.config,
  store: workspaceStore,
  isDarkMode,
})

const activeDocument = computed(() => workspaceStore.workspace.activeDocument)

watchEffect(() => {
  console.log('active', active.value)
  console.log('document', activeDocument.value)
})

// --------------------------------------------------------------------------- */
/**
 * Legacy API Client Store
 *
 * In a future release this will be removed and the logic merged into the workspace store.
 */
const clientStore = createClientStore({
  useLocalStorage: false,
  proxyUrl: active.value.config.proxyUrl,
  theme: active.value.config.theme,
  showSidebar: active.value.config.showSidebar,
  hideClientButton: active.value.config.hideClientButton,
  _integration: active.value.config._integration,
})

const dereferenced = ref<OpenAPIV3_1.Document | null>(null)

const modal = useTemplateRef('modal')

/**
 * Keeps the client store in sync with the workspace store
 *
 * Handles resetting the client store when the document changes
 */
const {
  activeServer,
  activeEnvVariables,
  activeEnvironment,
  activeWorkspace,
  getSecuritySchemes,
  openClient,
} = mapConfigToClientStore({
  clientStore,
  workspaceStore,
  config: mergedConfig,
  el: modal,
  isIntersectionEnabled: ref(true),
  dereferencedDocument: dereferenced,
})

onCustomEvent(root, 'scalar-open-client', (event) => {
  openClient()
  console.log('scalar-open-client', event)
})

// ---------------------------------------------------------------------------
// Active Document Handling

watch(
  activeSlug,
  async (newSlug) => {
    const normalized = configs.value[newSlug]
    if (!normalized) {
      return
    }

    await addOrUpdateDocument({
      slug: newSlug,
      config: normalized.config,
      source: normalized.source,
      store: workspaceStore,
      isIntersectionEnabled,
    })

    // Map the document to the client store for now
    const raw = JSON.parse(workspaceStore.exportActiveDocument('json') ?? '{}')
    dereferenced.value = dereferenceSync(raw)
  },
  {
    immediate: true,
  },
)
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
      :document="activeDocument"
      :getSecuritySchemes="getSecuritySchemes"
      :isDark="!!workspaceStore.workspace['x-scalar-dark-mode']"
      :xScalarDefaultClient="
        workspaceStore.workspace['x-scalar-default-client']
      "
      @toggleDarkMode="() => toggleColorMode()">
      <template #document-selector>
        <DocumentSelector
          :modelValue="activeSlug"
          :options="documentOptionList"
          @update:modelValue="changeSelectedDocument" />
      </template>
      <!-- Pass through content, sidebar and footer slots -->
      <template #content-start>
        <!-- Only appears on localhost -->
        <ApiReferenceToolbar
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
      <template #client><div ref="modal" /></template>
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
