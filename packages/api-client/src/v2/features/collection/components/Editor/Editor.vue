<script setup lang="ts">
import {
  ScalarButton,
  ScalarHotkey,
  ScalarLoading,
  ScalarToggle,
  useLoadingState,
} from '@scalar/components'
import { debounce } from '@scalar/helpers/general/debounce'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { isObject } from '@scalar/helpers/object/is-object'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'

import { useJsonEditor } from './hooks/use-editor/use-editor'

const { appState, collectionType, documentSlug, method, path, workspaceStore } =
  defineProps<CollectionProps>()

const monacoEditorRef = ref<HTMLElement>()
const editor = ref<ReturnType<typeof useJsonEditor>>()

const editorValue = ref('')
const isProgrammaticUpdate = ref(false)

const AUTO_SAVE_STORAGE_KEY = 'scalar:api-client:operation-editor:auto-save'
const isAutoSaveEnabled = ref(true)
const isDirty = ref(false)

const saveLoader = useLoadingState()
const savesInFlight = ref(0)
const saveHadError = ref(false)

const startSaving = () => {
  if (savesInFlight.value === 0) {
    saveHadError.value = false
    saveLoader.start()
  }
  savesInFlight.value += 1
}

const finishSaving = async ({ ok }: { ok: boolean }) => {
  saveHadError.value = saveHadError.value || !ok
  savesInFlight.value = Math.max(0, savesInFlight.value - 1)

  if (savesInFlight.value !== 0) {
    return
  }

  if (saveHadError.value) {
    await saveLoader.invalidate()
    return
  }

  await saveLoader.validate({ duration: 900 })
}

const saveStatusText = computed(() => {
  if (!saveLoader.isActive) {
    return null
  }
  if (saveLoader.isLoading) {
    return 'Saving…'
  }
  if (saveLoader.isInvalid) {
    return 'Save failed'
  }
  if (saveLoader.isValid) {
    return 'Saved'
  }
  return null
})

const editorStatusText = computed(() => {
  if (!isAutoSaveEnabled.value && isDirty.value) {
    return 'Unsaved'
  }

  return saveStatusText.value
})

const shouldShowEditorStatus = computed(() => editorStatusText.value !== null)

const loadDocumentIntoEditor = async () => {
  isProgrammaticUpdate.value = true
  try {
    editorValue.value = JSON.stringify(
      unpackProxyObject(
        await workspaceStore.getEditableDocument(documentSlug),
        {
          depth: 1,
        },
      ),
      null,
      2,
    )
  } finally {
    setTimeout(() => {
      isProgrammaticUpdate.value = false
    }, 0)
  }
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

const persistEditorToWorkspace = async (
  value: string,
  { showInvalidJsonError }: { showInvalidJsonError: boolean },
) => {
  if (isProgrammaticUpdate.value) {
    return
  }

  const parsed = safeParseJsonObject(value)
  if (!parsed) {
    if (showInvalidJsonError) {
      await saveLoader.invalidate()
    }
    return
  }

  startSaving()
  try {
    await workspaceStore.replaceDocument(documentSlug, parsed)
    isDirty.value = false
    await finishSaving({ ok: true })
  } catch {
    await finishSaving({ ok: false })
  }
}

const debouncedPersist = debounce({ delay: 600, maxWait: 1500 })

const saveNow = async () => {
  await persistEditorToWorkspace(
    editor.value?.getValue?.() ?? editorValue.value,
    {
      showInvalidJsonError: true,
    },
  )
}

const handleEditorChange = (value: string) => {
  editorValue.value = value

  if (isProgrammaticUpdate.value) {
    return
  }

  isDirty.value = true

  if (!isAutoSaveEnabled.value) {
    return
  }

  debouncedPersist.execute('editor:replace-document', () =>
    persistEditorToWorkspace(value, { showInvalidJsonError: false }),
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

  // Update the editor value
  editorValue.value = JSON.stringify(parsed, null, 2)
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

onMounted(() => {
  if (!monacoEditorRef.value) {
    return
  }

  const stored =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(AUTO_SAVE_STORAGE_KEY)
      : null
  if (stored === '0') {
    isAutoSaveEnabled.value = false
  }

  editor.value = useJsonEditor({
    element: monacoEditorRef.value,
    value: editorValue,
    onChange: handleEditorChange,
    isDarkMode: appState.isDarkMode,
    theme: appState.theme.styles.value.themeStyles,
  })

  window.addEventListener('keydown', handleKeydown, KEYDOWN_OPTIONS)
})

onBeforeUnmount(() => {
  debouncedPersist.cleanup()
  window.removeEventListener('keydown', handleKeydown, KEYDOWN_OPTIONS)
})

watch(
  () => documentSlug,
  async () => {
    await loadDocumentIntoEditor()
    isDirty.value = false
    await focusOperation()
  },
  { immediate: true },
)

watch(
  isAutoSaveEnabled,
  (isEnabled) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_SAVE_STORAGE_KEY, isEnabled ? '1' : '0')
    }

    if (!isEnabled) {
      debouncedPersist.cleanup()
      return
    }

    if (isDirty.value) {
      debouncedPersist.execute('editor:replace-document', () =>
        persistEditorToWorkspace(
          editor.value?.getValue?.() ?? editorValue.value,
          { showInvalidJsonError: false },
        ),
      )
    }
  },
  { flush: 'post' },
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

      <div class="flex shrink-0 items-center gap-2">
        <ScalarButton
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
    </div>

    <div
      class="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-lg border">
      <div class="relative h-[500px] w-full min-w-0 flex-1 overflow-hidden">
        <div class="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
          <div
            class="text-c-2 bg-b-1 pointer-events-auto flex items-center gap-2 rounded border px-2 py-1 text-[11px]">
            <span class="whitespace-nowrap">Auto-save</span>
            <ScalarToggle v-model="isAutoSaveEnabled" />
          </div>

          <ScalarButton
            v-if="!isAutoSaveEnabled"
            class="pointer-events-auto"
            :disabled="!isDirty || saveLoader.isLoading"
            size="xs"
            variant="ghost"
            @click="saveNow">
            Save
          </ScalarButton>

          <div
            v-if="shouldShowEditorStatus"
            class="text-c-2 bg-b-1 pointer-events-none flex items-center gap-1 rounded border px-2 py-1 text-[11px]">
            <ScalarLoading
              v-if="saveLoader.isActive"
              class="self-center"
              :loader="saveLoader"
              size="sm" />
            <span class="whitespace-nowrap">{{ editorStatusText }}</span>
          </div>
        </div>

        <div
          ref="monacoEditorRef"
          class="h-full w-full min-w-0 flex-1 overflow-hidden" />
      </div>
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
