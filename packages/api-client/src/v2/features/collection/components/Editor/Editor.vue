<script setup lang="ts">
import { ScalarButton, ScalarHotkey, useLoadingState } from '@scalar/components'
import { debounce } from '@scalar/helpers/general/debounce'
import { isObject } from '@scalar/helpers/object/is-object'
import { ScalarIconArrowsIn, ScalarIconArrowsOut } from '@scalar/icons'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { useEditor, useJsonPointerLinkSupport } from '@/v2/features/editor'
import { createJsonModel } from '@/v2/features/editor/helpers/json/create-json-model'
import { createYamlModel } from '@/v2/features/editor/helpers/yaml/create-yaml-model'
import { useEditorMarkers } from '@/v2/features/editor/hooks/use-editor-markers'

import EditorDiagnosticsPanel from './components/EditorDiagnosticsPanel.vue'
import EditorSavePanel from './components/EditorSavePanel.vue'
import { getDiagnosticCounts } from './helpers/get-diagnostic-counts'
import { getOperationContext } from './helpers/get-operation-context'
import { getVisibleDiagnostics } from './helpers/get-visible-diagnostics'
import { parseEditorObject } from './helpers/parse-editor-object'
import { stringifyDocument } from './helpers/stringify-document'
import { useEditorState } from './hooks/use-editor-state'

const { collectionType, documentSlug, method, path, workspaceStore } =
  defineProps<CollectionProps>()

const MAX_VISIBLE_DIAGNOSTICS = 6
const EDITOR_PERSIST_DEBOUNCE_KEY = 'editor:replace-document'

const monacoEditorRef = ref<HTMLElement>()
const editorApi = shallowRef<ReturnType<typeof useEditor>>()

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

const jsonModel = createJsonModel()
const yamlModel = createYamlModel()

const selectedLanguage = ref<'json' | 'yaml'>('json')

const currentModel = computed(() => {
  return selectedLanguage.value === 'json' ? jsonModel : yamlModel
})

const monacoEditorInstance = computed(() => editorApi.value?.editor)
const { markers: diagnostics } = useEditorMarkers(monacoEditorInstance)

const syncEditorBottomPadding = () => {
  editorApi.value?.editor.updateOptions({
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
  const editor = editorApi.value?.editor
  if (!editor) {
    return
  }
  editor.setSelection({
    startLineNumber: marker.startLineNumber,
    startColumn: marker.startColumn,
    endLineNumber: marker.endLineNumber,
    endColumn: marker.endColumn,
  })
  editor.revealPositionInCenter({
    lineNumber: marker.startLineNumber,
    column: marker.startColumn,
  })
}

const getEditorValue = (): string | null => currentModel.value.model.getValue()

/** Value from the editor for a specific language (use when switching to avoid reading the wrong model). */
const getEditorValueForLanguage = (language: 'json' | 'yaml'): string | null =>
  (language === 'json' ? jsonModel : yamlModel).model.getValue()

const getDocumentValue = async (
  language?: 'json' | 'yaml',
): Promise<string> => {
  const document = await workspaceStore.getEditableDocument(documentSlug)
  return stringifyDocument(document, language ?? selectedLanguage.value)
}

const debouncedPersist = debounce({ delay: 1500 })

const applyProgrammaticEditorValue = (value: string): void => {
  // Cancel pending auto-save work so synthetic model updates do not persist stale data.
  debouncedPersist.cleanup()
  editorApi.value?.setValue(value, true)
}

const loadDocumentIntoEditor = async () => {
  applyProgrammaticEditorValue(await getDocumentValue())
  isDirty.value = false
  await focusOperation()
}

const formatDocument = async () => {
  await editorApi.value?.formatDocument()
}

const focusOperation = async () => {
  const operationContext = getOperationContext(path, method)
  if (!operationContext) {
    return
  }

  await editorApi.value?.focusPath([
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

  debouncedPersist.execute(EDITOR_PERSIST_DEBOUNCE_KEY, () =>
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
  editorApi.value?.setValue(stringifyDocument(parsed, editorLanguage.value))
  await editorApi.value?.focusPath([
    'paths',
    operationContext.path,
    operationContext.method,
    'servers',
  ])
}

useJsonPointerLinkSupport(editorApi, currentModel)

onMounted(() => {
  editorApi.value = useEditor({
    element: monacoEditorRef.value ?? document.createElement('div'),
    onChange: handleEditorChange,
    model: currentModel,
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
  debouncedPersist.cleanup()

  // Persist if there is a pending save
  if (isDirty.value && isAutoSaveEnabled.value) {
    void saveNow()
  }
  editorApi.value?.dispose?.()
  // Dispose models created at setup; useEditor only disposes the editor widget, not external models.
  jsonModel.model.dispose()
  yamlModel.model.dispose()
})

watch(() => documentSlug, loadDocumentIntoEditor)

watch(
  () => [path, method] as const,
  async () => {
    await focusOperation()
  },
)

watch(isDiagnosticsPaneExpanded, () => {
  syncEditorBottomPadding()
})

watch(editorLanguage, async (nextLanguage, previousLanguage) => {
  const wasDirty = isDirty.value
  // Read from the previous model before switching; getEditorValue() would use currentModel
  // which changes with selectedLanguage, so we would read the (empty) new model otherwise.
  const value = getEditorValueForLanguage(previousLanguage ?? 'json')
  if (!value) {
    selectedLanguage.value = nextLanguage
    await nextTick()
    await focusOperation()
    return
  }

  const parsed = parseEditorObject(value, previousLanguage ?? 'json')
  selectedLanguage.value = nextLanguage
  await nextTick()
  if (parsed) {
    applyProgrammaticEditorValue(stringifyDocument(parsed, nextLanguage))
    isDirty.value = wasDirty
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
      debouncedPersist.execute(EDITOR_PERSIST_DEBOUNCE_KEY, () =>
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
        :class="isEditorMaximized ? 'h-full min-h-0' : 'h-125'">
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
          class="h-full w-full min-w-0 flex-1 [&_.monaco-editor]:rounded-lg [&_.overflow-guard]:rounded-lg" />
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
