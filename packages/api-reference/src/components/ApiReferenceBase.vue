<script setup lang="ts">
import {
  HeaderTabButton,
  type SwaggerEditor,
  type SwaggerEditorInputProps,
} from '@scalar/swagger-editor'
import {
  ResetStyles,
  ScrollbarStyles,
  type ThemeId,
  ThemeStyles,
} from '@scalar/themes'
import { FlowModal, useModal } from '@scalar/use-modal'
import { useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

import { deepMerge } from '../helpers'
import { useParser, useSnippetTargets, useSpec } from '../hooks'
import { useDarkModeState } from '../hooks/useDarkModeState'
import { useGlobalStore } from '../stores'
import {
  DEFAULT_CONFIG,
  type ReferenceConfiguration,
  type ReferenceLayoutSlot,
  type ReferenceProps,
  type ReferenceSlotProps,
  type Spec,
} from '../types'
import ApiReferenceLayout from './ApiReferenceLayout.vue'
import CustomToaster from './CustomToaster.vue'
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

const slots = defineSlots<
  {
    [x in ReferenceSlot]: (props: ReferenceSlotProps) => any
  } & { 'editor-input': SwaggerEditorInputProps }
>()

// The editor component has heavy dependencies (process), let's lazy load it.
const LazyLoadedSwaggerEditor = defineAsyncComponent(() =>
  import('@scalar/swagger-editor').then((module) => module.SwaggerEditor),
)

// Merge the default configuration with the given configuration.
const currentConfiguration = computed(
  (): ReferenceConfiguration =>
    deepMerge(props.configuration ?? {}, { ...DEFAULT_CONFIG }),
)

// Get the raw content
const { rawSpecRef, setRawSpecRef, setConfiguration } = useSpec({
  configuration: currentConfiguration.value.spec,
  proxy: currentConfiguration.value.proxy,
})

// Update the configuration when the spec changes
watch(
  () => currentConfiguration.value.spec,
  () => {
    setConfiguration(currentConfiguration.value.spec)
  },
  {
    deep: true,
  },
)

// Parse the content
const { parsedSpecRef, overwriteParsedSpecRef, errorRef } = useParser({
  input: rawSpecRef,
})

watch(rawSpecRef, () => {
  emit('updateContent', rawSpecRef.value)

  if (props?.configuration?.onSpecUpdate) {
    props?.configuration?.onSpecUpdate(rawSpecRef.value)
  }
})

const { setDarkMode } = useDarkModeState()
watch(
  () => currentConfiguration.value.darkMode,
  (newDarkMode) => {
    if (newDarkMode !== undefined) setDarkMode(newDarkMode)
  },
  { immediate: true },
)

const { setExcludedClients } = useSnippetTargets()
watch(
  () => currentConfiguration.value.hiddenClients,
  (hiddenClients) => {
    if (typeof hiddenClients !== 'undefined') setExcludedClients(hiddenClients)
  },
  { immediate: true },
)

// Track the container height to control the sidebar height
const elementHeight = ref(0)
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0].contentRect.height
})

const swaggerEditorRef = ref<typeof SwaggerEditor | undefined>()

const gettingStartedModal = useModal()

function handleGettingStarted() {
  gettingStartedModal.show()
}

function handleCloseModal(passThrough: () => void) {
  gettingStartedModal.hide()
  passThrough()
}

const isMobile = useMediaQuery('(max-width: 1000px)')

// Prefill authentication
const { setAuthentication } = useGlobalStore()

if (props.configuration?.authentication) {
  setAuthentication(props.configuration?.authentication)
}
</script>
<template>
  <component
    :is="'style'"
    v-if="currentConfiguration.customCss">
    {{ currentConfiguration.customCss }}
  </component>
  <ThemeStyles :id="currentConfiguration?.theme" />
  <CustomToaster />
  <FlowModal
    :state="gettingStartedModal"
    title=""
    variant="history">
    <GettingStarted
      :theme="configuration?.theme || 'default'"
      :value="rawSpecRef"
      @changeTheme="$emit('changeTheme', $event)"
      @openSwaggerEditor="gettingStartedModal.hide()"
      @updateContent="handleCloseModal(() => setRawSpecRef($event))" />
  </FlowModal>
  <ResetStyles v-slot="{ styles: reset }">
    <ScrollbarStyles v-slot="{ styles: scrollbars }">
      <ApiReferenceLayout
        v-bind="$attrs"
        :class="[reset, scrollbars]"
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
            <template #editor-input="editorInputProps">
              <slot
                name="editor-input"
                v-bind="editorInputProps" />
            </template>
          </LazyLoadedSwaggerEditor>
        </template>
      </ApiReferenceLayout>
    </ScrollbarStyles>
  </ResetStyles>
</template>
