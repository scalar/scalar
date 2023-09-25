<script lang="ts" setup>
import { type StatesArray } from '@hocuspocus/provider'
import { type SwaggerSpec, parseSwaggerFile } from '@scalar/swagger-parser'
import '@scalar/themes/base.css'
import '@scalar/themes/default.css'
import '@scalar/themes/scrollbar.css'
import { useDebounceFn } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'

import { type SwaggerEditorProps } from '../../types'
import SwaggerEditorHeader from './SwaggerEditorHeader.vue'
import SwaggerEditorInput from './SwaggerEditorInput.vue'
import SwaggerEditorNotification from './SwaggerEditorNotification.vue'
import SwaggerEditorStatusBar from './SwaggerEditorStatusBar.vue'

const props = defineProps<SwaggerEditorProps>()

const emit = defineEmits<{
  (e: 'contentUpdate', value: string): void
  (e: 'specUpdate', spec: SwaggerSpec): void
  (e: 'import', value: string): void
}>()

const awarenessStates = ref<StatesArray>([])

const parserError = ref<string>('')

const handleSpecUpdate = useDebounceFn((value) => {
  parseSwaggerFile(value)
    .then((spec: SwaggerSpec) => {
      parserError.value = ''

      emit('specUpdate', spec)
    })
    .catch((error) => {
      parserError.value = error.toString()
    })
})

const handleContentUpdate = (value: string) => {
  emit('contentUpdate', value)
  handleSpecUpdate(value)
}

const handleAwarenessUpdate = (states: StatesArray) => {
  awarenessStates.value = states
}

// Import new content
const importHandler = (value: string) => {
  codeMirrorReference.value?.setCodeMirrorContent(value)
}

const codeMirrorReference = ref<typeof SwaggerEditorInput | null>(null)

const formattedError = computed(() => {
  // Handle YAMLExceptions
  if (parserError.value?.startsWith('YAMLException:')) {
    // Trim everything but the first line
    return parserError.value.split('\n')[0]
  }

  return parserError.value
})

watch(
  () => props.value,
  async () => {
    if (props.value) {
      await nextTick()
      importHandler(props.value)
    }
  },
  { immediate: true },
)
</script>
<template>
  <div class="swagger-editor">
    <SwaggerEditorHeader @import="importHandler" />
    <SwaggerEditorNotification v-if="formattedError">
      {{ formattedError }}
    </SwaggerEditorNotification>
    <SwaggerEditorInput
      ref="codeMirrorReference"
      :hocuspocusConfiguration="hocuspocusConfiguration"
      @awarenessUpdate="handleAwarenessUpdate"
      @contentUpdate="handleContentUpdate" />
    <SwaggerEditorStatusBar v-if="awarenessStates.length">
      {{ awarenessStates.length }} user{{
        awarenessStates.length === 1 ? '' : 's'
      }}
      online
    </SwaggerEditorStatusBar>
  </div>
</template>

<style>
/** CSS Reset */
.swagger-editor,
#headlessui-portal-root {
  p {
    margin: 0;
  }

  i {
    font-style: normal;
  }

  ul,
  ol {
    margin: 0;
    padding: 0;
  }

  /** Add some more things which are normally applied to `html`. */
  font-family: var(--theme-font, var(--default-theme-font));
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;

  /** Make sure box-sizing is set properly. */
  box-sizing: border-box;

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  /** Smooth text rendering */
  * {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
</style>

<style scoped>
.swagger-editor {
  min-width: 0;
  min-height: 0;

  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: auto;
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));

  font-size: var(--theme-small, var(--default-theme-small));
}
</style>
