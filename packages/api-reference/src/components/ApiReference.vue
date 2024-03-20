<script setup lang="ts">
import { createHead, useSeoMeta } from 'unhead'
import { computed, toRef, watch } from 'vue'
import { toast } from 'vue-sonner'

import { useDarkModeState, useReactiveSpec, useSnippetTargets } from '../hooks'
import { useToasts } from '../hooks/useToasts'
import { useGlobalStore } from '../stores'
import { type ReferenceConfiguration, type ReferenceProps } from '../types'
import CustomToaster from './CustomToaster.vue'
import Layouts from './Layouts/'

const props = defineProps<ReferenceProps>()

// If content changes it is emitted to the parent component to be handed back in as a spec string
defineEmits<{
  (e: 'updateContent', value: string): void
}>()

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
}))

// Configure Reference toasts to use vue-sonner
const { initializeToasts } = useToasts()
initializeToasts((message) => {
  toast(message)
})

// Create the head tag if the configuration has meta data
if (configuration.value?.metaData) {
  createHead()
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

// Handle the events from the toggle buttons and map the configuration to the internal state
const { toggleDarkMode, setDarkMode } = useDarkModeState()
mapConfigToState('darkMode', (newDarkMode) => {
  if (newDarkMode !== undefined) setDarkMode(newDarkMode)
})

// Prefill authentication
const { setAuthentication } = useGlobalStore()
mapConfigToState('authentication', setAuthentication)

// Hides any client snippets from the references
const { setExcludedClients } = useSnippetTargets()
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
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="() => toggleDarkMode()"
    @updateContent="$emit('updateContent', $event)">
    <template #footer><slot name="footer" /></template>
  </Component>
  <!-- Initialize the vue-sonner instance -->
  <CustomToaster />
</template>
<style>
body {
  margin: 0;
}
</style>
