<script setup lang="ts">
import { ScalarIconArrowRight, ScalarIconCheckCircle } from '@scalar/icons'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import * as monaco from 'monaco-editor'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'

const { document } = defineProps<{
  document: WorkspaceDocument | null
}>()

const emit = defineEmits<{
  (e: 'update:extension', payload: Record<string, unknown>): void
}>()

type ScriptTab = 'pre' | 'post'

const activeTab = ref<ScriptTab>('pre')
const editorContainerRef = ref<HTMLElement | null>(null)

const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const preModel = shallowRef<monaco.editor.ITextModel | null>(null)
const postModel = shallowRef<monaco.editor.ITextModel | null>(null)

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

/**
 * Creates Monaco text models for pre-request and post-response scripts.
 * Each model maintains its own content, undo history, and cursor state.
 * Change listeners emit updates to sync content with the parent component.
 */
const createModels = () => {
  preModel.value = monaco.editor.createModel(preValue(), 'javascript')
  postModel.value = monaco.editor.createModel(postValue(), 'javascript')

  preHasContent.value = preValue().trim().length > 0
  postHasContent.value = postValue().trim().length > 0

  preModel.value.onDidChangeContent(() => {
    const newValue = preModel.value?.getValue() ?? ''
    preHasContent.value = newValue.trim().length > 0
    emit('update:extension', { 'x-pre-request': newValue })
  })

  postModel.value.onDidChangeContent(() => {
    const newValue = postModel.value?.getValue() ?? ''
    postHasContent.value = newValue.trim().length > 0
    emit('update:extension', { 'x-post-response': newValue })
  })
}

/**
 * Initializes the Monaco editor instance with both models.
 * The editor is created once and reused; tab switching swaps models instead of recreating the editor.
 */
const createEditor = () => {
  if (!editorContainerRef.value) {
    return
  }

  createModels()

  const initialModel = activeTab.value === 'pre' ? preModel : postModel
  editor.value = monaco.editor.create(editorContainerRef.value, {
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
    model: initialModel.value,
  })
}

/**
 * Switches the active tab by swapping the model on the existing editor.
 * This preserves each model's undo history, cursor position, and scroll state.
 */
const switchTo = (tab: ScriptTab) => {
  if (activeTab.value === tab || !editor.value) {
    return
  }
  activeTab.value = tab
  const model = tab === 'pre' ? preModel : postModel
  if (model) {
    editor.value.setModel(model.value)
  }
}

/** Cleans up Monaco resources when the component unmounts. */
const disposeAll = () => {
  preModel.value?.dispose()
  postModel.value?.dispose()
  editor.value?.dispose()
  editor.value = null
  preModel.value = null
  postModel.value = null
}

onMounted(() => {
  createEditor()
})

onBeforeUnmount(() => {
  disposeAll()
})

watch(
  () => [document?.['x-pre-request'], document?.['x-post-response']] as const,
  ([nextPre, nextPost]) => {
    const preStr = (nextPre as string) ?? ''
    const postStr = (nextPost as string) ?? ''
    preHasContent.value = preStr.trim().length > 0
    postHasContent.value = postStr.trim().length > 0

    if (preModel.value && preModel.value.getValue() !== preStr) {
      preModel.value.setValue(preStr)
    }
    if (postModel.value && postModel.value.getValue() !== postStr) {
      postModel.value.setValue(postStr)
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
        class="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150"
        :class="[
          'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150',
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
        class="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150"
        :class="[
          'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150',
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
