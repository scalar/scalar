<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { type merge } from '@scalar/json-magic/diff'
import { useToasts } from '@scalar/use-toasts'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { useSplitResize } from '@/v2/components/resize'
import { useThreeWayMergeEditor } from '@/v2/features/editor/hooks/use-three-way-merge-editor'

const { conflicts, baseDocument, resolvedDocument } = defineProps<{
  conflicts: ReturnType<typeof merge>['conflicts']
  baseDocument: Record<string, unknown>
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

const mergeEditor = useThreeWayMergeEditor({
  baseDocument,
  resolvedDocument,
  conflicts,
  onApplyChanges: (resolvedDoc) =>
    emit('applyChanges', { resolvedDocument: resolvedDoc }),
  onError: (message) => toast(message, 'error'),
})

const conflictsLeft = computed(() => mergeEditor.conflictsLeft.value)

const topPaneStyle = computed(() => ({ height: `${topPaneSize.value}%` }))
const leftPaneStyle = computed(() => ({ width: `${leftPaneSize.value}%` }))
const rightPaneStyle = computed(() => ({
  width: `${100 - leftPaneSize.value}%`,
}))

const localChangesEditorRef = ref<HTMLDivElement>()
const remoteChangesEditorRef = ref<HTMLDivElement>()
const resultEditorRef = ref<HTMLDivElement>()

onMounted(() => {
  const localEl = localChangesEditorRef.value
  const remoteEl = remoteChangesEditorRef.value
  const resultEl = resultEditorRef.value
  if (localEl && remoteEl && resultEl) {
    mergeEditor.init({
      local: localEl,
      remote: remoteEl,
      result: resultEl,
    })
  }
})

onUnmounted(() => {
  stopActiveResize()
  mergeEditor.dispose()
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
            @click="mergeEditor.goToNextConflict">
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
        @click="mergeEditor.applyResolvedConflicts">
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
