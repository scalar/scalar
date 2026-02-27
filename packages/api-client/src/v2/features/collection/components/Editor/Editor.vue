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
import * as monaco from 'monaco-editor'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'

import { useJsonEditor } from './hooks/use-editor/use-editor'

const {
  collectionType,
  documentSlug,
  method,
  path,
  workspaceStore,
  currentTheme,
  isDarkMode,
} = defineProps<CollectionProps>()

const monacoEditorRef = ref<HTMLElement>()
const editor = ref<ReturnType<typeof useJsonEditor>>()

const isAutoSaveEnabled = ref(false)
const isDirty = ref(false)

const saveLoader = useLoadingState()

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

const editorStatusTone = computed<
  'warning' | 'loading' | 'success' | 'danger' | null
>(() => {
  if (!shouldShowEditorStatus.value) {
    return null
  }

  if (!isAutoSaveEnabled.value && isDirty.value) {
    return 'warning'
  }

  if (saveLoader.isLoading) {
    return 'loading'
  }

  if (saveLoader.isInvalid) {
    return 'danger'
  }

  if (saveLoader.isValid) {
    return 'success'
  }

  return null
})

const editorStatusDotClass = computed(() => {
  switch (editorStatusTone.value) {
    case 'warning':
      return 'bg-c-alert'
    case 'success':
      return 'bg-c-accent'
    case 'danger':
      return 'bg-c-danger'
    default:
      return 'bg-b-3'
  }
})

const editorStatusTextClass = computed(() => {
  switch (editorStatusTone.value) {
    case 'warning':
      return 'text-c-alert'
    case 'success':
      return 'text-c-accent'
    case 'danger':
      return 'text-c-danger'
    default:
      return 'text-c-2'
  }
})

const getDocumentValue = async () => {
  return JSON.stringify(
    await workspaceStore.getEditableDocument(documentSlug),
    null,
    2,
  )
}

const loadDocumentIntoEditor = async () => {
  editor.value?.setValue(await getDocumentValue())
  isDirty.value = false
  await focusOperation()
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
  const parsed = safeParseJsonObject(value)
  if (!parsed) {
    await saveLoader.invalidate()
    return
  }

  saveLoader.start()
  await workspaceStore.replaceDocument(documentSlug, parsed)
  isDirty.value = false
  await saveLoader.validate({ duration: 900 })
}

const debouncedPersist = debounce({ delay: 1500 })

const saveNow = async () => {
  const value = editor.value?.getValue?.()
  if (!value) {
    return
  }
  await persistEditorToWorkspace(value)
}

const handleEditorChange = (value: string) => {
  isDirty.value = true

  if (!isAutoSaveEnabled.value) {
    return
  }

  debouncedPersist.execute('editor:replace-document', () =>
    persistEditorToWorkspace(value),
  )
}

const focusOperationServers = async () => {
  if (!path || !isHttpMethod(method)) {
    return
  }

  const value = editor.value?.getValue?.()
  if (!value) {
    return
  }
  const parsed = safeParseJson(value)

  const operation = parsed?.paths?.[path]?.[method]
  if (!isObject(operation)) {
    return
  }

  // Add default servers if not present
  operation.servers ??= []

  // Update the editor value
  editor.value?.setValue(JSON.stringify(parsed, null, 2))
  await editor.value?.focusPath(['paths', path, method, 'servers'])
}

onMounted(() => {
  editor.value = useJsonEditor({
    element: monacoEditorRef.value ?? document.createElement('div'),
    onChange: handleEditorChange,
    isDarkMode,
    theme: currentTheme,
    actions: [
      {
        id: 'scalar.editor.focusOperation',
        label: 'Focus Operation',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyO],
        run: async () => {
          await focusOperation()
        },
      },
      {
        id: 'scalar.editor.focusOperationServers',
        label: 'Focus Operation Servers',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyS],
        run: async () => {
          await focusOperationServers()
        },
      },
      {
        id: 'scalar.editor.formatJson',
        label: 'Format JSON',
        keybindings: [
          monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        ],
        run: async () => {
          await formatJson()
        },
      },
    ],
  })

  void loadDocumentIntoEditor()
})

onBeforeUnmount(() => {
  // Persist if there is a pending save
  if (isDirty.value && isAutoSaveEnabled.value) {
    void saveNow()
  }
  // debouncedPersist.cleanup()
  editor.value?.dispose?.()
})

watch(() => documentSlug, loadDocumentIntoEditor)

watch(
  isAutoSaveEnabled,
  (isEnabled) => {
    if (!isEnabled) {
      debouncedPersist.cleanup()
      return
    }

    if (isDirty.value) {
      const value = editor.value?.getValue?.()
      if (!value) {
        return
      }
      debouncedPersist.execute('editor:replace-document', () =>
        persistEditorToWorkspace(value),
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
              :modifier="['Alt', 'Shift']" />
          </span>
        </ScalarButton>
      </div>
    </div>

    <div
      class="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-lg border">
      <div class="relative h-[500px] w-full min-w-0 flex-1 overflow-hidden">
        <div class="pointer-events-none absolute top-2 right-2 z-10">
          <div
            class="bg-b-1 pointer-events-auto flex flex-col items-stretch overflow-hidden rounded-lg border shadow-sm">
            <div class="flex items-center gap-2 px-2 py-1.5">
              <span class="text-c-2 text-[11px] font-medium whitespace-nowrap">
                Auto-save
              </span>
              <ScalarToggle v-model="isAutoSaveEnabled" />

              <div class="bg-b-3 mx-1 h-4 w-px" />

              <div class="min-w-[48px]">
                <ScalarButton
                  v-if="!isAutoSaveEnabled"
                  :disabled="!isDirty || saveLoader.isLoading"
                  size="xs"
                  variant="outlined"
                  @click="saveNow">
                  Save
                </ScalarButton>
                <div
                  v-else
                  class="text-c-3 flex h-6 items-center justify-center rounded px-2 text-[11px] whitespace-nowrap">
                  Auto
                </div>
              </div>
            </div>

            <div
              v-if="shouldShowEditorStatus"
              class="bg-b-2/40 flex items-center gap-2 border-t px-2 py-1 text-[11px]">
              <ScalarLoading
                v-if="saveLoader.isActive"
                class="self-center"
                :loader="saveLoader"
                size="sm" />
              <span
                v-else
                class="size-1.5 rounded-full"
                :class="editorStatusDotClass" />

              <span
                class="whitespace-nowrap"
                :class="editorStatusTextClass">
                {{ editorStatusText }}
              </span>
            </div>
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
