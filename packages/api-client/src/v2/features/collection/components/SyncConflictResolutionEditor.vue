<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { apply, type merge } from '@scalar/json-magic/diff'
import * as monaco from 'monaco-editor'

import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css'

import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { computed, onMounted, ref } from 'vue'

import { ensureMonacoEnvironment } from '@/v2/features/collection/components/Editor/helpers/ensure-monaco-environment'

const { conflicts, baseDocument, resolvedDocument } = defineProps<{
  conflicts: ReturnType<typeof merge>['conflicts']
  // The current base document
  baseDocument: Record<string, unknown>
  // The document with the resolved conflicts (changes that could be automatically applied)
  resolvedDocument: Record<string, unknown>
}>()

const localChangesEditorRef = ref<HTMLDivElement>()
const remoteChangesEditorRef = ref<HTMLDivElement>()
const resultEditorRef = ref<HTMLDivElement>()

const localChangesEditor = ref<monaco.editor.IStandaloneDiffEditor>()
const remoteChangesEditor = ref<monaco.editor.IStandaloneDiffEditor>()
const resultEditor = ref<monaco.editor.IStandaloneDiffEditor>()
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
  ensureMonacoEnvironment()

  const originalModelLocal = monaco.editor.createModel(
    JSON.stringify(resolvedDocument, null, 2),
    'json',
  )
  const modifiedModelLocal = monaco.editor.createModel(
    JSON.stringify(documentWithLocalChanges.value, null, 2),
    'json',
  )

  const originalModelRemote = monaco.editor.createModel(
    JSON.stringify(resolvedDocument, null, 2),
    'json',
  )
  const modifiedModelRemote = monaco.editor.createModel(
    JSON.stringify(documentWithRemoteChanges.value, null, 2),
    'json',
  )

  const originalResultModel = monaco.editor.createModel(
    JSON.stringify(baseDocument, null, 2),
    'json',
  )

  const modifiedResultModel = monaco.editor.createModel(
    JSON.stringify(resolvedDocument, null, 2),
    'json',
  )

  // diff editro
  const localDiffEditor = monaco.editor.createDiffEditor(
    localChangesEditorRef.value ?? document.createElement('div'),
    {
      originalEditable: false,
      readOnly: true,
    },
  )

  localDiffEditor.setModel({
    original: originalModelLocal,
    modified: modifiedModelLocal,
  })

  // Create the remote changes editor
  const remoteDiffEditor = monaco.editor.createDiffEditor(
    remoteChangesEditorRef.value ?? document.createElement('div'),
    {
      originalEditable: false,
      readOnly: true,
    },
  )
  remoteDiffEditor.setModel({
    original: originalModelRemote,
    modified: modifiedModelRemote,
  })

  remoteChangesEditor.value = remoteDiffEditor

  const resultDiffEditor = monaco.editor.createDiffEditor(
    resultEditorRef.value ?? document.createElement('div'),
    {
      originalEditable: false,
      readOnly: false,
      renderSideBySide: false,
    },
  )
  resultDiffEditor.setModel({
    original: originalResultModel,
    modified: modifiedResultModel,
  })

  resultEditor.value = resultDiffEditor
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
    <p class="text-c-2 text-xs">
      Resolve conflicts inline in the full document editor. Use the buttons
      inside the editor for each conflict.
    </p>

    <div class="flex flex-col gap-1">
      <div class="flex gap-1">
        <div
          ref="localChangesEditorRef"
          class="h-[400px] w-1/2"></div>
        <div
          ref="remoteChangesEditorRef"
          class="h-[400px] w-1/2"></div>
      </div>
      <div
        ref="resultEditorRef"
        class="h-[400px] w-full"></div>
    </div>

    <div class="flex shrink-0 items-center justify-between gap-2">
      <ScalarButton
        size="xs"
        type="button"
        variant="outlined">
        Next Conflict
      </ScalarButton>
      <ScalarButton
        size="xs"
        type="button">
        Apply changes
      </ScalarButton>
    </div>
  </div>
</template>
