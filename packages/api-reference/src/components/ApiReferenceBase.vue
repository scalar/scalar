<script setup lang="ts">
import {
  HeaderTabButton,
  ResetStyles,
  type SwaggerEditor,
} from '@scalar/swagger-editor'
import { type ThemeId, ThemeStyles } from '@scalar/themes'
import { useCodeMirror } from '@scalar/use-codemirror'
import { FlowModal, useModal } from '@scalar/use-modal'
import { FlowToastContainer } from '@scalar/use-toasts'
import { useMediaQuery, useResizeObserver } from '@vueuse/core'
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
import GettingStarted from './GettingStarted.vue'

const props = defineProps<ReferenceProps>()

const emit = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'updateContent', value: string): void
}>()

defineOptions({
  inheritAttrs: false,
})

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
  (): ReferenceConfiguration => props.configuration ?? {},
  // deepMerge(props.configuration ?? {}, { ...DEFAULT_CONFIG }),
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

const gettingStartedModal = useModal()

function handleGettingStarted() {
  gettingStartedModal.show()
}

function handleCloseModal(passThrough: () => void) {
  gettingStartedModal.hide()
  passThrough()
}

const isMobile = useMediaQuery('(max-width: 1000px)')

const swaggerEditorRef = ref<typeof SwaggerEditor | undefined>()

const { setCodeMirrorRef } = useCodeMirror({
  content: rawSpecRef,
  lineNumbers: true,
  onUpdate: (v) => setRawSpecRef(v.state.doc.toString()),
})
</script>
<template>
  <component
    :is="'style'"
    v-if="currentConfiguration.customCss">
    {{ currentConfiguration.customCss }}
  </component>
  <ThemeStyles :id="currentConfiguration?.theme" />
  <FlowToastContainer />
  <FlowModal
    :state="gettingStartedModal"
    title=""
    variant="history">
    <GettingStarted
      :theme="configuration?.theme || 'default'"
      :value="rawSpecRef"
      @changeTheme="$emit('changeTheme', $event)"
      @openSwaggerEditor="gettingStartedModal.hide()"
      @updateContent="handleCloseModal(() => $emit('updateContent', $event))" />
  </FlowModal>
  <ResetStyles v-slot="{ styles }">
    <ApiReferenceLayout
      v-bind="$attrs"
      :class="styles"
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
          :proxyUrl="currentConfiguration.proxy"
          :setCodeMirrorRef="setCodeMirrorRef"
          :theme="currentConfiguration.theme"
          :value="rawSpecRef"
          @changeTheme="$emit('changeTheme', $event)"
          @contentUpdate="(newContent: string) => setRawSpecRef(newContent)">
          <template #tab-items>
            <HeaderTabButton
              v-if="isMobile"
              @click="handleGettingStarted">
              Getting Started
            </HeaderTabButton>
          </template>
        </LazyLoadedSwaggerEditor>
      </template>
    </ApiReferenceLayout>
  </ResetStyles>
</template>
