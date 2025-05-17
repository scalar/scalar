<script setup lang="ts">
import { upgrade } from '@scalar/openapi-parser'
import { createCollection } from '@scalar/store'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import { computed, toRef, watch } from 'vue'

import { useReactiveSpec } from '@/hooks/useReactiveSpec'

import { Layouts } from './Layouts'

const { configuration } = defineProps<{
  configuration: Partial<ApiReferenceConfiguration>
}>()

// If content changes it is emitted to the parent component to be handed back in as a spec string
defineEmits<{
  (e: 'updateContent', value: string): void
}>()

const { toggleColorMode, isDarkMode } = useColorMode({
  initialColorMode: configuration.darkMode ? 'dark' : undefined,
  overrideColorMode: configuration.forceDarkModeState,
})

/** Update the dark mode state when props change */
watch(
  () => configuration.darkMode,
  (isDark) => (isDarkMode.value = !!isDark),
)

if (configuration.metaData) {
  useSeoMeta(configuration.metaData)
}

const { parsedSpec, rawSpec } = useReactiveSpec({
  proxyUrl: toRef(() => configuration.proxyUrl || ''),
  specConfig: toRef(() => configuration || {}),
})

// New Store
const collection = createCollection(rawSpec.value)

// TODO: Woah, this should all be done in the store.
watch(rawSpec, (rawSpec) => {
  const { specification: content } = upgrade(rawSpec) as unknown as Record<
    string,
    unknown
  >

  collection.update(content as unknown as Record<string, unknown>)
})

// TODO: defineSlots

const favicon = computed(() => configuration.favicon)
useFavicon(favicon)
</script>
<template>
  <!-- SingleApiReference -->
  <!-- Inject any custom CSS directly into a style tag -->
  <component
    :is="'style'"
    v-if="configuration?.customCss">
    {{ configuration.customCss }}
  </component>
  <div style="color: white">
    <h1>Hello from the new Store 👋 {{ collection.document.info?.title }}</h1>
  </div>
  <pre><code style="color: white">{{ collection.document.servers }}</code></pre>
  <Layouts
    :configuration="configuration"
    :isDark="isDarkMode"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="() => toggleColorMode()"
    @updateContent="$emit('updateContent', $event)">
    <template #footer><slot name="footer" /></template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end><slot name="footer" /></template>
    <template #document-selector>
      <slot name="document-selector" />
    </template>
  </Layouts>
</template>
<style>
@layer scalar-base {
  body {
    margin: 0;
    background-color: var(--scalar-background-1);
  }
}
</style>
