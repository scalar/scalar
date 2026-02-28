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
import {
  ScalarIconArrowsIn,
  ScalarIconArrowsOut,
  ScalarIconCaretDown,
  ScalarIconCaretRight,
  ScalarIconWarning,
  ScalarIconXCircle,
} from '@scalar/icons'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { useMonacoMarkers } from '@/v2/features/collection/components/Editor/hooks/use-editor/use-editor-markers'

import { useEditor } from './hooks/use-editor/use-editor'

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
const editor = ref<ReturnType<typeof useEditor>>()

const isAutoSaveEnabled = ref(false)
const isDirty = ref(false)
const editorLanguage = ref<'json' | 'yaml'>('json')
const isDiagnosticsPaneExpanded = ref(false)
const isEditorMaximized = ref(false)

const saveLoader = useLoadingState()

const isYamlMode = computed(() => editorLanguage.value === 'yaml')
const editorRootClass = computed(() =>
  isEditorMaximized.value
    ? 'fixed inset-0 z-50 h-screen w-screen border bg-b-1 p-3'
    : '',
)

const monacoEditorInstance = computed(() => editor.value?.editor)
const { markers: diagnostics } = useMonacoMarkers(monacoEditorInstance)

const syncEditorBottomPadding = () => {
  const bottomPadding = isDiagnosticsPaneExpanded.value ? 155 : 46
  editor.value?.editor.updateOptions({
    padding: {
      top: 0,
      bottom: bottomPadding,
    },
  })
}

const diagnosticCounts = computed(() => {
  let errors = 0
  let warnings = 0

  for (const marker of diagnostics.value) {
    if (marker.severity === monaco.MarkerSeverity.Error) {
      errors += 1
    } else if (marker.severity === monaco.MarkerSeverity.Warning) {
      warnings += 1
    }
  }

  return { errors, warnings }
})

const compareDiagnostics = (
  a: monaco.editor.IMarker,
  b: monaco.editor.IMarker,
) => {
  if (a.severity !== b.severity) {
    return b.severity - a.severity
  }
  if (a.startLineNumber !== b.startLineNumber) {
    return a.startLineNumber - b.startLineNumber
  }
  return a.startColumn - b.startColumn
}

const visibleDiagnostics = computed(() => {
  const topDiagnostics: monaco.editor.IMarker[] = []

  for (const marker of diagnostics.value) {
    const isVisibleSeverity =
      marker.severity === monaco.MarkerSeverity.Error ||
      marker.severity === monaco.MarkerSeverity.Warning
    if (!isVisibleSeverity) {
      continue
    }

    let inserted = false
    for (let i = 0; i < topDiagnostics.length; i++) {
      const current = topDiagnostics[i]
      if (current && compareDiagnostics(marker, current) < 0) {
        topDiagnostics.splice(i, 0, marker)
        inserted = true
        break
      }
    }

    if (!inserted) {
      topDiagnostics.push(marker)
    }

    if (topDiagnostics.length > 6) {
      topDiagnostics.length = 6
    }
  }

  return topDiagnostics
})

const focusDiagnostic = (marker: monaco.editor.IMarker) => {
  editor.value?.setCursorToMarker(marker)
}

const toggleEditorMaximized = () => {
  isEditorMaximized.value = !isEditorMaximized.value
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

const getLanguageToggleClass = (isActive: boolean): string => {
  const base =
    'rounded-none px-2 py-1 text-[11px] leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-accent/30 focus-visible:ring-offset-1 focus-visible:ring-offset-b-1 first:rounded-md last:rounded-md'
  const active = 'bg-b-2 text-c-1 hover:bg-b-2'
  const inactive = 'text-c-2 hover:bg-b-2/60 hover:text-c-1'
  return `${base} ${isActive ? active : inactive}`
}

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
  const document = await workspaceStore.getEditableDocument(documentSlug)
  if (editorLanguage.value === 'yaml') {
    return stringifyYaml(document, { indent: 2 })
  }
  return JSON.stringify(document, null, 2)
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

const safeParseYaml = (value: string) => {
  try {
    return parseYaml(value)
  } catch {
    return null
  }
}

const safeParseYamlObject = (value: string) => {
  const parsed = safeParseYaml(value)
  if (!isObject(parsed)) {
    return null
  }
  return parsed
}

const persistEditorToWorkspace = async (value: string) => {
  const parsed =
    editorLanguage.value === 'yaml'
      ? safeParseYamlObject(value)
      : safeParseJsonObject(value)
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

  const parsed =
    editorLanguage.value === 'yaml'
      ? safeParseYamlObject(value)
      : safeParseJsonObject(value)

  if (
    !parsed ||
    !isObject(parsed.paths) ||
    !isObject(parsed.paths[path]) ||
    !isObject(parsed.paths[path][method])
  ) {
    return
  }

  const operation = parsed.paths[path][method]
  // Add default servers if not present
  operation.servers ??= []

  // Update the editor value
  editor.value?.setValue(
    editorLanguage.value === 'yaml'
      ? stringifyYaml(parsed, { indent: 2 })
      : JSON.stringify(parsed, null, 2),
  )
  await editor.value?.focusPath(['paths', path, method, 'servers'])
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

  const value = editor.value?.getValue?.()
  if (!value) {
    return
  }

  const parsed =
    previousLanguage === 'yaml'
      ? safeParseYamlObject(value)
      : safeParseJsonObject(value)
  if (parsed) {
    editor.value?.setValue(
      nextLanguage === 'yaml'
        ? stringifyYaml(parsed, { indent: 2 })
        : JSON.stringify(parsed, null, 2),
    )
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

        <div class="pointer-events-none absolute right-2 bottom-2 left-2 z-10">
          <div
            class="bg-b-1 shadow-border pointer-events-auto flex flex-col overflow-hidden rounded-lg text-[11px]">
            <button
              class="bg-b-2/30 hover:bg-b-2/50 flex items-center justify-between px-2.5 py-2 text-left"
              type="button"
              @click="isDiagnosticsPaneExpanded = !isDiagnosticsPaneExpanded">
              <span class="flex items-center gap-3">
                <span class="text-c-2 font-medium">Problems</span>
                <span
                  class="text-c-danger flex items-center gap-1"
                  title="Errors">
                  <ScalarIconXCircle class="size-3" />
                  <span>{{ diagnosticCounts.errors }}</span>
                </span>
                <span
                  class="text-c-alert flex items-center gap-1"
                  title="Warnings">
                  <ScalarIconWarning class="size-3" />
                  <span>{{ diagnosticCounts.warnings }}</span>
                </span>
              </span>

              <span class="text-c-3">
                <ScalarIconCaretDown
                  v-if="isDiagnosticsPaneExpanded"
                  class="size-3" />
                <ScalarIconCaretRight
                  v-else
                  class="size-3" />
              </span>
            </button>

            <template v-if="isDiagnosticsPaneExpanded">
              <div
                v-if="visibleDiagnostics.length"
                class="max-h-28 overflow-auto border-t">
                <button
                  v-for="(marker, index) in visibleDiagnostics"
                  :key="`${marker.owner}-${marker.startLineNumber}-${marker.startColumn}-${index}`"
                  class="hover:bg-b-2/40 flex w-full items-start gap-2 px-2.5 py-2 text-left"
                  type="button"
                  @click="focusDiagnostic(marker)">
                  <span
                    class="mt-0.5 size-1.5 shrink-0 rounded-full"
                    :class="
                      marker.severity === monaco.MarkerSeverity.Error
                        ? 'bg-c-danger'
                        : 'bg-c-alert'
                    " />

                  <span class="min-w-0 flex-1">
                    <span class="text-c-1 block truncate">{{
                      marker.message
                    }}</span>
                    <span class="text-c-3 block whitespace-nowrap">
                      Ln {{ marker.startLineNumber }}, Col
                      {{ marker.startColumn }}
                    </span>
                  </span>
                </button>
              </div>
              <div
                v-else
                class="text-c-3 border-t px-2.5 py-2">
                Errors and warnings from the JSON/YAML language workers will
                show up here.
              </div>
            </template>
          </div>
        </div>

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
