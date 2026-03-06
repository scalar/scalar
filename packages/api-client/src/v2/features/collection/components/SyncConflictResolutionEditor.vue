<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import type { Difference } from '@scalar/json-magic/diff'
import * as monaco from 'monaco-editor'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'

import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css'

import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'

import { configureLanguageSupport } from '@/v2/features/collection/components/Editor/helpers/configure-language-support'
import { ensureMonacoEnvironment } from '@/v2/features/collection/components/Editor/helpers/ensure-monaco-environment'
import { getJsonAstNodeFromPath } from '@/v2/features/collection/components/Editor/helpers/get-json-ast-node-from-path'
import type { JsonPath } from '@/v2/features/collection/components/Editor/helpers/json-ast'

type ConflictSelection = 'remote' | 'local' | 'both' | 'manual'
type ConflictDescriptor = {
  id: number
  path: string[]
  currentSnippet: string
  upstreamSnippet: string
}
type ParsedConflict = {
  id: number
  start: number
  startColumn: number
  mid: number
  end: number
  endColumn: number
}
type ParsedSideConflict = {
  id: number
  start: number
  end: number
}

const {
  conflicts,
  document: currentDocument,
  baseDocument,
  isApplying = false,
} = defineProps<{
  conflicts: Array<[Difference<unknown>[], Difference<unknown>[]]>
  document: Record<string, unknown>
  baseDocument: Record<string, unknown>
  isApplying?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', resolvedConflicts: Difference<unknown>[]): void
}>()

const incomingEditorElementRef = ref<HTMLElement>()
const currentEditorElementRef = ref<HTMLElement>()
const resultEditorElementRef = ref<HTMLElement>()
const editorSplitContainerRef = ref<HTMLElement>()
const sideBySideContainerRef = ref<HTMLElement>()

// Monaco editor instances must stay non-reactive. Vue proxies can recurse in
// Monaco's internal piece tree traversal and cause maximum call stack errors.
const incomingEditor = shallowRef<monaco.editor.IStandaloneCodeEditor>()
const currentEditorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor>()
const resultEditor = shallowRef<monaco.editor.IStandaloneCodeEditor>()
const lookupIncomingModel = shallowRef<monaco.editor.ITextModel>()
const lookupCurrentModel = shallowRef<monaco.editor.ITextModel>()
const activeConflictId = ref<number | null>(null)

const selections = ref<Partial<Record<number, ConflictSelection>>>({})
const codeLensProvider = shallowRef<monaco.IDisposable | null>(null)
const decorationIds = {
  incoming: shallowRef<string[]>([]),
  current: shallowRef<string[]>([]),
  result: shallowRef<string[]>([]),
}
let isApplyingConflictEdit = false
const topPaneHeightPercent = ref(38)
const sidePaneWidthPercent = ref(50)
type DragDirection = 'vertical' | 'horizontal'
type DragState = {
  direction: DragDirection
  startX: number
  startY: number
  initialPercent: number
}
const dragState = ref<DragState | null>(null)

const cloneObject = <T extends Record<string, unknown>>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T
}

const commonPathPrefix = (paths: string[][]): string[] => {
  if (paths.length === 0) {
    return []
  }

  const first = paths[0] ?? []
  let length = first.length
  for (const path of paths.slice(1)) {
    length = Math.min(length, path.length)
    for (let i = 0; i < length; i++) {
      if (path[i] !== first[i]) {
        length = i
        break
      }
    }
  }

  return first.slice(0, length)
}

const getValueAtPath = (input: unknown, path: string[]): unknown => {
  return path.reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return (acc as Record<string, unknown>)[segment]
    }
    return undefined
  }, input)
}

const setValueAtPath = (
  input: Record<string, unknown>,
  path: string[],
  value: unknown,
): void => {
  if (path.length === 0) {
    return
  }

  let current: Record<string, unknown> = input
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]
    if (!segment) {
      return
    }

    const next = current[segment]
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      current[segment] = {}
    }
    current = current[segment] as Record<string, unknown>
  }

  const leaf = path[path.length - 1]
  if (!leaf) {
    return
  }

  current[leaf] = value
}

const conflictDescriptors = computed<ConflictDescriptor[]>(() => {
  return conflicts.map(([upstreamDiffs, currentDiffs], index) => {
    const allPaths = [...upstreamDiffs, ...currentDiffs].map(
      (diff) => diff.path,
    )
    const path = commonPathPrefix(allPaths)

    const currentValue =
      path.length > 0
        ? getValueAtPath(currentDocument, path)
        : currentDiffs.map((diff) => diff.changes)
    const upstreamValue =
      path.length > 0
        ? getValueAtPath(baseDocument, path)
        : upstreamDiffs.map((diff) => diff.changes)

    return {
      id: index + 1,
      path,
      currentSnippet: JSON.stringify(currentValue, null, 2) ?? 'null',
      upstreamSnippet: JSON.stringify(upstreamValue, null, 2) ?? 'null',
    }
  })
})

const mergeEditorValue = computed(() => {
  const clonedDocument = cloneObject(currentDocument)

  for (const descriptor of conflictDescriptors.value) {
    const token = `__SCALAR_CONFLICT_${descriptor.id}__`
    setValueAtPath(clonedDocument, descriptor.path, token)
  }

  let value = JSON.stringify(clonedDocument, null, 2)

  for (const descriptor of conflictDescriptors.value) {
    const token = `"__SCALAR_CONFLICT_${descriptor.id}__"`
    const marker = [
      `<<<<<<< CURRENT CONFLICT ${descriptor.id}`,
      descriptor.currentSnippet,
      '=======',
      descriptor.upstreamSnippet,
      `>>>>>>> UPSTREAM CONFLICT ${descriptor.id}`,
    ].join('\n')
    if (value.includes(token)) {
      value = value.replace(token, marker)
    } else {
      // Fallback when the conflict path is not representable in the JSON tree.
      value += `\n\n${marker}`
    }
  }

  return value
})

const buildSideConflictValue = (
  source: Record<string, unknown>,
  side: 'current' | 'upstream',
): string => {
  const clonedDocument = unpackProxyObject(cloneObject(source), { depth: 1 })

  for (const descriptor of conflictDescriptors.value) {
    const token = `__SCALAR_SIDE_CONFLICT_${descriptor.id}__`
    setValueAtPath(clonedDocument, descriptor.path, token)
  }

  let value = JSON.stringify(clonedDocument, null, 2)

  for (const descriptor of conflictDescriptors.value) {
    const token = `"__SCALAR_SIDE_CONFLICT_${descriptor.id}__"`
    const snippet =
      side === 'current'
        ? descriptor.currentSnippet
        : descriptor.upstreamSnippet
    const marker = [
      `<<<<<<< ${side.toUpperCase()} CONFLICT ${descriptor.id}`,
      snippet,
      `>>>>>>> ${side.toUpperCase()} CONFLICT ${descriptor.id}`,
    ].join('\n')
    if (value.includes(token)) {
      value = value.replace(token, marker)
    } else {
      // Fallback when the path does not map cleanly to this side document.
      value += `\n\n${marker}`
    }
  }

  return value
}

const incomingEditorValue = computed(() =>
  buildSideConflictValue(baseDocument, 'upstream'),
)
const currentEditorValue = computed(() =>
  buildSideConflictValue(currentDocument, 'current'),
)

const conflictPaths = computed<JsonPath[]>(() =>
  conflicts.map(([remoteDiffs, localDiffs]) => {
    const allDiffs = [...remoteDiffs, ...localDiffs]
    const smallestPath = allDiffs.reduce<string[]>(
      (smallest, diff) =>
        smallest.length === 0 || diff.path.length < smallest.length
          ? [...diff.path]
          : smallest,
      [],
    )
    return smallestPath
  }),
)

const parseConflictId = (line: string): number | null => {
  const markerStart = line.indexOf('<<<<<<<')
  if (markerStart === -1) {
    return null
  }

  const markerLine = line.slice(markerStart)
  const match = markerLine.match(/^<<<<<<<\s+\w+\s+CONFLICT\s+(\d+)/)
  if (!match?.[1]) {
    return null
  }

  const parsed = Number.parseInt(match[1], 10)
  return Number.isNaN(parsed) ? null : parsed
}

const findConflicts = (lines: string[]): ParsedConflict[] => {
  const parsed: ParsedConflict[] = []

  let start: number | null = null
  let startColumn: number | null = null
  let mid: number | null = null
  let id: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const markerStart = line.indexOf('<<<<<<<')

    if (markerStart !== -1) {
      start = i + 1
      startColumn = markerStart + 1
      mid = null
      id = parseConflictId(line)
      continue
    }

    if (line.includes('=======') && start !== null) {
      mid = i + 1
      continue
    }

    const endMarker = line.match(/>>>>>>>\s+\w+\s+CONFLICT\s+\d+/)
    if (endMarker && start !== null && startColumn !== null && mid !== null) {
      const endMarkerStart = line.indexOf(endMarker[0])
      parsed.push({
        id: id ?? parsed.length + 1,
        start,
        startColumn,
        mid,
        end: i + 1,
        endColumn: endMarkerStart + endMarker[0].length + 1,
      })
      start = null
      startColumn = null
      mid = null
      id = null
    }
  }

  return parsed
}

const findSideConflicts = (lines: string[]): ParsedSideConflict[] => {
  const parsed: ParsedSideConflict[] = []

  let start: number | null = null
  let id: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const markerStart = line.indexOf('<<<<<<<')

    if (markerStart !== -1) {
      start = i + 1
      id = parseConflictId(line)
      continue
    }

    if (line.includes('>>>>>>>') && start !== null) {
      parsed.push({
        id: id ?? parsed.length + 1,
        start,
        end: i + 1,
      })
      start = null
      id = null
    }
  }

  return parsed
}

const getResultConflictById = (id: number): ParsedConflict | null => {
  const lines = resultEditor.value?.getModel()?.getLinesContent() ?? []
  return findConflicts(lines).find((conflict) => conflict.id === id) ?? null
}

const getSideConflictById = (
  editor: monaco.editor.IStandaloneCodeEditor | undefined,
  id: number,
): ParsedSideConflict | null => {
  const lines = editor?.getModel()?.getLinesContent() ?? []
  return findSideConflicts(lines).find((conflict) => conflict.id === id) ?? null
}

const unresolvedConflictIds = computed(() => {
  const lines = resultEditor.value?.getModel()?.getLinesContent() ?? []
  return findConflicts(lines).map((conflict) => conflict.id)
})

const canApply = computed(
  () =>
    conflicts.length > 0 &&
    unresolvedConflictIds.value.length === 0 &&
    Object.keys(selections.value).length === conflicts.length &&
    !Object.values(selections.value).includes('manual'),
)

const applySelections = (): void => {
  const resolvedConflicts = conflicts.flatMap((conflict, index) => {
    const side = selections.value[index + 1]
    if (side === 'local') {
      return conflict[1]
    }
    if (side === 'both') {
      return [...conflict[1], ...conflict[0]]
    }
    return conflict[0]
  })

  emit('apply', resolvedConflicts)
}

const setSelection = (id: number, side: ConflictSelection): void => {
  selections.value = {
    ...selections.value,
    [id]: side,
  }
}

const resolveConflict = (
  type: 'current' | 'incoming' | 'both',
  conflict: ParsedConflict,
): void => {
  const editor = resultEditor.value
  const model = editor?.getModel()
  if (!editor || !model) {
    return
  }

  const lines = model.getLinesContent()
  const currentLines = lines.slice(conflict.start, conflict.mid - 1)
  const incomingLines = lines.slice(conflict.mid, conflict.end - 1)

  const replacement =
    type === 'current'
      ? currentLines
      : type === 'incoming'
        ? incomingLines
        : [...currentLines, ...incomingLines]

  isApplyingConflictEdit = true
  editor.executeEdits('resolve-conflict', [
    {
      // Replace only the marker span so inline JSON context stays intact.
      range: new monaco.Range(
        conflict.start,
        conflict.startColumn,
        conflict.end,
        conflict.endColumn,
      ),
      text: replacement.join('\n'),
    },
  ])
  isApplyingConflictEdit = false

  if (type === 'current') {
    setSelection(conflict.id, 'local')
  } else if (type === 'incoming') {
    setSelection(conflict.id, 'remote')
  } else {
    setSelection(conflict.id, 'both')
  }

  highlightConflictBlocks()

  // Match VS Code merge flow: jump to the next unresolved conflict immediately.
  const remainingConflicts = unresolvedConflictIds.value
  const nextId = remainingConflicts.find((id) => id !== conflict.id)
  if (nextId) {
    revealConflict(nextId)
  } else {
    activeConflictId.value = null
  }
}

const revealConflict = (conflictId: number): void => {
  activeConflictId.value = conflictId

  const result = getResultConflictById(conflictId)
  if (result && resultEditor.value) {
    resultEditor.value.revealLineInCenter(result.start)
    resultEditor.value.setPosition({
      lineNumber: result.start,
      column: 1,
    })
  }

  const incoming = getSideConflictById(incomingEditor.value, conflictId)
  if (incoming && incomingEditor.value) {
    incomingEditor.value.revealLineInCenter(incoming.start)
  }

  const current = getSideConflictById(currentEditorInstance.value, conflictId)
  if (current && currentEditorInstance.value) {
    currentEditorInstance.value.revealLineInCenter(current.start)
  }
}

const showNextConflict = (): void => {
  const ids = unresolvedConflictIds.value
  if (ids.length === 0) {
    return
  }

  const activeIndex = activeConflictId.value
    ? ids.findIndex((id) => id === activeConflictId.value)
    : -1
  const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % ids.length : 0
  const nextId = ids[nextIndex]
  if (!nextId) {
    return
  }
  revealConflict(nextId)
}

const addConflictMarkers = (
  model: monaco.editor.ITextModel | null,
  ranges: { id: number; start: number; end: number }[],
): void => {
  if (!model) {
    return
  }

  monaco.editor.setModelMarkers(
    model,
    'scalar-conflicts',
    ranges.map((range) => ({
      severity: monaco.MarkerSeverity.Warning,
      message: `Conflict ${range.id}`,
      startLineNumber: range.start,
      startColumn: 1,
      endLineNumber: range.end,
      endColumn: model.getLineMaxColumn(range.end),
    })),
  )
}

const applyConflictDecorations = (
  editor: monaco.editor.IStandaloneCodeEditor | undefined,
  previousDecorationIds: string[],
  ranges: { id: number; start: number; end: number }[],
): string[] => {
  if (!editor) {
    return []
  }

  return editor.deltaDecorations(
    previousDecorationIds,
    ranges.map((range) => ({
      range: new monaco.Range(range.start, 1, range.end, 1),
      options: {
        isWholeLine: true,
        className:
          activeConflictId.value === range.id
            ? 'scalar-conflict-highlight scalar-conflict-active'
            : 'scalar-conflict-highlight',
      },
    })),
  )
}

const highlightConflictBlocks = async (): Promise<void> => {
  const incoming = incomingEditor.value
  const current = currentEditorInstance.value
  const result = resultEditor.value
  if (!incoming || !current || !result) {
    return
  }

  // Parse conflict paths using Monaco's JSON AST worker, like use-editor.ts.
  // We only need these calls to align highlight intent with JSON paths.
  await Promise.all(
    conflictPaths.value.map(async (path, index) => {
      const incomingLookup = lookupIncomingModel.value
      const currentLookup = lookupCurrentModel.value
      if (incomingLookup) {
        await getJsonAstNodeFromPath(incomingLookup, path)
      }
      if (currentLookup) {
        await getJsonAstNodeFromPath(currentLookup, path)
      }
      return index
    }),
  )

  const incomingRanges = findSideConflicts(
    incoming.getModel()?.getLinesContent() ?? [],
  )
  const currentRanges = findSideConflicts(
    current.getModel()?.getLinesContent() ?? [],
  )
  const resultRanges = findConflicts(result.getModel()?.getLinesContent() ?? [])

  decorationIds.incoming.value = applyConflictDecorations(
    incoming,
    decorationIds.incoming.value,
    incomingRanges,
  )
  decorationIds.current.value = applyConflictDecorations(
    current,
    decorationIds.current.value,
    currentRanges,
  )
  decorationIds.result.value = applyConflictDecorations(
    result,
    decorationIds.result.value,
    resultRanges,
  )

  addConflictMarkers(incoming.getModel(), incomingRanges)
  addConflictMarkers(current.getModel(), currentRanges)
  addConflictMarkers(result.getModel(), resultRanges)
}

const refreshLayouts = (): void => {
  incomingEditor.value?.layout()
  currentEditorInstance.value?.layout()
  resultEditor.value?.layout()
}

const clampPercent = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

const updateDrag = (event: PointerEvent): void => {
  const state = dragState.value
  if (!state) {
    return
  }

  if (state.direction === 'vertical') {
    const containerHeight =
      editorSplitContainerRef.value?.getBoundingClientRect().height ?? 0
    if (containerHeight <= 0) {
      return
    }
    const deltaYPercent =
      ((event.clientY - state.startY) / containerHeight) * 100
    topPaneHeightPercent.value = clampPercent(
      state.initialPercent + deltaYPercent,
      22,
      72,
    )
  } else {
    const containerWidth =
      sideBySideContainerRef.value?.getBoundingClientRect().width ?? 0
    if (containerWidth <= 0) {
      return
    }
    const deltaXPercent =
      ((event.clientX - state.startX) / containerWidth) * 100
    sidePaneWidthPercent.value = clampPercent(
      state.initialPercent + deltaXPercent,
      20,
      80,
    )
  }

  refreshLayouts()
}

const stopDrag = (): void => {
  dragState.value = null
  document.body.style.removeProperty('user-select')
  window.removeEventListener('pointermove', updateDrag)
  window.removeEventListener('pointerup', stopDrag)
  refreshLayouts()
}

const startDrag = (event: PointerEvent, direction: DragDirection): void => {
  event.preventDefault()
  dragState.value = {
    direction,
    startX: event.clientX,
    startY: event.clientY,
    initialPercent:
      direction === 'vertical'
        ? topPaneHeightPercent.value
        : sidePaneWidthPercent.value,
  }
  document.body.style.setProperty('user-select', 'none')
  window.addEventListener('pointermove', updateDrag)
  window.addEventListener('pointerup', stopDrag)
}

onMounted(() => {
  ensureMonacoEnvironment()
  lookupIncomingModel.value = monaco.editor.createModel(
    JSON.stringify(baseDocument, null, 2),
    'json',
  )
  lookupCurrentModel.value = monaco.editor.createModel(
    JSON.stringify(currentDocument, null, 2),
    'json',
  )

  incomingEditor.value = monaco.editor.create(
    incomingEditorElementRef.value ?? document.createElement('div'),
    {
      value: incomingEditorValue.value,
      language: 'json',
      automaticLayout: true,
      readOnly: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      fontFamily: `'JetBrains Mono', monospace`,
      lineHeight: 20,
      scrollbar: {
        useShadows: false,
        verticalScrollbarSize: 5,
      },
    },
  )

  currentEditorInstance.value = monaco.editor.create(
    currentEditorElementRef.value ?? document.createElement('div'),
    {
      value: currentEditorValue.value,
      language: 'json',
      automaticLayout: true,
      readOnly: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      fontFamily: `'JetBrains Mono', monospace`,
      lineHeight: 20,
      scrollbar: {
        useShadows: false,
        verticalScrollbarSize: 5,
      },
    },
  )

  resultEditor.value = monaco.editor.create(
    resultEditorElementRef.value ?? document.createElement('div'),
    {
      value: mergeEditorValue.value,
      language: 'json',
      automaticLayout: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      fontFamily: `'JetBrains Mono', monospace`,
      lineHeight: 20,
      scrollbar: {
        useShadows: false,
        verticalScrollbarSize: 5,
      },
    },
  )

  incomingEditor.value.updateOptions({
    insertSpaces: true,
    tabSize: 2,
  })
  currentEditorInstance.value.updateOptions({
    insertSpaces: true,
    tabSize: 2,
  })
  resultEditor.value.updateOptions({
    insertSpaces: true,
    tabSize: 2,
  })

  const incomingModel = incomingEditor.value.getModel()
  const currentModel = currentEditorInstance.value.getModel()
  const resultModel = resultEditor.value.getModel()
  if (incomingModel) {
    configureLanguageSupport(incomingModel.uri.toString())
  }
  if (currentModel) {
    configureLanguageSupport(currentModel.uri.toString())
  }
  if (resultModel) {
    configureLanguageSupport(resultModel.uri.toString())
  }
  if (lookupIncomingModel.value) {
    configureLanguageSupport(lookupIncomingModel.value.uri.toString())
  }
  if (lookupCurrentModel.value) {
    configureLanguageSupport(lookupCurrentModel.value.uri.toString())
  }

  const resolveCommandId = resultEditor.value.addCommand(
    0,
    (_accessor, args) => {
      const payload = args as {
        type: 'current' | 'incoming' | 'both'
        conflict: ParsedConflict
      }
      resolveConflict(payload.type, payload.conflict)
    },
    '',
  )
  const pickCurrentCommandId = currentEditorInstance.value.addCommand(
    0,
    (_accessor, args) => {
      const payload = args as { id: number }
      const conflict = getResultConflictById(payload.id)
      if (!conflict) {
        return
      }
      resolveConflict('current', conflict)
    },
    '',
  )
  const pickUpstreamCommandId = incomingEditor.value.addCommand(
    0,
    (_accessor, args) => {
      const payload = args as { id: number }
      const conflict = getResultConflictById(payload.id)
      if (!conflict) {
        return
      }
      resolveConflict('incoming', conflict)
    },
    '',
  )

  if (resolveCommandId && pickCurrentCommandId && pickUpstreamCommandId) {
    codeLensProvider.value = monaco.languages.registerCodeLensProvider('json', {
      provideCodeLenses(textModel) {
        const lines = textModel.getLinesContent()
        const lenses: monaco.languages.CodeLens[] = []
        const resultModelUri = resultEditor.value?.getModel()?.uri.toString()
        const currentModelUri = currentEditorInstance.value
          ?.getModel()
          ?.uri.toString()
        const incomingModelUri = incomingEditor.value
          ?.getModel()
          ?.uri.toString()
        const modelUri = textModel.uri.toString()

        if (resultModelUri === modelUri) {
          const parsedConflicts = findConflicts(lines)
          for (const conflict of parsedConflicts) {
            const line = conflict.start
            ;(['current', 'incoming', 'both'] as const).forEach((type) => {
              lenses.push({
                range: {
                  startLineNumber: line,
                  startColumn: 1,
                  endLineNumber: line,
                  endColumn: 1,
                },
                id: `${type}-${line}`,
                command: {
                  id: resolveCommandId,
                  title:
                    type === 'current'
                      ? 'Accept Current'
                      : type === 'incoming'
                        ? 'Accept Upstream'
                        : 'Accept Both',
                  arguments: [{ type, conflict }],
                },
              })
            })
          }
        } else if (currentModelUri === modelUri) {
          const parsedConflicts = findSideConflicts(lines)
          for (const conflict of parsedConflicts) {
            lenses.push({
              range: {
                startLineNumber: conflict.start,
                startColumn: 1,
                endLineNumber: conflict.start,
                endColumn: 1,
              },
              id: `current-${conflict.start}`,
              command: {
                id: pickCurrentCommandId,
                title: 'Accept Current',
                arguments: [{ id: conflict.id }],
              },
            })
          }
        } else if (incomingModelUri === modelUri) {
          const parsedConflicts = findSideConflicts(lines)
          for (const conflict of parsedConflicts) {
            lenses.push({
              range: {
                startLineNumber: conflict.start,
                startColumn: 1,
                endLineNumber: conflict.start,
                endColumn: 1,
              },
              id: `upstream-${conflict.start}`,
              command: {
                id: pickUpstreamCommandId,
                title: 'Accept Upstream',
                arguments: [{ id: conflict.id }],
              },
            })
          }
        }

        return { lenses }
      },
      resolveCodeLens(_model, codeLens) {
        return codeLens
      },
    })
  }

  resultEditor.value.onDidChangeModelContent(() => {
    if (isApplyingConflictEdit) {
      return
    }

    const unresolvedIds = unresolvedConflictIds.value
    if (unresolvedIds.length === 0) {
      return
    }

    const nextSelections = { ...selections.value }
    unresolvedIds.forEach((id) => {
      nextSelections[id] = 'manual'
    })
    selections.value = nextSelections
    highlightConflictBlocks()
  })

  void highlightConflictBlocks()
  const firstConflict = unresolvedConflictIds.value[0]
  if (firstConflict) {
    revealConflict(firstConflict)
  }

  window.addEventListener('resize', refreshLayouts)
})

watch(
  () => mergeEditorValue.value,
  (nextValue) => {
    isApplyingConflictEdit = true
    resultEditor.value?.getModel()?.setValue(nextValue)
    isApplyingConflictEdit = false
    void highlightConflictBlocks()
  },
)

watch(
  () => incomingEditorValue.value,
  (nextValue) => {
    incomingEditor.value?.getModel()?.setValue(nextValue)
    lookupIncomingModel.value?.setValue(JSON.stringify(baseDocument, null, 2))
    void highlightConflictBlocks()
  },
)

watch(
  () => currentEditorValue.value,
  (nextValue) => {
    currentEditorInstance.value?.getModel()?.setValue(nextValue)
    lookupCurrentModel.value?.setValue(JSON.stringify(currentDocument, null, 2))
    void highlightConflictBlocks()
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshLayouts)
  window.removeEventListener('pointermove', updateDrag)
  window.removeEventListener('pointerup', stopDrag)
  document.body.style.removeProperty('user-select')
  codeLensProvider.value?.dispose()

  incomingEditor.value?.dispose()
  currentEditorInstance.value?.dispose()
  resultEditor.value?.dispose()
  lookupIncomingModel.value?.dispose()
  lookupCurrentModel.value?.dispose()
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
    <p class="text-c-2 text-xs">
      Resolve conflicts inline in the full document editor. Use the buttons
      inside the editor for each conflict.
    </p>

    <div
      ref="editorSplitContainerRef"
      class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        class="shrink-0 overflow-hidden"
        :style="{ flexBasis: `${topPaneHeightPercent}%` }">
        <div
          ref="sideBySideContainerRef"
          class="flex h-full min-h-[250px] flex-col gap-2 md:flex-row md:gap-0"
          :style="{ '--left-pane-width': `${sidePaneWidthPercent}%` }">
          <div class="incoming-pane min-h-0 md:h-full">
            <div
              ref="incomingEditorElementRef"
              class="h-full w-full rounded-lg border" />
          </div>
          <div
            class="resizer-handle hidden h-full w-2 shrink-0 cursor-col-resize md:block"
            role="separator"
            tabindex="0"
            @pointerdown="(event) => startDrag(event, 'horizontal')" />
          <div class="current-pane min-h-0 flex-1 md:h-full">
            <div
              ref="currentEditorElementRef"
              class="h-full w-full rounded-lg border" />
          </div>
        </div>
      </div>

      <div
        class="resizer-handle my-1 h-2 shrink-0 cursor-row-resize"
        role="separator"
        tabindex="0"
        @pointerdown="(event) => startDrag(event, 'vertical')" />

      <div
        class="min-h-[260px] min-w-0 flex-1 overflow-hidden"
        :style="{ flexBasis: `${100 - topPaneHeightPercent}%` }">
        <div
          ref="resultEditorElementRef"
          class="h-full w-full rounded-lg border" />
      </div>
    </div>

    <div class="flex shrink-0 items-center justify-between gap-2">
      <ScalarButton
        :disabled="unresolvedConflictIds.length === 0"
        size="xs"
        type="button"
        variant="outlined"
        @click="showNextConflict">
        Next Conflict
      </ScalarButton>
      <ScalarButton
        :disabled="!canApply || isApplying"
        size="xs"
        type="button"
        @click="applySelections">
        {{ isApplying ? 'Applying...' : 'Apply Selected Changes' }}
      </ScalarButton>
    </div>
  </div>
</template>

<style scoped>
:deep(.scalar-conflict-highlight) {
  background-color: color-mix(
    in srgb,
    var(--scalar-color-orange, #ff9f43) 14%,
    transparent
  );
}

:deep(.scalar-conflict-active) {
  background-color: color-mix(
    in srgb,
    var(--scalar-color-accent, #24b47e) 18%,
    transparent
  );
}
</style>
<style scoped>
.resizer-handle {
  background: color-mix(
    in srgb,
    var(--scalar-border-color, #5f6368) 45%,
    transparent
  );
  border-radius: 9999px;
  transition: background-color 120ms ease;
}

.resizer-handle:hover,
.resizer-handle:focus-visible {
  background: color-mix(
    in srgb,
    var(--scalar-color-accent, #24b47e) 45%,
    transparent
  );
  outline: none;
}

@media (min-width: 768px) {
  .incoming-pane {
    width: calc(var(--left-pane-width, 50%) - 4px);
  }

  .current-pane {
    width: calc(100% - var(--left-pane-width, 50%) - 4px);
    flex: none;
  }
}
</style>
