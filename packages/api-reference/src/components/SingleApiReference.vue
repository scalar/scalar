<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import { computed, toRef, watch } from 'vue'

import { createStore } from '@/helpers/create-store'
import { useReactiveSpec } from '@/hooks'

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
      title: 'We should fetch URLs I guess',
      version: '1.0.0',
    },
    paths: {
      '/foobar': {
        get: {
          summary: 'Foobar',
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
})

// Old data
const { parsedSpec, rawSpec } = useReactiveSpec({
  proxyUrl: toRef(() => configuration.proxyUrl || ''),
  content: toRef(() => content.value || ''),
})

// New data
createStore(content, configuration)

// TODO: defineSlots

const favicon = computed(() => configuration.favicon)
useFavicon(favicon)
</script>
<template>
  <div class="debug">
    <pre>{{ JSON.stringify(JSON.parse(content), null, 2) }}</pre>
  </div>
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
.debug {
  background: white;
  font-family: monospace;
  padding: 1rem;
}
@layer scalar-base {
  body {
    margin: 0;
    background-color: var(--scalar-background-1);
  }
}
</style>
