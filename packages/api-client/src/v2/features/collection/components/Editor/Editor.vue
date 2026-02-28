<script setup lang="ts">
import { ScalarButton, ScalarHotkey, useLoadingState } from '@scalar/components'
import { debounce } from '@scalar/helpers/general/debounce'
import { isObject } from '@scalar/helpers/object/is-object'
import { ScalarIconArrowsIn, ScalarIconArrowsOut } from '@scalar/icons'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { useEditorMarkers } from '@/v2/features/collection/components/Editor/hooks/use-editor/use-editor-markers'

import EditorDiagnosticsPanel from './components/EditorDiagnosticsPanel.vue'
import EditorSavePanel from './components/EditorSavePanel.vue'
import { getDiagnosticCounts } from './hooks/use-editor/helpers/get-diagnostic-counts'
import { getOperationContext } from './hooks/use-editor/helpers/get-operation-context'
import { getVisibleDiagnostics } from './hooks/use-editor/helpers/get-visible-diagnostics'
import { parseEditorObject } from './hooks/use-editor/helpers/parse-editor-object'
import { stringifyDocument } from './hooks/use-editor/helpers/stringify-document'
import { useEditor } from './hooks/use-editor/use-editor'
import { useEditorState } from './hooks/use-editor/use-editor-state'

const {
  collectionType,
  documentSlug,
  method,
  path,
  workspaceStore,
  currentTheme,
  isDarkMode,
} = defineProps<CollectionProps>()

const MAX_VISIBLE_DIAGNOSTICS = 6

const monacoEditorRef = ref<HTMLElement>()
const editor = ref<ReturnType<typeof useEditor>>()

const saveLoader = useLoadingState()
const {
  isAutoSaveEnabled,
  isDirty,
  editorLanguage,
  isDiagnosticsPaneExpanded,
  isEditorMaximized,
  isYamlMode,
  editorBottomPadding,
  editorRootClass,
  getLanguageToggleClass,
  toggleEditorMaximized,
} = useEditorState()

const monacoEditorInstance = computed(() => editor.value?.editor)
const { markers: diagnostics } = useEditorMarkers(monacoEditorInstance)

const syncEditorBottomPadding = () => {
  editor.value?.editor.updateOptions({
    padding: {
      top: 0,
      bottom: editorBottomPadding.value,
    },
  })
}

const diagnosticCounts = computed(() => getDiagnosticCounts(diagnostics.value))
const visibleDiagnostics = computed(() =>
  getVisibleDiagnostics(diagnostics.value, MAX_VISIBLE_DIAGNOSTICS),
)

const focusDiagnostic = (marker: monaco.editor.IMarker) => {
  editor.value?.setCursorToMarker(marker)
}

const getEditorValue = (): string | null => editor.value?.getValue?.() ?? null

const getDocumentValue = async (): Promise<string> => {
  const document = await workspaceStore.getEditableDocument(documentSlug)
  return stringifyDocument(document, editorLanguage.value)
}

const loadDocumentIntoEditor = async () => {
  editor.value?.setValue(await getDocumentValue())
  isDirty.value = false
  await focusOperation()
}

const formatDocument = async () => {
  await editor.value?.formatDocument()
}

const focusOperation = async () => {
  const operationContext = getOperationContext(path, method)
  if (!operationContext) {
    return
  }

  await editor.value?.focusPath([
    'paths',
    operationContext.path,
    operationContext.method,
  ])
}

const persistEditorToWorkspace = async (value: string) => {
  const parsed = parseEditorObject(value, editorLanguage.value)
  if (!parsed) {
    const firstError = diagnostics.value.find(
      (m) => m.severity === monaco.MarkerSeverity.Error,
    )
    if (firstError) {
      focusDiagnostic(firstError)
    }
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
  const value = getEditorValue()
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
  const operationContext = getOperationContext(path, method)
  if (!operationContext) {
    return
  }

  const value = getEditorValue()
  if (!value) {
    return
  }

  const parsed = parseEditorObject(value, editorLanguage.value)

  if (!parsed || !isObject(parsed.paths)) {
    return
  }

  const pathsObject = parsed.paths as Record<string, unknown>
  const operationPathItem = pathsObject[operationContext.path]
  if (!isObject(operationPathItem)) {
    return
  }

  const operation = operationPathItem[operationContext.method]
  if (!isObject(operation)) {
    return
  }

  // Add default servers if not present
  operation.servers ??= []

  // Update the editor value
  editor.value?.setValue(stringifyDocument(parsed, editorLanguage.value))
  await editor.value?.focusPath([
    'paths',
    operationContext.path,
    operationContext.method,
    'servers',
  ])
}

onMounted(() => {
  editor.value = useEditor({
    element: monacoEditorRef.value ?? document.createElement('div'),
    onChange: handleEditorChange,
    isDarkMode,
    theme: currentTheme,
    language: editorLanguage.value,
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
        id: 'scalar.editor.formatDocument',
        label: 'Format Document',
        keybindings: [
          monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        ],
        run: async () => {
          await formatDocument()
        },
      },
    ],
  })

  syncEditorBottomPadding()
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

watch(isDiagnosticsPaneExpanded, () => {
  syncEditorBottomPadding()
})

watch(editorLanguage, async (nextLanguage, previousLanguage) => {
  editor.value?.setLanguage(nextLanguage)

  const value = getEditorValue()
  if (!value) {
    return
  }

  const parsed = parseEditorObject(value, previousLanguage)
  if (parsed) {
    editor.value?.setValue(stringifyDocument(parsed, nextLanguage))
    isDirty.value = true
  }

  await focusOperation()
})

watch(
  isAutoSaveEnabled,
  (isEnabled) => {
    if (!isEnabled) {
      debouncedPersist.cleanup()
      return
    }

    if (isDirty.value) {
      const value = getEditorValue()
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
    v-if="
      collectionType === 'operation' &&
      getOperationContext(path, method) !== null
    "
    class="flex w-full min-w-0 flex-1 flex-col gap-2"
    :class="editorRootClass">
    <div
      class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
      <div
        class="flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap">
        <span class="text-c-2 text-xs font-medium whitespace-nowrap">
          Shortcuts
        </span>

        <ScalarButton
          class="whitespace-nowrap"
          size="xs"
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
          class="whitespace-nowrap"
          size="xs"
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

      <div
        aria-label="Editor language"
        class="bg-b-1 shadow-border flex items-center justify-self-center overflow-hidden rounded-lg p-0.5"
        role="tablist">
        <ScalarButton
          :aria-selected="!isYamlMode"
          :class="getLanguageToggleClass(!isYamlMode)"
          role="tab"
          size="xs"
          type="button"
          variant="ghost"
          @click="editorLanguage = 'json'">
          JSON
        </ScalarButton>
        <ScalarButton
          :aria-selected="isYamlMode"
          :class="getLanguageToggleClass(isYamlMode)"
          role="tab"
          size="xs"
          type="button"
          variant="ghost"
          @click="editorLanguage = 'yaml'">
          YAML
        </ScalarButton>
      </div>

      <div class="flex min-w-0 shrink-0 items-center gap-2 justify-self-end">
        <ScalarButton
          size="xs"
          variant="ghost"
          @click="formatDocument">
          <span>Format {{ isYamlMode ? 'YAML' : 'JSON' }}</span>
          <span class="text-c-3 ml-2 text-[11px]">
            <ScalarHotkey
              hotkey="F"
              :modifier="['Alt', 'Shift']" />
          </span>
        </ScalarButton>
        <ScalarButton
          :aria-label="
            isEditorMaximized ? 'Restore editor size' : 'Maximize editor'
          "
          size="xs"
          variant="ghost"
          @click="toggleEditorMaximized">
          <span>{{ isEditorMaximized ? 'Restore' : 'Maximize' }}</span>
          <span class="text-c-3 ml-2 text-[11px]">
            <ScalarIconArrowsIn
              v-if="isEditorMaximized"
              class="size-3.5" />
            <ScalarIconArrowsOut
              v-else
              class="size-3.5" />
          </span>
        </ScalarButton>
      </div>
    </div>

    <div class="flex min-h-0 w-full min-w-0 flex-1 rounded-lg border">
      <div
        class="relative w-full min-w-0 flex-1"
        :class="isEditorMaximized ? 'h-full min-h-0' : 'h-[500px]'">
        <div class="pointer-events-none absolute top-2 right-2 z-10">
          <EditorSavePanel
            :isAutoSaveEnabled="isAutoSaveEnabled"
            :isDirty="isDirty"
            :saveLoader="saveLoader"
            @saveNow="saveNow"
            @update:isAutoSaveEnabled="isAutoSaveEnabled = $event" />
        </div>

        <EditorDiagnosticsPanel
          :diagnosticCounts="diagnosticCounts"
          :expanded="isDiagnosticsPaneExpanded"
          :visibleDiagnostics="visibleDiagnostics"
          @focusDiagnostic="focusDiagnostic"
          @toggle="isDiagnosticsPaneExpanded = !isDiagnosticsPaneExpanded" />

        <div
          ref="monacoEditorRef"
          class="h-full w-full min-w-0 flex-1" />
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
