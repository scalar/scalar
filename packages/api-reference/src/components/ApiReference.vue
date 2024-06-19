<script setup lang="ts">
import { useAuthenticationStore } from '@scalar/api-client'
import { migrateThemeVariables } from '@scalar/themes'
import { useSeoMeta } from '@unhead/vue'
import { computed, toRef, watch } from 'vue'

import { useDarkModeState, useReactiveSpec } from '../hooks'
import { useHttpClientStore } from '../stores'
import type { ReferenceConfiguration, ReferenceProps } from '../types'
import Layouts from './Layouts/'

const props = defineProps<ReferenceProps>()

// If content changes it is emitted to the parent component to be handed back in as a spec string
defineEmits<{
  (e: 'updateContent', value: string): void
}>()

const { toggleDarkMode, isDark } = useDarkModeState(
  props.configuration?.darkMode,
)

/** Update the dark mode state when props change */
watch(
  () => props.configuration?.darkMode,
  (_isDark) => {
    if (_isDark !== isDark.value) toggleDarkMode()
  },
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
  proxy: undefined,
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
      if (typeof newValue !== 'undefined') setter(newValue)
    },
    { immediate: true },
  )
}

// Prefill authentication
const { setAuthentication } = useAuthenticationStore()
mapConfigToState('authentication', setAuthentication)

// Hides any client snippets from the references
const { setExcludedClients } = useHttpClientStore()
mapConfigToState('hiddenClients', setExcludedClients)

const { parsedSpec, rawSpec } = useReactiveSpec({
  proxy: toRef(() => props.configuration?.proxy || ''),
  specConfig: toRef(() => props.configuration?.spec || {}),
})
</script>
<template>
  <!-- Inject any custom CSS directly into a style tag -->
  <component
    :is="'style'"
    v-if="configuration?.customCss">
    {{ configuration.customCss }}
  </component>
  <Component
    :is="Layouts[configuration?.layout || 'modern']"
    :configuration="configuration"
    :isDark="isDark"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="() => toggleDarkMode()"
    @updateContent="$emit('updateContent', $event)">
    <template #footer><slot name="footer" /></template>
  </Component>
</template>
<style>
body {
  margin: 0;
}
</style>
