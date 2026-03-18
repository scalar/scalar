<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'

const { document } = defineProps<{
  document: WorkspaceDocument | null
}>()

const emit = defineEmits<{
  (e: 'update:extension', payload: Record<string, unknown>): void
}>()

type ScriptTab = 'pre' | 'post'

const activeTab = ref<ScriptTab>('pre')
const editorContainerRef = ref<HTMLElement | null>(null)

let currentEditor: monaco.editor.IStandaloneCodeEditor | null = null
let currentModel: monaco.editor.ITextModel | null = null
let currentTab: ScriptTab | null = null

/** Local content state so the indicator updates immediately on type, before document prop syncs */
const preHasContent = ref(false)
const postHasContent = ref(false)

const preValue = (): string =>
  (document?.['x-pre-request'] as string) ?? ''
const postValue = (): string =>
  (document?.['x-post-response'] as string) ?? ''

/** Content indicators: true when the script has non-whitespace content */
const hasPreContent = computed(() => preHasContent.value || preValue().trim().length > 0)
const hasPostContent = computed(() => postHasContent.value || postValue().trim().length > 0)

const EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  folding: true,
  showFoldingControls: 'always',
  fontSize: 13,
  lineHeight: 20,
  fontFamily: "'JetBrains Mono', monospace",
  scrollbar: {
    useShadows: false,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: 'none',
  wordWrap: 'on',
}

const disposeCurrentEditor = () => {
  /** Flush current content to parent before disposing so we do not lose unsynced input */
  if (currentEditor && currentTab) {
    const value = currentEditor.getValue()
    if (currentTab === 'pre') {
      emit('update:extension', { 'x-pre-request': value })
    } else {
      emit('update:extension', { 'x-post-response': value })
    }
  }
  currentEditor?.dispose()
  currentModel?.dispose()
  currentEditor = null
  currentModel = null
  currentTab = null
}

const createEditorFor = (tab: ScriptTab) => {
  if (!editorContainerRef.value) {
    return
  }
  disposeCurrentEditor()
  const value = tab === 'pre' ? preValue() : postValue()
  const model = monaco.editor.createModel(value, 'javascript')
  const editor = monaco.editor.create(editorContainerRef.value, {
    ...EDITOR_OPTIONS,
    model,
  })
  currentEditor = editor
  currentModel = model
  currentTab = tab

  const updateHasContent = (getValue: () => string) => {
    const v = getValue().trim().length > 0
    if (tab === 'pre') {
      preHasContent.value = v
    } else {
      postHasContent.value = v
    }
  }
  updateHasContent(() => (tab === 'pre' ? preValue() : postValue()))
  model.onDidChangeContent(() => {
    const newValue = editor.getValue()
    if (tab === 'pre') {
      preHasContent.value = newValue.trim().length > 0
      emit('update:extension', { 'x-pre-request': newValue })
    } else {
      postHasContent.value = newValue.trim().length > 0
      emit('update:extension', { 'x-post-response': newValue })
    }
  })
}

const switchTo = (tab: ScriptTab) => {
  if (activeTab.value === tab) {
    return
  }
  activeTab.value = tab
  createEditorFor(tab)
}

onMounted(() => {
  createEditorFor(activeTab.value)
})

onBeforeUnmount(() => {
  disposeCurrentEditor()
})

watch(
  () => [document?.['x-pre-request'], document?.['x-post-response']] as const,
  ([nextPre, nextPost]) => {
    const preStr = (nextPre as string) ?? ''
    const postStr = (nextPost as string) ?? ''
    preHasContent.value = preStr.trim().length > 0
    postHasContent.value = postStr.trim().length > 0
    if (currentTab === 'pre' && currentModel?.getValue() !== preStr) {
      currentModel?.setValue(preStr)
    }
    if (currentTab === 'post' && currentModel?.getValue() !== postStr) {
      currentModel?.setValue(postStr)
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="document-scripts-editors flex flex-col gap-4">
    <!-- Toggle tabs with content indicators -->
    <div
      aria-label="Script type"
      class="flex shrink-0 gap-1 rounded-lg border border-[var(--scalar-border-color)] bg-[var(--scalar-background-2)] p-1"
      role="tablist">
      <button
        :aria-selected="activeTab === 'pre'"
        :class="[
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          activeTab === 'pre'
            ? 'bg-[var(--scalar-background-1)] text-c-1 shadow-sm'
            : 'text-c-2 hover:bg-[var(--scalar-background-3)] hover:text-c-1',
        ]"
        role="tab"
        type="button"
        @click="switchTo('pre')">
        <span>Pre-request</span>
        <span
          v-if="hasPreContent"
          aria-hidden="true"
          class="bg-green h-2 w-2 shrink-0 rounded-full"
          title="Has content" />
      </button>
      <button
        :aria-selected="activeTab === 'post'"
        :class="[
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          activeTab === 'post'
            ? 'bg-[var(--scalar-background-1)] text-c-1 shadow-sm'
            : 'text-c-2 hover:bg-[var(--scalar-background-3)] hover:text-c-1',
        ]"
        role="tab"
        type="button"
        @click="switchTo('post')">
        <span>Post-response</span>
        <span
          v-if="hasPostContent"
          aria-hidden="true"
          class="bg-green h-2 w-2 shrink-0 rounded-full"
          title="Has content" />
      </button>
    </div>

    <!-- Description for active tab -->
    <p class="text-c-3 text-sm">
      <template v-if="activeTab === 'pre'">
        Runs before each request in this document (e.g. set variables, headers).
      </template>
      <template v-else>
        Runs after each response (e.g. tests, assertions).
      </template>
    </p>

    <!-- Single editor container -->
    <div
      ref="editorContainerRef"
      class="document-scripts-editors__container min-h-[280px] flex-1 rounded-lg border border-[var(--scalar-border-color)] overflow-hidden bg-[var(--scalar-background-1)]" />
  </div>
</template>

<style scoped>
.document-scripts-editors__container {
  min-height: 280px;
}
</style>
