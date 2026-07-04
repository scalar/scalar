<script setup lang="ts">
import { apply, diff, merge } from '@scalar/json-magic/diff'
import { ref } from 'vue'

import SyncConflictResolutionEditor from '@/features/app/components/SyncConflictResolutionEditor.vue'

/**
 * Test-only harness page for the sync conflict (three-way merge) editor.
 *
 * Renders the editor with a deterministic fixture so the Playwright suite
 * can snapshot the diff editing states without needing a registry backend.
 * Mounted at `/test/sync-conflict-editor`.
 */

/**
 * A small three-way merge fixture with two conflicts:
 * - both sides changed `info.title`
 * - both sides changed `info.version`
 * The remote side also added a non-conflicting `servers` entry.
 */
const original = {
  openapi: '3.1.0',
  info: {
    title: 'Pets',
    version: '1.0.0',
    description: 'A sample document with conflicts',
  },
  paths: {
    '/pets': {
      get: {
        summary: 'List pets',
      },
    },
  },
}

const remoteDocument = {
  ...structuredClone(original),
  info: { ...original.info, title: 'Remote Title', version: '2.0.0' },
  servers: [{ url: 'https://api.example.com' }],
}

const localDocument = {
  ...structuredClone(original),
  info: { ...original.info, title: 'Local Title', version: '3.0.0' },
}

const remoteChanges = diff(original, remoteDocument)
const localChanges = diff(original, localDocument)
// Conflict tuples follow the `[remote, local]` convention the editor expects
const { diffs, conflicts } = merge(remoteChanges, localChanges)

// The resolved document starts with all non-conflicting changes applied,
// exactly like the rebase flow prepares it in production
const resolvedDocument = apply(
  structuredClone(original) as Record<string, unknown>,
  diffs,
)

const appliedDocument = ref<Record<string, unknown> | null>(null)

const handleApplyChanges = (payload: {
  resolvedDocument: Record<string, unknown>
}): void => {
  appliedDocument.value = payload.resolvedDocument
}
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4"
    data-testid="sync-conflict-editor-harness">
    <SyncConflictResolutionEditor
      :baseDocument="original"
      :conflicts="conflicts"
      :resolvedDocument="resolvedDocument"
      @applyChanges="handleApplyChanges" />
    <!-- Exposes the applied payload so end-to-end tests can assert it -->
    <pre
      v-if="appliedDocument"
      class="max-h-20 shrink-0 overflow-auto text-[10px]"
      data-testid="applied-document"
      >{{ JSON.stringify(appliedDocument) }}</pre
    >
  </div>
</template>
