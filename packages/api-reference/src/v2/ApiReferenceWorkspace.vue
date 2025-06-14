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
import { parseJsonOrYaml } from '@scalar/oas-utils/helpers'
import type {
  AnyApiReferenceConfiguration,
  ApiReferenceConfiguration,
} from '@scalar/types'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { type WorkspaceStore } from '@scalar/workspace-store/client'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onServerPrefetch,
  provide,
  ref,
  shallowRef,
  toRef,
  watch,
} from 'vue'

import ApiReferenceLayout from '@/components/ApiReferenceLayout.vue'
import { DocumentSelector } from '@/components/DocumentSelector'
import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'
import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'
import { onCustomEvent } from '@/v2/events'

const props = defineProps<{
  configuration?: AnyApiReferenceConfiguration
  getWorkspaceStore: () => WorkspaceStore
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

// Provide the intersection observer which has defaults
provide(NAV_STATE_SYMBOL, { isIntersectionEnabled, hash, hashPrefix })

// ---------------------------------------------------------------------------

const root = shallowRef<HTMLElement | null>(null)

/**
 * When the useMultipleDocuments hook is deprecated we will need to handle normalizing the configs.
 *
 * TODO: Sources should be externalized from the configuration.
 */
const configs = availableDocuments

// configs.value.forEach((config) => {
//   if(config.content) {
//     const obj = typeof config.content === 'string' ? parseJsonOrYaml(config.content) : config.content
//     store.addDocument({
//       name: config.slug ?? ,
//       document: obj,
//     })
//   }
// })

/** Injected workspace store. This is provided as functional getter to avoid converting the original object to a reactive prop object
 *
 * In normal standalone mode the ApiReference.vue component will provide the workspace store
 * and this component will use it.
 *
 * In external mode the ApiReference.vue component will not provide the workspace store
 * and this component will use the provided function to get the workspace store.
 */
const store = props.getWorkspaceStore()

// const staticDocuments = props.configuration
// props.configuration?.documents?.forEach((document) => {

onServerPrefetch(() => {
  // For SSR we want to preload the active document into the store
  // store.addDocument({
  //   name: 'test',
  //   document: {
  //     openapi: '3.0.0',
  //   },
  // })
})

onMounted(() => {
  // During client side rendering we load the active document from the URL
  // NOTE: The UI MUST handle a case where the document is empty
  // store.addDocument({
  //   name: 'test',
  //   document: {
  //     openapi: '3.0.0',
  //   },
  // })
})

// onCustomEvent(root, 'scalar-update-sidebar', (event) => {
//   console.log('scalar-update-sidebar', event)
// })

onCustomEvent(root, 'scalar-update-dark-mode', (event) => {
  store.update('x-scalar-dark-mode', event.data.value)
})

// onCustomEvent(root, 'scalar-update-active-document', (event) => {
//   console.log('scalar-update-active-document', event)
//   store.update('x-scalar-active-document', event.data.value)
// })

// ---------------------------------------------------------------------------
// TODO: Remove this legacy code block. Directly copied from SingleApiReference.vue
// Logic should be mapped to the workspace store

// TODO: persistence should be hoisted into standalone
// Client side integrations will want to handle dark mode externally
const { toggleColorMode, isDarkMode } = useColorMode({
  initialColorMode: selectedConfiguration.value.darkMode ? 'dark' : undefined,
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
  <!-- Inject any custom CSS directly into a style tag -->
  <component
    :is="'style'"
    v-if="selectedConfiguration?.customCss">
    {{ selectedConfiguration.customCss }}
  </component>
  <ApiReferenceLayout
    :configuration="selectedConfiguration"
    :isDark="!!store.workspace['x-scalar-dark-mode']"
    @toggleDarkMode="() => toggleColorMode()"
    @updateContent="$emit('updateContent', $event)">
    <template #footer><slot name="footer" /></template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end><slot name="footer" /></template>
    <template #document-selector>
      <DocumentSelector
        v-model="selectedDocumentIndex"
        :options="availableDocuments" />
    </template>
    <template #sidebar-start><slot name="sidebar-start" /></template>
  </ApiReferenceLayout>
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
