<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'

import { useJsonEditor } from './hooks/use-editor/use-editor'

const { appState } = defineProps<CollectionProps>()

const monacoEditorRef = ref<HTMLElement>()
const editor = ref<ReturnType<typeof useJsonEditor>>()

onMounted(() => {
  if (!monacoEditorRef.value) {
    return
  }

  editor.value = useJsonEditor({
    element: monacoEditorRef.value,
    value: JSON.stringify(
      {
        openapi: '3.2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/planets': {
            get: {
              summary: 'Get a planet',
              description: 'Get a planet by ID',
            },
          },
        },
      },
      null,
      2,
    ),
    isDarkMode: appState.isDarkMode,
    theme: appState.theme.styles.value.themeStyles,
  })
})

const handleHighlightPath = () => {
  editor.value?.focusPath(['paths', '/planets', 'get'])
}
</script>

<template>
  <div
    ref="monacoEditorRef"
    class="h-[500px] w-full min-w-0 flex-1 overflow-hidden" />
  <button
    type="button"
    @click="handleHighlightPath">
    Highlight Path
  </button>
</template>
<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
}

:deep(.json-path-highlight) {
  background-color: rgba(255, 200, 0, 0.35);
  border-radius: 4px;
}

:deep(.json-focus-highlight) {
  background-color: color-mix(
    in srgb,
    var(--scalar-color-accent, #24b47e) 18%,
    transparent
  );
  border-radius: 4px;
}
</style>
