<script lang="ts" setup>
import { type StatesArray } from '@hocuspocus/provider'
import { type SwaggerSpec, parseSwaggerFile } from '@scalar/swagger-parser'
import { type ThemeId, ThemeStyles } from '@scalar/themes'
import { useDebounceFn } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import coinmarketcap from '../../coinmarketcapv3.json'
import petstore from '../../petstorev3.json'
import tableau from '../../tableauv3.json'
import {
  type EditorHeaderTabs,
  type GettingStartedExamples,
  type SwaggerEditorProps,
} from '../../types'
import GettingStarted from './GettingStarted.vue'
import SwaggerEditorHeader from './SwaggerEditorHeader.vue'
import SwaggerEditorInput from './SwaggerEditorInput.vue'
import SwaggerEditorNotification from './SwaggerEditorNotification.vue'
import SwaggerEditorStatusBar from './SwaggerEditorStatusBar.vue'

const props = defineProps<SwaggerEditorProps>()

const emit = defineEmits<{
  (e: 'contentUpdate', value: string): void
  (e: 'specUpdate', spec: SwaggerSpec): void
  (e: 'import', value: string): void
  (e: 'changeTheme', value: ThemeId): void
}>()

const currentExample = ref<string | null>(null)

const awarenessStates = ref<StatesArray>([])

const parserError = ref<string>('')

const handleSpecUpdate = useDebounceFn((value) => {
  // Store content in local storage
  if (!props.hocuspocusConfiguration) {
    localStorage.setItem('swagger-editor-content', value)
  }

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

onMounted(async () => {
  if (props.hocuspocusConfiguration || props.value) {
    return
  }

  const previousContent = localStorage.getItem('swagger-editor-content')
  if (!previousContent) {
    return
  }

  currentExample.value = previousContent
})

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

function handleChangeExample(example: GettingStartedExamples) {
  let spec = ''

  if (example === 'Petstore') {
    spec = JSON.stringify(petstore, null, 2)
  } else if (example === 'CoinMarketCap') {
    spec = JSON.stringify(coinmarketcap, null, 2)
  } else if (example === 'Tableau') {
    spec = JSON.stringify(tableau, null, 2)
  } else {
    return
  }

  handleSpecUpdate(spec)
  currentExample.value = spec
}

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

const activeTab = ref<EditorHeaderTabs>(
  props.initialTabState ?? 'Getting Started',
)
</script>
<template>
  <ThemeStyles :id="theme" />
  <div class="swagger-editor">
    <SwaggerEditorHeader
      :activeTab="activeTab"
      @import="importHandler"
      @updateActiveTab="activeTab = $event" />
    <SwaggerEditorNotification
      v-if="activeTab === 'Swagger Editor' && formattedError">
      {{ formattedError }}
    </SwaggerEditorNotification>
    <SwaggerEditorInput
      v-if="activeTab === 'Swagger Editor'"
      ref="codeMirrorReference"
      :hocuspocusConfiguration="hocuspocusConfiguration"
      :value="currentExample ?? undefined"
      @awarenessUpdate="handleAwarenessUpdate"
      @contentUpdate="handleContentUpdate" />
    <SwaggerEditorStatusBar
      v-if="activeTab === 'Swagger Editor' && awarenessStates.length">
      {{ awarenessStates.length }} user{{
        awarenessStates.length === 1 ? '' : 's'
      }}
      online
    </SwaggerEditorStatusBar>
    <GettingStarted
      v-show="activeTab === 'Getting Started'"
      :theme="!theme || theme === 'none' ? 'default' : theme"
      @changeExample="handleChangeExample"
      @changeTheme="emit('changeTheme', $event)"
      @openEditor="activeTab = 'Swagger Editor'" />
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
  box-shadow: -1px 0 0 0
      var(--theme-border-color, var(--default-theme-border-color)),
    -1px 0 0 0 var(--theme-background-1, var(--default-theme-background-1));
}
@media screen and (max-width: 1000px) {
  .swagger-editor {
    border-right: none;
    box-shadow: none;
  }
}
</style>
