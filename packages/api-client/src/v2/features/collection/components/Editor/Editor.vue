<script setup lang="ts">
import { ScalarButton, ScalarHotkey } from '@scalar/components'
import { debounce } from '@scalar/helpers/general/debounce'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { isObject } from '@scalar/helpers/object/is-object'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'

import { useJsonEditor } from './hooks/use-editor/use-editor'

const { appState, collectionType, documentSlug, method, path, workspaceStore } =
  defineProps<CollectionProps>()

const monacoEditorRef = ref<HTMLElement>()
const editor = ref<ReturnType<typeof useJsonEditor>>()

const editorValue = ref('')
const isProgrammaticUpdate = ref(false)

const loadDocumentIntoEditor = async () => {
  editorValue.value = JSON.stringify(
    unpackProxyObject(await workspaceStore.getEditableDocument(documentSlug), {
      depth: 1,
    }),
    null,
    2,
  )
}

const formatJson = async () => {
  await editor.value?.formatDocument()
}

const focusOperation = async () => {
  if (!path || !isHttpMethod(method)) {
    return
  }
  await editor.value?.focusPath(['paths', path, method])
}

const safeParseJson = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const safeParseJsonObject = (value: string) => {
  const parsed = safeParseJson(value)
  if (!isObject(parsed)) {
    return null
  }
  return parsed
}

const persistEditorToWorkspace = async (value: string) => {
  if (isProgrammaticUpdate.value) {
    return
  }

  const parsed = safeParseJsonObject(value)
  if (!parsed) {
    return
  }
  await workspaceStore.replaceDocument(documentSlug, parsed)
}

const { execute: debouncedPersist } = debounce({ delay: 600, maxWait: 1500 })

const handleEditorChange = (value: string) => {
  editorValue.value = value
  debouncedPersist('editor:replace-document', () =>
    persistEditorToWorkspace(value),
  )
}

const focusOperationServers = async () => {
  if (!path || !isHttpMethod(method)) {
    return
  }

  const parsed = safeParseJson(editor.value?.getValue?.() ?? editorValue.value)

  const operation = parsed?.paths?.[path]?.[method]
  if (!isObject(operation)) {
    return
  }

  // Add default servers if not present
  operation.servers ??= []
  await editor.value?.focusPath(['paths', path, method, 'servers'])
}

const KEYDOWN_OPTIONS = { capture: true } as const

const handleKeydown = (e: KeyboardEvent) => {
  const hasEditorFocus = editor.value?.hasTextFocus?.() ?? false
  if (!hasEditorFocus) {
    return
  }

  if (!e.altKey || e.metaKey || e.ctrlKey) {
    return
  }

  const key = e.key.toLowerCase()

  if (key === 'o' && !e.shiftKey) {
    e.preventDefault()
    void focusOperation()
    return
  }

  if (key === 's' && !e.shiftKey) {
    e.preventDefault()
    void focusOperationServers()
    return
  }

  if (key === 'f' && e.shiftKey) {
    e.preventDefault()
    void formatJson()
  }
}

onMounted(async () => {
  if (!monacoEditorRef.value) {
    return
  }

  await loadDocumentIntoEditor()

  editor.value = useJsonEditor({
    element: monacoEditorRef.value,
    value: editorValue,
    onChange: handleEditorChange,
    isDarkMode: appState.isDarkMode,
    theme: appState.theme.styles.value.themeStyles,
  })

  await focusOperation()

  window.addEventListener('keydown', handleKeydown, KEYDOWN_OPTIONS)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown, KEYDOWN_OPTIONS)
})

watch(
  () => documentSlug,
  () => {
    isProgrammaticUpdate.value = true
    editor.value?.setValue(editorValue.value)
    setTimeout(() => {
      isProgrammaticUpdate.value = false
    }, 0)
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="collectionType === 'operation' && path && isHttpMethod(method)"
    class="flex w-full min-w-0 flex-1 flex-col gap-2">
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <span class="text-c-2 text-xs font-medium">Shortcuts</span>

        <ScalarButton
          size="sm"
          variant="ghost"
          @click="focusOperation">
          <span>Operation</span>
          <span class="text-c-3 ml-2 text-[11px]">
            <ScalarHotkey
              hotkey="O"
              :modifier="['Alt']" />
          </span>
        </ScalarButton>

        <ScalarButton
          size="sm"
          variant="ghost"
          @click="focusOperationServers">
          <span>Servers</span>
          <span class="text-c-3 ml-2 text-[11px]">
            <ScalarHotkey
              hotkey="S"
              :modifier="['Alt']" />
          </span>
        </ScalarButton>
      </div>

      <ScalarButton
        class="shrink-0"
        size="sm"
        variant="ghost"
        @click="formatJson">
        <span>Format JSON</span>
        <span class="text-c-3 ml-2 text-[11px]">
          <ScalarHotkey
            hotkey="F"
            :modifier="['Alt']" />
        </span>
      </ScalarButton>
    </div>

    <div
      class="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-lg border">
      <div
        ref="monacoEditorRef"
        class="h-[500px] w-full min-w-0 flex-1 overflow-hidden" />
    </div>
  </div>
  <div v-else>No operation context found</div>
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
