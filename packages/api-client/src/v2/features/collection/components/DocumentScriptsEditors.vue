<script setup lang="ts">
import { ScalarIconArrowRight, ScalarIconCheckCircle } from '@scalar/icons'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import * as monaco from 'monaco-editor'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
const preValue = (): string => (document?.['x-pre-request'] as string) ?? ''
const postValue = (): string => (document?.['x-post-response'] as string) ?? ''

/** Content indicators: true when the script has non-whitespace content */
const hasPreContent = computed(
  () => preHasContent.value || preValue().trim().length > 0,
)

const hasPostContent = computed(
  () => postHasContent.value || postValue().trim().length > 0,
)

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
  <div class="document-scripts-editors flex flex-col gap-5">
    <!-- Tabs with icons and content indicators -->
    <div
      aria-label="Script type"
      class="document-scripts-editors__tabs flex shrink-0 gap-0.5 rounded-xl border border-[var(--scalar-border-color)] bg-[var(--scalar-background-2)] p-1"
      role="tablist">
      <button
        :aria-selected="activeTab === 'pre'"
        :class="[
          'document-scripts-editors__tab flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150',
          activeTab === 'pre'
            ? 'text-c-1 bg-[var(--scalar-background-1)] shadow-[var(--scalar-shadow-1)]'
            : 'text-c-2 hover:text-c-1 hover:bg-[var(--scalar-background-3)]',
        ]"
        role="tab"
        type="button"
        @click="switchTo('pre')">
        <ScalarIconArrowRight
          aria-hidden="true"
          class="size-4 shrink-0 opacity-80" />
        <span class="truncate">Pre-request</span>
        <span
          v-if="hasPreContent"
          aria-hidden="true"
          class="h-2 w-2 shrink-0 rounded-full bg-[var(--scalar-color-green)]"
          title="Has content" />
      </button>
      <button
        :aria-selected="activeTab === 'post'"
        :class="[
          'document-scripts-editors__tab flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150',
          activeTab === 'post'
            ? 'text-c-1 bg-[var(--scalar-background-1)] shadow-[var(--scalar-shadow-1)]'
            : 'text-c-2 hover:text-c-1 hover:bg-[var(--scalar-background-3)]',
        ]"
        role="tab"
        type="button"
        @click="switchTo('post')">
        <ScalarIconCheckCircle
          aria-hidden="true"
          class="size-4 shrink-0 opacity-80" />
        <span class="truncate">Post-response</span>
        <span
          v-if="hasPostContent"
          aria-hidden="true"
          class="h-2 w-2 shrink-0 rounded-full bg-[var(--scalar-color-green)]"
          title="Has content" />
      </button>
    </div>

    <!-- Description and editor card -->
    <div
      class="document-scripts-editors__card flex flex-col overflow-hidden rounded-xl border border-[var(--scalar-border-color)] bg-[var(--scalar-background-1)] shadow-[var(--scalar-shadow-1)]">
      <div
        class="document-scripts-editors__card-header flex min-h-[4rem] shrink-0 items-center justify-between border-b border-[var(--scalar-border-color)] bg-[var(--scalar-background-2)] px-4 py-3">
        <p class="text-c-2 text-sm leading-snug">
          <template v-if="activeTab === 'pre'">
            Runs before each request in this document. Use it to set variables,
            headers, or modify the request.
          </template>
          <template v-else>
            Runs after each response. Use it for tests, assertions, or saving
            data from the response.
          </template>
        </p>
        <span
          aria-hidden="true"
          class="text-c-2 rounded bg-[var(--scalar-background-3)] px-2 py-1 font-mono text-xs">
          JavaScript
        </span>
      </div>
      <div
        ref="editorContainerRef"
        class="document-scripts-editors__container min-h-[300px] flex-1" />
    </div>
  </div>
</template>

<style scoped>
.document-scripts-editors__container {
  min-height: 300px;
}
</style>
