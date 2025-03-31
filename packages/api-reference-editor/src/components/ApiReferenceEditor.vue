<script setup lang="ts">
import {
  Layouts,
  useHttpClientStore,
  useReactiveSpec,
} from '@scalar/api-reference'

import '@scalar/api-reference/style.css'

import { fetchDocument } from '@scalar/oas-utils/helpers'
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
  type SpecConfiguration,
} from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { createHead, useSeoMeta } from 'unhead'
import { computed, ref, toRef, watch, watchEffect } from 'vue'

import EditorInput from './EditorInput.vue'

const props = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration> & {
    /** Option to manage the state externally and have the spec reactively update  */
    useExternalState?: boolean
  }
}>()

// If content changes it is emitted to the parent component to be handed back in as a spec string
defineEmits<{
  (e: 'updateContent', value: string): void
}>()

const { toggleColorMode, colorMode } = useColorMode({
  initialColorMode: props.configuration?.darkMode ? 'dark' : undefined,
})

const editorContent = ref('')

/** Set the new value of the spec file in the input */
function setSpec({ url, content }: SpecConfiguration) {
  if (url) {
    // For URLs we just set the value to fetched string
    try {
      fetchDocument(url).then((val) => {
        editorContent.value = val
      })
    } catch (error) {
      console.error('Failed to fetch spec from URL:', error)
    }
  } else if (typeof content === 'string') {
    // For string values we don't want to stringify as it will alter the format
    editorContent.value = content
  } else {
    // For object specs we must stringify
    editorContent.value = content
      ? JSON.stringify(typeof content === 'function' ? content() : content)
      : ''
  }
}

// Set the content whenever the input props change
watchEffect(() => {
  setSpec({
    content: props.configuration?.content || '',
    url: props.configuration?.url,
  })
})

// ---------------------------------------------------------------------------
/** Editor input used to emit the custom event */
const inputRef = ref<InstanceType<typeof EditorInput> | null>(null)

/** When using external state we have to dispatch the custom event */
function handleContentChange(value: string) {
  if (props.configuration?.useExternalState) {
    /** Custom event (scalar-update) to emit when content changes */
    inputRef.value?.dispatchUpdate(value)
  } else {
    editorContent.value = value
  }
}

/** When using internal state we capture the event and assign the value */
function handleInput(evt: CustomEvent<{ value: string }>) {
  if (!props.configuration?.useExternalState) {
    editorContent.value = evt.detail.value
  }
}

// Set defaults as needed on the provided configuration
const configuration = computed(() =>
  apiReferenceConfigurationSchema.parse(props.configuration),
)

// Create the head tag if the configuration has meta data
if (configuration.value?.metaData) {
  createHead()
  useSeoMeta(configuration.value.metaData)
}

// HANDLE MAPPING CONFIGURATION TO INTERNAL REFERENCE STATE

/** Helper utility to map configuration props to the ApiReference internal state */
function mapConfigToState<K extends keyof ApiReferenceConfiguration>(
  key: K,
  setter: (val: NonNullable<ApiReferenceConfiguration[K]>) => any,
) {
  watch(
    () => configuration.value?.[key],
    (newValue) => {
      if (typeof newValue !== 'undefined') {
        setter(newValue)
      }
    },
    { immediate: true },
  )
}

// Hides any client snippets from the references
const { setExcludedClients } = useHttpClientStore()
mapConfigToState('hiddenClients', setExcludedClients)

const { parsedSpec, rawSpec } = useReactiveSpec({
  proxyUrl: toRef(() => configuration.value.proxyUrl || ''),
  specConfig: toRef(() => configuration.value || {}),
})
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
    :isDark="colorMode === 'dark'"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="() => toggleColorMode()"
    @updateContent="handleContentChange">
    <template #editor>
      <!--  -->
      <EditorInput
        ref="inputRef"
        :modelValue="editorContent"
        @scalarUpdate="handleInput" />
    </template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end><slot name="footer" /></template>
  </Layouts>
</template>
<style>
body {
  margin: 0;
}
</style>
