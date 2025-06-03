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
import type { ApiReferenceConfiguration } from '@scalar/types'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

import ApiReferenceLayout from '@/components/ApiReferenceLayout.vue'
import { onCustomEvent } from '@/v2/events'

import { store } from './workspace-store'

const { configuration } = defineProps<{
  configuration: Partial<ApiReferenceConfiguration>
}>()

const root = shallowRef<HTMLElement | null>(null)

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
  initialColorMode: configuration.darkMode ? 'dark' : undefined,
  overrideColorMode: configuration.forceDarkModeState,
})

/** Update the dark mode state when props change */
watch(
  () => configuration.darkMode,
  (isDark) => store.update('x-scalar-dark-mode', !!isDark),
)

// Temporary mapping of isDarkMode until we update the standalone component
watch(
  () => isDarkMode,
  () => store.update('x-scalar-dark-mode', isDarkMode.value),
)

if (configuration.metaData) {
  useSeoMeta(configuration.metaData)
}

// TODO: defineSlots

const favicon = computed(() => configuration.favicon)
useFavicon(favicon)

// ---------------------------------------------------------------------------
</script>

<template>
  <!-- SingleApiReference -->
  <!-- Inject any custom CSS directly into a style tag -->
  <component
    :is="'style'"
    v-if="configuration?.customCss">
    {{ configuration.customCss }}
  </component>
  <ApiReferenceLayout
    :configuration="configuration"
    :isDark="!!store.workspace['x-scalar-dark-mode']"
    @toggleDarkMode="() => toggleColorMode()"
    @updateContent="$emit('updateContent', $event)">
    <template #footer><slot name="footer" /></template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end><slot name="footer" /></template>
    <template #document-selector>
      <slot name="document-selector" />
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
