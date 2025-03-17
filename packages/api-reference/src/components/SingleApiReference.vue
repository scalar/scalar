<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import { computed, toRef, watch } from 'vue'

import { useReactiveSpec } from '../hooks'
import { Layouts } from './Layouts'

const { configuration } = defineProps<{
  configuration: ApiReferenceConfiguration
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

// TODO: Fetch URLs

const content = computed(() => {
  if (typeof configuration.content === 'function') {
    return configuration.content()
  }

  if (typeof configuration.content === 'string') {
    return configuration.content
  }

  if (typeof configuration.content === 'object') {
    return JSON.stringify(configuration.content)
  }

  return JSON.stringify({
    openapi: '3.1.0',
    info: {
      title: 'Example',
      version: '1.0.0',
    },
    paths: {},
  })
})

const { parsedSpec, rawSpec } = useReactiveSpec({
  proxyUrl: toRef(() => configuration.proxyUrl || ''),
  content: toRef(() => content.value || ''),
})

// TODO: defineSlots

const favicon = computed(() => configuration.favicon)
useFavicon(favicon)
</script>
<template>
  content: {{ content }}
  <!-- Inject any custom CSS directly into a style tag -->
  <component
    :is="'style'"
    v-if="configuration?.customCss">
    {{ configuration.customCss }}
  </component>
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
* {
  background: white;
}
@layer scalar-base {
  body {
    margin: 0;
    background-color: var(--scalar-background-1);
  }
}
</style>
