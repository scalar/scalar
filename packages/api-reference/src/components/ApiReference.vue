<script setup lang="ts">
import { migrateThemeVariables } from '@scalar/themes'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import { computed, toRef, watch } from 'vue'

import { useReactiveSpec } from '../hooks'
import { useHttpClientStore } from '../stores'
import type { ReferenceProps } from '../types'
import { Layouts } from './Layouts'

const props = defineProps<ReferenceProps>()

// If content changes it is emitted to the parent component to be handed back in as a spec string
defineEmits<{
  (e: 'updateContent', value: string): void
}>()

const { setColorMode, toggleColorMode, darkLightMode } = useColorMode({
  initialColorMode: props.configuration?.darkMode ? 'dark' : undefined,
  overrideColorMode: props.configuration?.forceDarkModeState,
})

/** Update the dark mode state when props change */
watch(
  () => props.configuration?.darkMode,
  (isDark) => setColorMode(isDark ? 'dark' : 'light'),
)

const customCss = computed(() => {
  if (!props.configuration?.customCss) return undefined
  return migrateThemeVariables(props.configuration?.customCss)
})

watch(customCss, () => console.log(customCss.value))

// Set defaults as needed on the provided configuration
const configuration = computed<ReferenceConfiguration>(() => ({
  spec: {
    content: undefined,
    url: undefined,
    ...props.configuration?.spec,
  },
  proxyUrl: undefined,
  theme: 'default',
  showSidebar: true,
  isEditable: false,
  ...props.configuration,
  customCss: customCss.value,
}))

if (configuration.value?.metaData) {
  useSeoMeta(configuration.value.metaData)
}

// ---------------------------------------------------------------------------/
// HANDLE MAPPING CONFIGURATION TO INTERNAL REFERENCE STATE

/** Helper utility to map configuration props to the ApiReference internal state */
function mapConfigToState<K extends keyof ReferenceConfiguration>(
  key: K,
  setter: (val: NonNullable<ReferenceConfiguration[K]>) => any,
) {
  watch(
    () => configuration.value?.[key],
    (newValue) => {
      console.log('newValue', newValue)
      if (typeof newValue !== 'undefined') setter(newValue)
    },
    { immediate: true },
  )
}

// Hides any client snippets from the references
const { setExcludedClients, setDefaultHttpClient } = useHttpClientStore()
mapConfigToState('defaultHttpClient', setDefaultHttpClient)
mapConfigToState('hiddenClients', setExcludedClients)

const { parsedSpec, rawSpec } = useReactiveSpec({
  proxyUrl: toRef(
    () => configuration.value.proxyUrl || configuration.value.proxy || '',
  ),
  specConfig: toRef(() => configuration.value.spec || {}),
})

const favicon = computed(() => configuration.value.favicon)
useFavicon(favicon)
</script>
<template>
  <!-- Inject any custom CSS directly into a style tag -->
  <component
    :is="'style'"
    v-if="configuration?.customCss">
    {{ configuration.customCss }}
  </component>
  <Layouts
    :configuration="configuration"
    :isDark="darkLightMode === 'dark'"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="() => toggleColorMode()"
    @updateContent="$emit('updateContent', $event)">
    <template #footer><slot name="footer" /></template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end><slot name="footer" /></template>
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
