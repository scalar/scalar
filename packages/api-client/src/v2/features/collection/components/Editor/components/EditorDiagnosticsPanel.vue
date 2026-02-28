<script setup lang="ts">
import {
  ScalarIconCaretDown,
  ScalarIconCaretRight,
  ScalarIconWarning,
  ScalarIconXCircle,
} from '@scalar/icons'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

const { expanded, diagnosticCounts, visibleDiagnostics } = defineProps<{
  expanded: boolean
  diagnosticCounts: { errors: number; warnings: number }
  visibleDiagnostics: monaco.editor.IMarker[]
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'focusDiagnostic', marker: monaco.editor.IMarker): void
}>()

const getMarkerDotClass = (severity: monaco.MarkerSeverity): string =>
  severity === monaco.MarkerSeverity.Error ? 'bg-c-danger' : 'bg-c-alert'
</script>

<template>
  <div class="pointer-events-none absolute right-2 bottom-2 left-2 z-10">
    <div
      class="bg-b-1 shadow-border pointer-events-auto flex flex-col overflow-hidden rounded-lg text-[11px]">
      <button
        class="bg-b-2/30 hover:bg-b-2/50 flex items-center justify-between px-2.5 py-2 text-left"
        type="button"
        @click="emit('toggle')">
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
            v-if="expanded"
            class="size-3" />
          <ScalarIconCaretRight
            v-else
            class="size-3" />
        </span>
      </button>

      <template v-if="expanded">
        <div
          v-if="visibleDiagnostics.length"
          class="max-h-28 overflow-auto border-t">
          <button
            v-for="(marker, index) in visibleDiagnostics"
            :key="`${marker.owner}-${marker.startLineNumber}-${marker.startColumn}-${index}`"
            class="hover:bg-b-2/40 flex w-full items-start gap-2 px-2.5 py-2 text-left"
            type="button"
            @click="emit('focusDiagnostic', marker)">
            <span
              class="mt-0.5 size-1.5 shrink-0 rounded-full"
              :class="getMarkerDotClass(marker.severity)" />

            <span class="min-w-0 flex-1">
              <span class="text-c-1 block truncate">{{ marker.message }}</span>
              <span class="text-c-3 block whitespace-nowrap">
                Ln {{ marker.startLineNumber }}, Col {{ marker.startColumn }}
              </span>
            </span>
          </button>
        </div>
        <div
          v-else
          class="text-c-3 border-t px-2.5 py-2">
          Errors and warnings from the JSON/YAML language workers will show up
          here.
        </div>
      </template>
    </div>
  </div>
</template>
