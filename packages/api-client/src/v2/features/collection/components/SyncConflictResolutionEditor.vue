<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { apply, type merge } from '@scalar/json-magic/diff'
import { useToasts } from '@scalar/use-toasts'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import * as monaco from 'monaco-editor'
import {
  computed,
  markRaw,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from 'vue'

import { useSplitResize } from '@/v2/components/resize'
import { rangeToWholeLine } from '@/v2/features/editor'
import { createJsonModel } from '@/v2/features/editor/helpers/json/create-json-model'
import type { EditorModel } from '@/v2/features/editor/helpers/model'

type ConflictResolutionState = 'manual' | 'local' | 'remote' | 'ignore' | 'idle'
const { conflicts, baseDocument, resolvedDocument } = defineProps<{
  conflicts: ReturnType<typeof merge>['conflicts']
  // The current base document
  baseDocument: Record<string, unknown>
  // The document with the resolved conflicts (changes that could be automatically applied)
  resolvedDocument: Record<string, unknown>
}>()
const emit = defineEmits<{
  applyChanges: [
    payload: {
      resolvedDocument: Record<string, unknown>
    },
  ]
}>()
const { toast } = useToasts()

/**
 * Normalize the conflicts to have the smallest path
 */
const normalizeConflicts = computed(() => {
  return conflicts.map((conflict) => {
    const localChanges = conflict[0]
    const remoteChanges = conflict[1]

    let smallestPath = localChanges[0]!.path

    for (const localChange of localChanges) {
      if (localChange.path.length < smallestPath.length) {
        smallestPath = localChange.path
      }
    }

    for (const remoteChange of remoteChanges) {
      if (remoteChange.path.length < smallestPath.length) {
        smallestPath = remoteChange.path
      }
    }

    // Now we have the smallest path return the normalized conflicts
    return {
      local: {
        path: smallestPath,
        changes: localChanges,
        type: localChanges[0]!.type,
      },
      remote: {
        path: smallestPath,
        changes: remoteChanges,
        type: remoteChanges[0]!.type,
      },
    }
  })
})

type ConflictRange = { index: number; path: string[]; range: monaco.Range }
const resolvedConflicts = ref<ConflictResolutionState[]>([])
const conflictRangesState = shallowRef<ConflictRange[]>([])
const localConflictRangesState = shallowRef<ConflictRange[]>([])
const remoteConflictRangesState = shallowRef<ConflictRange[]>([])
const lastNavigatedConflictIndex = ref<number>(-1)
const splitContainerRef = ref<HTMLDivElement>()
const topEditorsRowRef = ref<HTMLDivElement>()
const topPaneSize = ref(50)
const leftPaneSize = ref(50)

const { onHorizontalResizeStart, onVerticalResizeStart, stopActiveResize } =
  useSplitResize({
    horizontalContainerRef: topEditorsRowRef,
    verticalContainerRef: splitContainerRef,
    leftPaneSize,
    topPaneSize,
    horizontalMin: 20,
    horizontalMax: 80,
    verticalMin: 25,
    verticalMax: 75,
  })

const conflictsLeft = computed(() => {
  return resolvedConflicts.value.filter((status) => status === 'idle').length
})
const topPaneStyle = computed(() => ({ height: `${topPaneSize.value}%` }))
const leftPaneStyle = computed(() => ({ width: `${leftPaneSize.value}%` }))
const rightPaneStyle = computed(() => ({
  width: `${100 - leftPaneSize.value}%`,
}))

const focusEditorRange = (
  diffEditor: monaco.editor.IStandaloneDiffEditor | undefined,
  range: monaco.Range | undefined,
): void => {
  if (!diffEditor || !range) {
    return
  }

  const modifiedEditor = diffEditor.getModifiedEditor()
  const safeRange = new monaco.Range(
    range.startLineNumber,
    range.startColumn,
    range.endLineNumber,
    range.endColumn,
  )

  modifiedEditor.setSelection(safeRange)
  modifiedEditor.revealRangeNearTop(safeRange)
}

const goToNextConflict = (): void => {
  const unresolvedConflictIndexes = normalizeConflicts.value
    .map((_, index) => index)
    .filter((index) => resolvedConflicts.value[index] === 'idle')

  if (!unresolvedConflictIndexes.length) {
    return
  }

  const nextConflictIndex =
    unresolvedConflictIndexes.find(
      (index) => index > lastNavigatedConflictIndex.value,
    ) ?? unresolvedConflictIndexes[0]

  if (nextConflictIndex === undefined) {
    return
  }

  const nextConflict = normalizeConflicts.value[nextConflictIndex]
  if (!nextConflict) {
    return
  }

  const localRange = localConflictRangesState.value.find(
    (conflictRange) => conflictRange.index === nextConflictIndex,
  )?.range
  const remoteRange = remoteConflictRangesState.value.find(
    (conflictRange) => conflictRange.index === nextConflictIndex,
  )?.range
  const resultRange = conflictRangesState.value.find(
    (conflictRange) => conflictRange.index === nextConflictIndex,
  )?.range

  focusEditorRange(localChangesEditor.value, localRange)
  focusEditorRange(remoteChangesEditor.value, remoteRange)
  focusEditorRange(resultEditor.value, resultRange)

  resultEditor.value?.getModifiedEditor().focus()
  lastNavigatedConflictIndex.value = nextConflictIndex
}

const applyResolvedConflicts = (): void => {
  // If there are conflicts left, don't apply
  if (conflictsLeft.value > 0) {
    toast('You have conflicts left', 'error')
    return
  }

  const modifiedResultModel = resultEditor.value?.getModel()?.modified
  if (!modifiedResultModel) {
    return
  }

  let nextResolvedDocument: Record<string, unknown> | null = null
  try {
    nextResolvedDocument = JSON.parse(modifiedResultModel.getValue()) as Record<
      string,
      unknown
    >
  } catch {
    toast('You have formatting errors', 'error')
    return
  }

  emit('applyChanges', {
    resolvedDocument: nextResolvedDocument,
  })
}

watch(
  normalizeConflicts,
  (nextConflicts) => {
    resolvedConflicts.value = nextConflicts.map(
      (_, index) => resolvedConflicts.value[index] ?? 'idle',
    )
  },
  { immediate: true },
)

const localChangesEditorRef = ref<HTMLDivElement>()
const remoteChangesEditorRef = ref<HTMLDivElement>()
const resultEditorRef = ref<HTMLDivElement>()

const localChangesEditor = shallowRef<monaco.editor.IStandaloneDiffEditor>()
const remoteChangesEditor = shallowRef<monaco.editor.IStandaloneDiffEditor>()
const resultEditor = shallowRef<monaco.editor.IStandaloneDiffEditor>()
let resultCodeLensProviderDisposable: monaco.IDisposable | undefined
const codeLensCommandDisposables: monaco.IDisposable[] = []
/**
 * The document with the local changes
 *
 *  We gonna use this documenet in the 3way merge editor to show the local changes.
 */
const documentWithLocalChanges = computed(() => {
  return apply(
    deepClone(resolvedDocument),
    conflicts.flatMap((it) => it[0]),
  )
})

/**
 * The document with the remote changes
 *
 *  We gonna use this documenet in the 3way merge editor to show the remote changes.
 */
const documentWithRemoteChanges = computed(() => {
  return apply(
    deepClone(resolvedDocument),
    conflicts.flatMap((it) => it[1]),
  )
})

onMounted(() => {
  const originalModelLocal = monaco.editor.createModel(
    JSON.stringify(resolvedDocument, null, 2),
    'json',
  )
  const modifiedModelLocal = createJsonModel(
    JSON.stringify(documentWithLocalChanges.value, null, 2),
  )

  const originalModelRemote = monaco.editor.createModel(
    JSON.stringify(resolvedDocument, null, 2),
    'json',
  )
  const modifiedModelRemote = createJsonModel(
    JSON.stringify(documentWithRemoteChanges.value, null, 2),
  )

  const originalResultModel = monaco.editor.createModel(
    JSON.stringify(baseDocument, null, 2),
    'json',
  )

  const modifiedResultModel = createJsonModel(
    JSON.stringify(resolvedDocument, null, 2),
  )

  // diff editro
  const localDiffEditor = monaco.editor.createDiffEditor(
    localChangesEditorRef.value ?? document.createElement('div'),
    {
      originalEditable: false,
      readOnly: true,
      automaticLayout: true,
      renderSideBySide: false,
    },
  )

  localDiffEditor.setModel({
    original: originalModelLocal,
    modified: modifiedModelLocal.model,
  })
  localChangesEditor.value = localDiffEditor

  // Create the remote changes editor
  const remoteDiffEditor = monaco.editor.createDiffEditor(
    remoteChangesEditorRef.value ?? document.createElement('div'),
    {
      originalEditable: false,
      readOnly: true,
      automaticLayout: true,
      renderSideBySide: false,
    },
  )
  remoteDiffEditor.setModel({
    original: originalModelRemote,
    modified: modifiedModelRemote.model,
  })

  remoteChangesEditor.value = remoteDiffEditor

  const resultDiffEditor = monaco.editor.createDiffEditor(
    resultEditorRef.value ?? document.createElement('div'),
    {
      originalEditable: false,
      readOnly: false,
      renderSideBySide: false,
      automaticLayout: true,
    },
  )
  resultDiffEditor.setModel({
    original: originalResultModel,
    modified: modifiedResultModel.model,
  })
  const resultModifiedEditor = resultDiffEditor.getModifiedEditor()
  resultModifiedEditor.updateOptions({ codeLens: true })
  let resultHighlightDecorations: string[] = []
  let suppressedChangeEvents = 0
  const applyCurrentCodeLensCommandId = 'scalar.conflict.applyCurrent'
  const applyRemoteCodeLensCommandId = 'scalar.conflict.applyRemote'
  const ignoreCodeLensCommandId = 'scalar.conflict.ignore'
  const noOpCodeLensCommandId =
    resultModifiedEditor.addCommand(0, () => undefined) ??
    'scalar.conflict.status.noop'

  const getBoxDecorationsForRange = (
    range: monaco.Range,
  ): monaco.editor.IModelDeltaDecoration[] => {
    const startLine = range.startLineNumber
    const endLine = range.endLineNumber

    if (startLine === endLine) {
      return [
        {
          range,
          options: {
            isWholeLine: true,
            className: 'json-focus-highlight-box-single',
          },
        },
      ]
    }

    const topRange = new monaco.Range(startLine, 1, startLine, range.endColumn)
    const middleRange = new monaco.Range(
      startLine + 1,
      1,
      Math.max(startLine + 1, endLine - 1),
      1,
    )
    const bottomRange = new monaco.Range(endLine, 1, endLine, range.endColumn)

    const decorations: monaco.editor.IModelDeltaDecoration[] = [
      {
        range: topRange,
        options: {
          isWholeLine: true,
          className: 'json-focus-highlight-box-top',
        },
      },
      {
        range: bottomRange,
        options: {
          isWholeLine: true,
          className: 'json-focus-highlight-box-bottom',
        },
      },
    ]

    if (endLine - startLine > 1) {
      decorations.push({
        range: middleRange,
        options: {
          isWholeLine: true,
          className: 'json-focus-highlight-box-middle',
        },
      })
    }

    return decorations
  }

  function refreshCodeLensProvider(): void {
    resultCodeLensProviderDisposable?.dispose()
    resultCodeLensProviderDisposable =
      monaco.languages.registerCodeLensProvider('json', {
        provideCodeLenses: (model) => {
          if (
            model.uri.toString() !== modifiedResultModel.model.uri.toString()
          ) {
            return {
              lenses: [],
              dispose: () => undefined,
            }
          }

          return {
            lenses: conflictRangesState.value.flatMap((conflictRange) => {
              const lensRange = new monaco.Range(
                conflictRange.range.startLineNumber,
                1,
                conflictRange.range.startLineNumber,
                1,
              )

              return [
                {
                  range: lensRange,
                  command: {
                    id: noOpCodeLensCommandId,
                    title: `Status: ${resolvedConflicts.value[conflictRange.index] ?? 'idle'}`,
                  },
                },
                {
                  range: lensRange,
                  command: {
                    id: applyCurrentCodeLensCommandId,
                    title: 'Accept Current',
                    arguments: [conflictRange.index],
                  },
                },
                {
                  range: lensRange,
                  command: {
                    id: applyRemoteCodeLensCommandId,
                    title: 'Accept Remote',
                    arguments: [conflictRange.index],
                  },
                },
                {
                  range: lensRange,
                  command: {
                    id: ignoreCodeLensCommandId,
                    title: 'Ignore',
                    arguments: [conflictRange.index],
                  },
                },
              ]
            }),
            dispose: () => undefined,
          }
        },
      })
  }

  const getConflictRange = async (
    editorModel: EditorModel,
    index: number,
    path: string[],
  ): Promise<ConflictRange> => {
    const { model } = editorModel
    const fallbackRange = new monaco.Range(1, 1, 1, model.getLineMaxColumn(1))
    let range: monaco.Range | null = null

    // Deletions can remove the exact path in one side of the diff.
    // Walk up parent paths so we still navigate to the nearest valid location.
    for (let depth = path.length; depth >= 0; depth -= 1) {
      const candidatePath = path.slice(0, depth)
      const nodeRange = await editorModel.getRangeFromPath(candidatePath)
      if (!nodeRange) {
        continue
      }

      range = rangeToWholeLine(model, nodeRange)
      break
    }

    return {
      index,
      path,
      range: markRaw(range ?? fallbackRange),
    }
  }

  const refreshConflictRangesAndDecorations = async (): Promise<void> => {
    const [resultRanges, localRanges, remoteRanges] = await Promise.all([
      Promise.all(
        normalizeConflicts.value.map((conflict, index) =>
          getConflictRange(modifiedResultModel, index, conflict.local.path),
        ),
      ),
      Promise.all(
        normalizeConflicts.value.map((conflict, index) =>
          getConflictRange(modifiedModelLocal, index, conflict.local.path),
        ),
      ),
      Promise.all(
        normalizeConflicts.value.map((conflict, index) =>
          getConflictRange(modifiedModelRemote, index, conflict.local.path),
        ),
      ),
    ])

    conflictRangesState.value = resultRanges.filter(
      (range): range is ConflictRange => Boolean(range),
    )
    localConflictRangesState.value = localRanges.filter(
      (range): range is ConflictRange => Boolean(range),
    )
    remoteConflictRangesState.value = remoteRanges.filter(
      (range): range is ConflictRange => Boolean(range),
    )

    resultHighlightDecorations = resultModifiedEditor.deltaDecorations(
      resultHighlightDecorations,
      conflictRangesState.value.flatMap((conflictRange) =>
        getBoxDecorationsForRange(conflictRange.range),
      ),
    )

    refreshCodeLensProvider()
  }

  const setConflictResolution = (
    index: number,
    resolution: ConflictResolutionState,
  ): void => {
    resolvedConflicts.value[index] = resolution
    refreshCodeLensProvider()
  }

  const applyConflictChoice = async (
    index: number,
    source: 'local' | 'remote',
  ): Promise<void> => {
    const conflict = normalizeConflicts.value[index]
    if (!conflict) {
      return
    }

    let currentDocument: Record<string, unknown> | null = null
    try {
      currentDocument = JSON.parse(
        modifiedResultModel.model.getValue(),
      ) as Record<string, unknown>
    } catch {
      return
    }

    const changes =
      source === 'local' ? conflict.local.changes : conflict.remote.changes
    const nextDocument = apply(deepClone(currentDocument), changes)

    suppressedChangeEvents += 1
    modifiedResultModel.model.setValue(JSON.stringify(nextDocument, null, 2))

    setConflictResolution(index, source)
    await refreshConflictRangesAndDecorations()
  }

  codeLensCommandDisposables.push(
    monaco.editor.registerCommand(
      applyCurrentCodeLensCommandId,
      (_accessor, index: number) => {
        void applyConflictChoice(index, 'local')
      },
    ),
  )
  codeLensCommandDisposables.push(
    monaco.editor.registerCommand(
      applyRemoteCodeLensCommandId,
      (_accessor, index: number) => {
        void applyConflictChoice(index, 'remote')
      },
    ),
  )
  codeLensCommandDisposables.push(
    monaco.editor.registerCommand(
      ignoreCodeLensCommandId,
      (_accessor, index: number) => {
        setConflictResolution(index, 'ignore')
      },
    ),
  )

  void refreshConflictRangesAndDecorations()

  resultModifiedEditor.onDidChangeModelContent((event) => {
    if (suppressedChangeEvents > 0) {
      suppressedChangeEvents -= 1
      return
    }

    let hasStatusUpdates = false

    for (const change of event.changes) {
      const matchingConflicts = conflictRangesState.value.filter(
        (conflictRange) =>
          monaco.Range.areIntersectingOrTouching(
            change.range,
            conflictRange.range,
          ),
      )

      if (!matchingConflicts.length) {
        continue
      }

      matchingConflicts.forEach((conflict) => {
        if (resolvedConflicts.value[conflict.index] !== 'manual') {
          resolvedConflicts.value[conflict.index] = 'manual'
          hasStatusUpdates = true
        }
      })
    }

    if (hasStatusUpdates) {
      refreshCodeLensProvider()
    }
  })

  resultEditor.value = resultDiffEditor
})

onUnmounted(() => {
  stopActiveResize()
  resultCodeLensProviderDisposable?.dispose()
  codeLensCommandDisposables.forEach((disposable) => disposable.dispose())
})
</script>

<template>
  <p class="text-c-2 text-xs">
    Resolve conflicts inline in the full document editor. Use the buttons inside
    the editor for each conflict.
  </p>

  <div
    ref="splitContainerRef"
    class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div
      ref="topEditorsRowRef"
      class="flex min-h-0 gap-1 p-1"
      :style="topPaneStyle">
      <div
        class="sync-editor-pane border-c-3 flex min-h-0 flex-col overflow-hidden rounded-lg border"
        :style="leftPaneStyle">
        <div
          class="sync-pane-title text-c-2 border-c-3 shrink-0 border-b px-2 py-1 text-[11px]">
          Current
        </div>
        <div
          ref="localChangesEditorRef"
          class="min-h-0 flex-1"></div>
      </div>

      <button
        aria-label="Resize current and remote editors"
        class="resize-handle resize-handle-col"
        type="button"
        @pointerdown="onHorizontalResizeStart" />

      <div
        class="sync-editor-pane border-c-3 flex min-h-0 flex-col overflow-hidden rounded-lg border"
        :style="rightPaneStyle">
        <div
          class="sync-pane-title text-c-2 border-c-3 shrink-0 border-b px-2 py-1 text-[11px]">
          Remote
        </div>
        <div
          ref="remoteChangesEditorRef"
          class="min-h-0 flex-1"></div>
      </div>
    </div>

    <button
      aria-label="Resize top and result editors"
      class="resize-handle resize-handle-row"
      type="button"
      @pointerdown="onVerticalResizeStart" />

    <div
      class="sync-editor-pane border-c-3 mx-1 mb-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <div
        class="sync-pane-title text-c-2 border-c-3 flex shrink-0 items-center justify-between border-b px-2 py-1 text-[11px]">
        <span> Result </span>
        <div class="flex items-center gap-2">
          <span class="text-c-2 text-[11px] normal-case">
            {{ conflictsLeft }} conflict{{ conflictsLeft === 1 ? '' : 's' }}
            left
          </span>
          <ScalarButton
            :disabled="conflictsLeft === 0"
            size="xs"
            type="button"
            variant="outlined"
            @click="goToNextConflict">
            Next Conflict
          </ScalarButton>
        </div>
      </div>
      <div
        ref="resultEditorRef"
        class="min-h-0 flex-1"></div>
    </div>

    <div class="flex shrink-0 items-center justify-end gap-2">
      <ScalarButton
        :disabled="conflictsLeft > 0"
        size="xs"
        type="button"
        @click="applyResolvedConflicts">
        Apply changes
      </ScalarButton>
    </div>
  </div>
</template>
<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
}

.sync-layout-root {
  background: color-mix(
    in srgb,
    var(--scalar-color-background-1, #1e1e1e) 96%,
    transparent
  );
}

.sync-editor-pane {
  background: color-mix(
    in srgb,
    var(--scalar-color-background-1, #1e1e1e) 95%,
    transparent
  );
}

.sync-pane-title {
  letter-spacing: 0.03em;
  text-transform: uppercase;
  font-weight: 600;
  background: color-mix(
    in srgb,
    var(--scalar-color-background-2, #2d2d30) 85%,
    transparent
  );
}

.resize-handle {
  position: relative;
  display: block;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  transition:
    background-color 0.12s ease,
    box-shadow 0.12s ease;
}

.resize-handle::before {
  content: '';
  position: absolute;
  border-radius: 999px;
  opacity: 1;
  transition:
    background-color 0.12s ease,
    transform 0.12s ease;
}

.resize-handle:hover {
  background: color-mix(
    in srgb,
    var(--scalar-color-accent, #007acc) 12%,
    transparent
  );
}

.resize-handle:active {
  background: color-mix(
    in srgb,
    var(--scalar-color-accent, #007acc) 18%,
    transparent
  );
}

.resize-handle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--scalar-color-accent, #007acc) 70%, transparent);
}

.resize-handle-col {
  width: 8px;
  min-height: 44px;
  margin: 2px 0;
  cursor: col-resize;
}

.resize-handle-col::before {
  top: 50%;
  left: 50%;
  width: 1px;
  height: calc(100% - 8px);
  transform: translate(-50%, -50%);
  background: color-mix(
    in srgb,
    var(--scalar-color-border, #3c3c3c) 85%,
    transparent
  );
}

.resize-handle-row {
  height: 8px;
  margin: 0 4px;
  cursor: row-resize;
}

.resize-handle-row::before {
  top: 50%;
  left: 50%;
  width: calc(100% - 8px);
  height: 1px;
  transform: translate(-50%, -50%);
  background: color-mix(
    in srgb,
    var(--scalar-color-border, #3c3c3c) 85%,
    transparent
  );
}

.resize-handle-col:hover::before,
.resize-handle-col:active::before,
.resize-handle-row:hover::before,
.resize-handle-row:active::before {
  background: color-mix(
    in srgb,
    var(--scalar-color-accent, #007acc) 78%,
    transparent
  );
}

:deep(.json-path-highlight) {
  background-color: rgba(255, 200, 0, 0.35);
  border-radius: 4px;
}

:deep(.json-focus-highlight-box-single) {
  border: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  box-sizing: border-box;
}

:deep(.json-focus-highlight-box-top) {
  border-top: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  border-left: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  border-right: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  box-sizing: border-box;
}

:deep(.json-focus-highlight-box-middle) {
  border-left: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  border-right: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  box-sizing: border-box;
}

:deep(.json-focus-highlight-box-bottom) {
  border-bottom: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  border-left: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  border-right: 2px solid color-mix(in srgb, #facc15 90%, #eab308 10%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #fde047 35%, transparent);
  box-sizing: border-box;
}
</style>
