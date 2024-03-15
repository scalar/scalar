<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { defineModel, nextTick, onMounted, ref, watch } from 'vue'

import OpenAPI30 from '../specifications/openapi-3.0.json'
import OpenAPI31 from '../specifications/openapi-3.1.json'
import Swagger20 from '../specifications/swagger-2.0.json'

const props = withDefaults(
  defineProps<{
    darkMode: boolean
  }>(),
  {
    darkMode: false,
  },
)

// const isDark = useDarkMode(
const model = defineModel<string>()

const monacoEditorRef = ref<HTMLElement | null>(null)
const openApiVersion = ref<'3.1' | '3.0' | '2.0' | null>('3.1')

let editor: monaco.editor.IStandaloneCodeEditor | null = null

async function init() {
  await nextTick()

  if (!monacoEditorRef.value) {
    return
  }

  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      switch (label) {
        case 'json': {
          return new Worker(
            new URL(
              'monaco-editor/esm/vs/language/json/json.worker.js',
              import.meta.url,
            ),
            { type: 'module' },
          )
        }

        default: {
          return new Worker(
            new URL(
              'monaco-editor/esm/vs/editor/editor.worker.js',
              import.meta.url,
            ),
            { type: 'module' },
          )
        }
      }
    },
  }

  editor = monaco.editor.create(monacoEditorRef.value, {
    theme: props.darkMode ? 'vs-dark' : 'vs',
    minimap: { enabled: false },
    overviewRulerLanes: 0,
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 5,
      horizontal: 'hidden',
    },
    scrollBeyondLastLine: false,
    guides: {
      indentation: false,
    },
    formatOnPaste: true,
    formatOnType: true,
    lineHeight: 20,
    renderLineHighlight: 'none',
    fontFamily: `'JetBrains Mono', monospace`,
    value: model.value,
    language: 'json',
    automaticLayout: true,
    stickyScroll: {
      enabled: false,
    },
  })

  editor.onDidChangeModelContent((_) => {
    const newValue = editor?.getValue()

    model.value = newValue

    determineOpenApiVersion(newValue)

    // if YAML, set Monaco to use YAML
    // else use JSON syntax highlighting
    const editorModel = editor?.getModel()
    if (model !== undefined && model !== null) {
      if (
        newValue?.startsWith('openapi:') ||
        newValue?.startsWith('swagger:')
      ) {
        monaco.editor.setModelLanguage(
          editorModel as monaco.editor.ITextModel,
          'yaml',
        )
      } else {
        monaco.editor.setModelLanguage(
          editorModel as monaco.editor.ITextModel,
          'json',
        )
      }
    }
  })

  watch(
    () => model.value,
    (value) => {
      if (editor?.getValue() !== value && typeof value === 'string') {
        editor?.setValue(value)
      }
    },
  )

  watch(
    () => props.darkMode,
    (value) => {
      editor?.updateOptions({
        theme: value ? 'vs-dark' : 'vs',
      })
    },
  )

  const determineOpenApiVersion = (value?: string) => {
    try {
      const data = JSON.parse(value ?? '')

      if (data.swagger === '2.0') {
        openApiVersion.value = '2.0'
      } else if (data.openapi?.match(/^3\.0\.\d(-.+)?$/)) {
        openApiVersion.value = '3.0'
      } else {
        openApiVersion.value = '3.1'
      }
    } catch {
      openApiVersion.value = '3.1'

      return
    }
  }

  watch(
    openApiVersion,
    () => {
      const jsonSchema =
        openApiVersion.value === '2.0'
          ? {
              uri: 'http://swagger.io/v2/schema.json#',
              fileMatch: ['*'],
              schema: Swagger20,
            }
          : openApiVersion.value === '3.0'
            ? {
                uri: 'http://swagger.io/v2/schema.json#',
                fileMatch: ['*'],
                schema: OpenAPI30,
              }
            : {
                uri: 'http://swagger.io/v2/schema.json#',
                fileMatch: ['*'],
                schema: OpenAPI31,
              }

      // Set JSON schema for the editor
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [jsonSchema],
      })
    },
    { immediate: true },
  )
}

onMounted(() => {
  init()
})
</script>

<template>
  <div
    ref="monacoEditorRef"
    class="editor"></div>
</template>

<style>
.editor {
  height: 100%;
  width: 100%;
}
</style>
