<script setup lang="ts">
import { type SwaggerEditor } from '@scalar/swagger-editor'
import { type ThemeId } from '@scalar/themes'
import { useResizeObserver } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

import { deepMerge } from '../helpers'
import { useParser, useSpec } from '../hooks'
import type { ReferenceConfiguration, ReferenceProps, Spec } from '../types'
import ApiReferenceBase from './ApiReferenceBase.vue'

const props = withDefaults(defineProps<ReferenceProps>(), {
  hasEditor: true,
  showSidebar: undefined,
  isEditable: undefined,
  footerBelowSidebar: undefined,
})

const emits = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (
    e: 'startAIWriter',
    value: string[],
    swaggerData: string,
    swaggerType: 'json' | 'yaml',
  ): void
}>()

/**
 * The editor component has heavy dependencies (process), let's lazy load it.
 */
const LazyLoadedSwaggerEditor = defineAsyncComponent(() =>
  import('@scalar/swagger-editor').then((module) => module.SwaggerEditor),
)

/** Merge the default configuration with the given configuration. */
const currentConfiguration = computed((): ReferenceConfiguration => {
  if (
    props.spec ||
    props.specUrl ||
    props.specResult ||
    props.proxyUrl ||
    props.theme ||
    props.initialTabState ||
    props.showSidebar ||
    props.footerBelowSidebar ||
    props.isEditable ||
    props.hocuspocusConfiguration
  ) {
    console.warn(
      '[ApiReference] The <ApiReference /> component now accepts a single `configuration` prop. Please update your code.',
    )
  }

  return deepMerge(props.configuration ?? {}, {
    spec: {
      content: props.spec ?? undefined,
      url: props.specUrl ?? undefined,
      preparsedContent: props.specResult ?? undefined,
    },
    proxy: props.proxyUrl ?? undefined,
    theme: props.theme ?? 'default',
    tabs: {
      initialContent: props.initialTabState ?? 'Getting Started',
    },
    showSidebar: props.showSidebar ?? true,
    isEditable: props.isEditable ?? false,
    footerBelowSidebar: props.footerBelowSidebar ?? false,
    hocuspocusConfiguration: props.hocuspocusConfiguration ?? undefined,
  })
})

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
  emits('startAIWriter', value, swaggerData, swaggerType)
}

const swaggerEditorRef = ref<typeof SwaggerEditor | undefined>()
</script>
<template>
  <ApiReferenceBase
    :currentConfiguration="currentConfiguration"
    :hasEditor="hasEditor"
    :parsedSpec="parsedSpecRef"
    :rawSpec="rawSpecRef"
    :swaggerEditorRef="swaggerEditorRef"
    @changeTheme="$emit('changeTheme', $event)">
    <template #header>
      <slot name="header" />
    </template>
    <template #mobile-header>
      <slot name="mobile-header" />
    </template>
    <template #search-modal>
      <slot name="search-modal" />
    </template>
    <template
      v-if="LazyLoadedSwaggerEditor"
      #editor>
      <LazyLoadedSwaggerEditor
        ref="swaggerEditorRef"
        :aiWriterMarkdown="aiWriterMarkdown"
        :error="errorRef"
        :hocuspocusConfiguration="currentConfiguration?.hocuspocusConfiguration"
        :initialTabState="currentConfiguration?.tabs?.initialContent"
        :proxyUrl="currentConfiguration?.proxy"
        :theme="currentConfiguration?.theme"
        :value="rawSpecRef"
        @changeTheme="$emit('changeTheme', $event)"
        @contentUpdate="(newContent: string) => setRawSpecRef(newContent)"
        @startAIWriter="handleAIWriter" />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </ApiReferenceBase>
</template>
