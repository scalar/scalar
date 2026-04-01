import { apply, type Difference, type merge } from '@scalar/json-magic/diff'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import * as monaco from 'monaco-editor'
import type { ComputedRef } from 'vue'
import { type MaybeRefOrGetter, computed, markRaw, ref, shallowRef, toValue, watch } from 'vue'

import { rangeToWholeLine } from '@/v2/features/editor'
import { createJsonModel } from '@/v2/features/editor/helpers/json/create-json-model'
import { ensureJsonPointerLinkSupport } from '@/v2/features/editor/helpers/json/json-pointer-links'
import { parseJsonPointerPath } from '@/v2/features/editor/helpers/json/json-pointer-path'
import type { EditorModel, Path } from '@/v2/features/editor/helpers/model'

type JsonRecord = Record<string, unknown>

type ConflictResolutionState = 'manual' | 'local' | 'remote' | 'ignore' | 'idle'

type ConflictRange = { index: number; path: string[]; range: monaco.Range }

type UseThreeWayMergeEditorOptions = {
  /** Base document (common ancestor). */
  baseDocument: MaybeRefOrGetter<Record<string, unknown>>
  /** Document with resolved conflicts (current result). */
  resolvedDocument: MaybeRefOrGetter<Record<string, unknown>>
  /** Merge conflicts from diff. */
  conflicts: MaybeRefOrGetter<ReturnType<typeof merge>['conflicts']>
  /** Called when user applies resolved changes. */
  onApplyChanges: (resolvedDocument: Record<string, unknown>) => void
  /** Optional: called with error message for conflicts left or parse errors. */
  onError?: (message: string) => void
}

type ThreeWayMergeEditorContainers = {
  /** Container for the local (current) diff editor. */
  local: HTMLElement
  /** Container for the remote diff editor. */
  remote: HTMLElement
  /** Container for the result (editable) diff editor. */
  result: HTMLElement
}

/**
 * Shared state and logic for a 3-way merge editor (base | local | remote → result).
 * Create editors by calling init() with the three container elements (e.g. from refs in onMounted).
 * Call dispose() in onUnmounted.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const localRef = ref<HTMLDivElement>()
 * const remoteRef = ref<HTMLDivElement>()
 * const resultRef = ref<HTMLDivElement>()
 *
 * const mergeEditor = useThreeWayMergeEditor({
 *   baseDocument,
 *   resolvedDocument,
 *   conflicts,
 *   onApplyChanges: (doc) => emit('applyChanges', { resolvedDocument: doc }),
 *   onError: (msg) => toast(msg, 'error'),
 * })
 *
 * onMounted(() => {
 *   const local = localRef.value
 *   const remote = remoteRef.value
 *   const result = resultRef.value
 *   if (local && remote && result) {
 *     mergeEditor.init({ local, remote, result })
 *   }
 * })
 *
 * onUnmounted(() => {
 *   mergeEditor.dispose()
 * })
 * </script>
 *
 * <template>
 *   <div ref="localRef" />
 *   <div ref="remoteRef" />
 *   <div ref="resultRef" />
 *   <button @click="mergeEditor.goToNextConflict">Next conflict</button>
 *   <button :disabled="mergeEditor.conflictsLeft > 0" @click="mergeEditor.applyResolvedConflicts">
 *     Apply ({{ mergeEditor.conflictsLeft }} left)
 *   </button>
 * </template>
 * ```
 */
export function useThreeWayMergeEditor(options: UseThreeWayMergeEditorOptions): {
  init: (containers: ThreeWayMergeEditorContainers) => void
  dispose: () => void
  conflictsLeft: ComputedRef<number>
  goToNextConflict: () => void
  applyResolvedConflicts: () => void
} {
  const { baseDocument, resolvedDocument, conflicts, onApplyChanges, onError } = options

  const resolvedConflicts = ref<ConflictResolutionState[]>([])
  const conflictRangesState = shallowRef<ConflictRange[]>([])
  const localConflictRangesState = shallowRef<ConflictRange[]>([])
  const remoteConflictRangesState = shallowRef<ConflictRange[]>([])
  const lastNavigatedConflictIndex = ref<number>(-1)

  const localChangesEditor = shallowRef<monaco.editor.IStandaloneDiffEditor>()
  const remoteChangesEditor = shallowRef<monaco.editor.IStandaloneDiffEditor>()
  const resultEditor = shallowRef<monaco.editor.IStandaloneDiffEditor>()

  let resultCodeLensProviderDisposable: monaco.IDisposable | undefined
  let jsonPointerLinkSupportDispose: (() => void) | undefined
  const codeLensCommandDisposables: monaco.IDisposable[] = []
  /** Models created in init(); disposed in dispose() to avoid leaks when the sync conflict modal closes. */
  let modelsToDispose: monaco.editor.ITextModel[] = []

  const normalizeConflicts = computed(() => {
    const conflictList = toValue(conflicts)
    return conflictList.map((conflict) => {
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

  const documentWithLocalChanges = computed(() =>
    apply(
      deepClone(toValue(resolvedDocument)) as JsonRecord,
      toValue(conflicts).flatMap((it) => it[0]) as Difference<JsonRecord>[],
    ),
  )

  const documentWithRemoteChanges = computed(() =>
    apply(
      deepClone(toValue(resolvedDocument)) as JsonRecord,
      toValue(conflicts).flatMap((it) => it[1]) as Difference<JsonRecord>[],
    ),
  )

  const conflictsLeft = computed(() => resolvedConflicts.value.filter((status) => status === 'idle').length)

  watch(
    normalizeConflicts,
    (nextConflicts) => {
      resolvedConflicts.value = nextConflicts.map((_, index) => resolvedConflicts.value[index] ?? 'idle')
    },
    { immediate: true },
  )

  const focusEditorRange = (
    diffEditor: monaco.editor.IStandaloneDiffEditor | undefined,
    range: monaco.Range | undefined,
  ): void => {
    if (!diffEditor || !range) {
      return
    }
    const modifiedEditor = diffEditor.getModifiedEditor()
    const safeRange = new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)
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
      unresolvedConflictIndexes.find((index) => index > lastNavigatedConflictIndex.value) ??
      unresolvedConflictIndexes[0]
    if (nextConflictIndex === undefined) {
      return
    }
    const nextConflict = normalizeConflicts.value[nextConflictIndex]
    if (!nextConflict) {
      return
    }
    const localRange = localConflictRangesState.value.find((cr) => cr.index === nextConflictIndex)?.range
    const remoteRange = remoteConflictRangesState.value.find((cr) => cr.index === nextConflictIndex)?.range
    const resultRange = conflictRangesState.value.find((cr) => cr.index === nextConflictIndex)?.range
    focusEditorRange(localChangesEditor.value, localRange)
    focusEditorRange(remoteChangesEditor.value, remoteRange)
    focusEditorRange(resultEditor.value, resultRange)
    resultEditor.value?.getModifiedEditor().focus()
    lastNavigatedConflictIndex.value = nextConflictIndex
  }

  const applyResolvedConflicts = (): void => {
    if (conflictsLeft.value > 0) {
      onError?.('You have conflicts left')
      return
    }
    const modifiedResultModel = resultEditor.value?.getModel()?.modified
    if (!modifiedResultModel) {
      return
    }
    let nextResolvedDocument: Record<string, unknown> | null = null
    try {
      nextResolvedDocument = JSON.parse(modifiedResultModel.getValue()) as Record<string, unknown>
    } catch {
      onError?.('You have formatting errors')
      return
    }
    onApplyChanges(nextResolvedDocument)
  }

  const init = (containers: ThreeWayMergeEditorContainers): void => {
    const base = toValue(baseDocument)
    const resolved = toValue(resolvedDocument)
    const localDoc = documentWithLocalChanges.value
    const remoteDoc = documentWithRemoteChanges.value

    const originalModelLocal = monaco.editor.createModel(JSON.stringify(resolved, null, 2), 'json')
    const modifiedModelLocal = createJsonModel(JSON.stringify(localDoc, null, 2))

    const originalModelRemote = monaco.editor.createModel(JSON.stringify(resolved, null, 2), 'json')
    const modifiedModelRemote = createJsonModel(JSON.stringify(remoteDoc, null, 2))

    const originalResultModel = monaco.editor.createModel(JSON.stringify(base, null, 2), 'json')
    const modifiedResultModel = createJsonModel(JSON.stringify(resolved, null, 2))

    modelsToDispose = [
      originalModelLocal,
      modifiedModelLocal.model,
      originalModelRemote,
      modifiedModelRemote.model,
      originalResultModel,
      modifiedResultModel.model,
    ]

    const localDiffEditor = monaco.editor.createDiffEditor(containers.local, {
      originalEditable: false,
      readOnly: true,
      automaticLayout: true,
      renderSideBySide: false,
    })
    localDiffEditor.setModel({
      original: originalModelLocal,
      modified: modifiedModelLocal.model,
    })
    localChangesEditor.value = localDiffEditor

    const remoteDiffEditor = monaco.editor.createDiffEditor(containers.remote, {
      originalEditable: false,
      readOnly: true,
      automaticLayout: true,
      renderSideBySide: false,
    })
    remoteDiffEditor.setModel({
      original: originalModelRemote,
      modified: modifiedModelRemote.model,
    })
    remoteChangesEditor.value = remoteDiffEditor

    const resultDiffEditor = monaco.editor.createDiffEditor(containers.result, {
      originalEditable: false,
      readOnly: false,
      renderSideBySide: false,
      automaticLayout: true,
    })
    resultDiffEditor.setModel({
      original: originalResultModel,
      modified: modifiedResultModel.model,
    })
    const resultModifiedEditor = resultDiffEditor.getModifiedEditor()
    resultModifiedEditor.updateOptions({ codeLens: true })

    const focusResultPath = async (path: Path): Promise<void> => {
      const range = await modifiedResultModel.getRangeFromPath(path)
      if (!range) {
        return
      }
      const safeRange = new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)
      resultModifiedEditor.setSelection(safeRange)
      resultModifiedEditor.revealRangeNearTop(safeRange)
    }

    const navigateJsonPointer = async (pointer: string): Promise<void> => {
      const path = parseJsonPointerPath(pointer)
      if (!path) {
        return
      }
      await focusResultPath(path)
    }

    const linkSupport = ensureJsonPointerLinkSupport(navigateJsonPointer)
    jsonPointerLinkSupportDispose = linkSupport.dispose

    let resultHighlightDecorations: string[] = []
    let suppressedChangeEvents = 0

    const applyCurrentCodeLensCommandId = 'scalar.conflict.applyCurrent'
    const applyRemoteCodeLensCommandId = 'scalar.conflict.applyRemote'
    const ignoreCodeLensCommandId = 'scalar.conflict.ignore'
    const noOpCodeLensCommandId = resultModifiedEditor.addCommand(0, () => undefined) ?? 'scalar.conflict.status.noop'

    const getBoxDecorationsForRange = (range: monaco.Range): monaco.editor.IModelDeltaDecoration[] => {
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
      const middleRange = new monaco.Range(startLine + 1, 1, Math.max(startLine + 1, endLine - 1), 1)
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

    const refreshCodeLensProvider = (): void => {
      resultCodeLensProviderDisposable?.dispose()
      resultCodeLensProviderDisposable = monaco.languages.registerCodeLensProvider('json', {
        provideCodeLenses: (model) => {
          if (model.uri.toString() !== modifiedResultModel.model.uri.toString()) {
            return { lenses: [], dispose: () => undefined }
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
      conflictRangesState.value = resultRanges.filter((r): r is ConflictRange => Boolean(r))
      localConflictRangesState.value = localRanges.filter((r): r is ConflictRange => Boolean(r))
      remoteConflictRangesState.value = remoteRanges.filter((r): r is ConflictRange => Boolean(r))
      resultHighlightDecorations = resultModifiedEditor.deltaDecorations(
        resultHighlightDecorations,
        conflictRangesState.value.flatMap((cr) => getBoxDecorationsForRange(cr.range)),
      )
      refreshCodeLensProvider()
    }

    const setConflictResolution = (index: number, resolution: ConflictResolutionState): void => {
      resolvedConflicts.value[index] = resolution
      refreshCodeLensProvider()
    }

    const applyConflictChoice = async (index: number, source: 'local' | 'remote'): Promise<void> => {
      const conflict = normalizeConflicts.value[index]
      if (!conflict) {
        return
      }
      let currentDocument: Record<string, unknown> | null = null
      try {
        currentDocument = JSON.parse(modifiedResultModel.model.getValue()) as Record<string, unknown>
      } catch {
        return
      }
      const changes = source === 'local' ? conflict.local.changes : conflict.remote.changes
      const nextDocument = apply(deepClone(currentDocument) as JsonRecord, changes as Difference<JsonRecord>[])
      suppressedChangeEvents += 1
      modifiedResultModel.model.setValue(JSON.stringify(nextDocument, null, 2))
      setConflictResolution(index, source)
      await refreshConflictRangesAndDecorations()
    }

    codeLensCommandDisposables.push(
      monaco.editor.registerCommand(applyCurrentCodeLensCommandId, (_accessor, index: number) => {
        void applyConflictChoice(index, 'local')
      }),
    )
    codeLensCommandDisposables.push(
      monaco.editor.registerCommand(applyRemoteCodeLensCommandId, (_accessor, index: number) => {
        void applyConflictChoice(index, 'remote')
      }),
    )
    codeLensCommandDisposables.push(
      monaco.editor.registerCommand(ignoreCodeLensCommandId, (_accessor, index: number) => {
        setConflictResolution(index, 'ignore')
      }),
    )

    void refreshConflictRangesAndDecorations()

    resultModifiedEditor.onDidChangeModelContent((event) => {
      if (suppressedChangeEvents > 0) {
        suppressedChangeEvents -= 1
        return
      }
      let hasStatusUpdates = false
      for (const change of event.changes) {
        const matchingConflicts = conflictRangesState.value.filter((cr) =>
          monaco.Range.areIntersectingOrTouching(change.range, cr.range),
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
  }

  const dispose = (): void => {
    localChangesEditor.value?.dispose()
    localChangesEditor.value = undefined
    remoteChangesEditor.value?.dispose()
    remoteChangesEditor.value = undefined
    resultEditor.value?.dispose()
    resultEditor.value = undefined

    for (const model of modelsToDispose) {
      model.dispose()
    }
    modelsToDispose = []

    resultCodeLensProviderDisposable?.dispose()
    resultCodeLensProviderDisposable = undefined
    jsonPointerLinkSupportDispose?.()
    jsonPointerLinkSupportDispose = undefined
    codeLensCommandDisposables.forEach((d) => d.dispose())
    codeLensCommandDisposables.length = 0
  }

  return {
    init,
    dispose,
    conflictsLeft,
    goToNextConflict,
    applyResolvedConflicts,
  }
}
