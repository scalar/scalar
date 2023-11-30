<script lang="ts" setup>
import { type ThemeId, ThemeStyles } from '@scalar/themes'
import { computed, isRef, ref, watch } from 'vue'

import { isJsonString } from '../../helpers'
import {
  type EditorHeaderTabs,
  type OpenSwaggerEditorActions,
  type SwaggerEditorProps,
} from '../../types'
import SwaggerEditorAIWriter from './SwaggerEditorAIWriter.vue'
import SwaggerEditorGettingStarted from './SwaggerEditorGettingStarted.vue'
import SwaggerEditorHeader from './SwaggerEditorHeader.vue'
import SwaggerEditorInput from './SwaggerEditorInput.vue'
import SwaggerEditorNotification from './SwaggerEditorNotification.vue'
import SwaggerEditorStatusBar from './SwaggerEditorStatusBar.vue'

const props = defineProps<SwaggerEditorProps>()

const emit = defineEmits<{
  (e: 'contentUpdate', value: string): void
  (e: 'import', value: string): void
  (e: 'changeTheme', value: ThemeId): void
  (
    e: 'startAIWriter',
    value: string[],
    swaggerData: string,
    swaggerType: 'json' | 'yaml',
  ): void
}>()

const swaggerEditorHeaderRef = ref<typeof SwaggerEditorHeader | null>(null)

const handleContentUpdate = (value: string) => {
  emit('contentUpdate', value)
}

const codeMirrorReference = ref<typeof SwaggerEditorInput | null>(null)

const formattedError = computed(() => {
  // Check whether there‘s an error
  if (props.error === undefined || props.error === null || props.error === '') {
    return ''
  }

  // Work with strings and refs
  const error = isRef(props.error) ? props.error.value : props.error

  // Handle YAMLExceptions
  if (error.startsWith('YAMLException:')) {
    // Trim everything but the first line
    return error.split('\n')[0]
  }

  return error
})

watch(
  () => props.value,
  async () => {
    if (props.value) {
      handleContentUpdate(props.value)
    }
  },
  { immediate: true },
)

const activeTab = ref<EditorHeaderTabs>(
  props.initialTabState ?? 'Swagger Editor',
)

const handleOpenSwaggerEditor = (action?: OpenSwaggerEditorActions) => {
  activeTab.value = 'Swagger Editor'

  if (action === 'importUrl') {
    swaggerEditorHeaderRef?.value?.importUrlModal?.show()
  } else if (action === 'uploadFile') {
    swaggerEditorHeaderRef?.value?.openFileDialog()
  }
}

function handleAIWriter(queries: string[]) {
  const content = props.value ?? ''
  const specType = isJsonString(content) ? 'json' : 'yaml'
  emit('startAIWriter', queries, content, specType)
}

defineExpose({
  handleOpenSwaggerEditor,
})
</script>
<template>
  <ThemeStyles :id="theme" />
  <div class="swagger-editor">
    <SwaggerEditorHeader
      ref="swaggerEditorHeaderRef"
      :activeTab="activeTab"
      :availableTabs="availableTabs"
      :proxyUrl="proxyUrl"
      @import="handleContentUpdate"
      @updateActiveTab="activeTab = $event" />
    <SwaggerEditorNotification
      v-if="activeTab === 'Swagger Editor' && formattedError">
      {{ formattedError }}
    </SwaggerEditorNotification>
    <SwaggerEditorInput
      v-show="activeTab === 'Swagger Editor'"
      ref="codeMirrorReference"
      :value="value"
      @contentUpdate="handleContentUpdate" />
    <SwaggerEditorAIWriter
      v-if="activeTab === 'AI Writer'"
      :aiWriterMarkdown="aiWriterMarkdown ?? ''"
      @startAIWriter="handleAIWriter" />
    <SwaggerEditorGettingStarted
      v-show="activeTab === 'Getting Started'"
      :theme="!theme || theme === 'none' ? 'default' : theme"
      :value="value"
      @changeTheme="emit('changeTheme', $event)"
      @openSwaggerEditor="handleOpenSwaggerEditor"
      @updateContent="handleContentUpdate" />
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
  /*  layered box shadow dilenator in case themes don't have borders on their sidebar*/
  box-shadow:
    -1px 0 0 0 var(--theme-border-color, var(--default-theme-border-color)),
    -1px 0 0 0 var(--theme-background-1, var(--default-theme-background-1));
}
@media screen and (max-width: 1000px) {
  .swagger-editor {
    border-right: none;
    box-shadow: none;
  }
}
</style>
