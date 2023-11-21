<script setup lang="ts">
import { type SwaggerEditor } from '@scalar/swagger-editor'
import { type ThemeId, ThemeStyles } from '@scalar/themes'
import { FlowToastContainer } from '@scalar/use-toasts'
import { useResizeObserver } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

import { useParser, useSpec } from '../hooks'
import { useGlobalStore } from '../stores/globalStore'
import { type ReferenceProps, type Spec } from '../types'
import ApiReferenceLayout from './ApiReferenceLayout.vue'

const props = defineProps<ReferenceProps>()

const emit = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'updateContent', value: string): void
  (
    e: 'startAIWriter',
    value: string[],
    swaggerData: string,
    swaggerType: 'json' | 'yaml',
  ): void
}>()

// Put the configuration in the global store
const { configuration: currentConfiguration } = useGlobalStore({
  configuration: props.configuration,
})

/**
 * The editor component has heavy dependencies (process), let's lazy load it.
 */
const LazyLoadedSwaggerEditor = defineAsyncComponent(() =>
  import('@scalar/swagger-editor').then((module) => module.SwaggerEditor),
)

// Make it a ComputedRef
const specConfiguration = computed(() => {
  return currentConfiguration.value.spec
})

// Get the raw content
const { rawSpecRef, setRawSpecRef } = useSpec({
  configuration: specConfiguration,
  proxy: currentConfiguration.value.proxy,
})

// Parse the content
const { parsedSpecRef, overwriteParsedSpecRef, errorRef } = useParser({
  input: rawSpecRef,
})

watch(rawSpecRef, () => {
  emit('updateContent', rawSpecRef.value)
})

// Use preparsed content, if it’s passed
watch(
  () => currentConfiguration.value.spec?.preparsedContent,
  (newContent) => {
    if (newContent) {
      overwriteParsedSpecRef(newContent as Spec)
    }
  },
  {
    immediate: true,
  },
)

// Track the container height to control the sidebar height
const elementHeight = ref(0)
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0].contentRect.height
})

// Handle content updates
function handleAIWriter(
  value: string[],
  swaggerData: string,
  swaggerType: 'json' | 'yaml',
) {
  emit('startAIWriter', value, swaggerData, swaggerType)
}

const swaggerEditorRef = ref<typeof SwaggerEditor | undefined>()
</script>
<template>
  <ThemeStyles :id="currentConfiguration?.theme" />
  <FlowToastContainer />
  <ApiReferenceLayout
    :configuration="currentConfiguration"
    :parsedSpec="parsedSpecRef"
    :rawSpec="rawSpecRef"
    :swaggerEditorRef="swaggerEditorRef"
    @changeTheme="$emit('changeTheme', $event)"
    @updateContent="(newContent: string) => setRawSpecRef(newContent)">
    <template #header="attribs">
      <slot
        v-bind="attribs"
        name="header" />
    </template>
    <template #sidebar-start><slot name="sidebar-start" /></template>
    <template #sidebar-end><slot name="sidebar-end" /></template>
    <template #content-start><slot name="content-start" /></template>
    <template #content-end><slot name="content-end" /></template>
    <template #footer><slot name="footer" /></template>
    <template
      v-if="LazyLoadedSwaggerEditor"
      #editor>
      <LazyLoadedSwaggerEditor
        ref="swaggerEditorRef"
        :aiWriterMarkdown="currentConfiguration.aiWriterMarkdown"
        :error="errorRef"
        :hocuspocusConfiguration="currentConfiguration.hocuspocusConfiguration"
        :initialTabState="currentConfiguration.tabs?.initialContent"
        :proxyUrl="currentConfiguration.proxy"
        :theme="currentConfiguration.theme"
        :value="rawSpecRef"
        @changeTheme="$emit('changeTheme', $event)"
        @contentUpdate="(newContent: string) => setRawSpecRef(newContent)"
        @startAIWriter="handleAIWriter" />
    </template>
  </ApiReferenceLayout>
</template>
