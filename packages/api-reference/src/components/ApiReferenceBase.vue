<script setup lang="ts">
import { type SwaggerEditor } from '@scalar/swagger-editor'
import { type ThemeId, ThemeStyles } from '@scalar/themes'
import { FlowToastContainer } from '@scalar/use-toasts'
import { useResizeObserver } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

import { deepMerge } from '../helpers'
import { useParser, useSpec } from '../hooks'
import {
  DEFAULT_CONFIG,
  type ReferenceConfiguration,
  type ReferenceLayoutSlot,
  type ReferenceProps,
  type ReferenceSlotProps,
  type Spec,
} from '../types'
import ApiReferenceLayout from './ApiReferenceLayout.vue'

const props = defineProps<ReferenceProps>()

const emit = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'updateContent', value: string): void
  (value: string[], swaggerData: string, swaggerType: 'json' | 'yaml'): void
}>()

type ReferenceSlot = Exclude<ReferenceLayoutSlot, 'editor'>

const slots = defineSlots<{
  [x in ReferenceSlot]: (props: ReferenceSlotProps) => any
}>()

/**
 * The editor component has heavy dependencies (process), let's lazy load it.
 */
const LazyLoadedSwaggerEditor = defineAsyncComponent(() =>
  import('@scalar/swagger-editor').then((module) => module.SwaggerEditor),
)

/** Merge the default configuration with the given configuration. */
const currentConfiguration = computed(
  (): ReferenceConfiguration =>
    deepMerge(props.configuration ?? {}, { ...DEFAULT_CONFIG }),
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
    <!-- Passes up all the slots except `editor` with typed slot props -->
    <template
      v-for="(_, name) in slots"
      #[name]="scope">
      <slot
        :name="name"
        v-bind="scope" />
    </template>
    <template
      v-if="LazyLoadedSwaggerEditor"
      #editor>
      <LazyLoadedSwaggerEditor
        ref="swaggerEditorRef"
        :error="errorRef"
        :hocuspocusConfiguration="currentConfiguration.hocuspocusConfiguration"
        :proxyUrl="currentConfiguration.proxy"
        :theme="currentConfiguration.theme"
        :value="rawSpecRef"
        @changeTheme="$emit('changeTheme', $event)"
        @contentUpdate="(newContent: string) => setRawSpecRef(newContent)" />
    </template>
  </ApiReferenceLayout>
</template>
