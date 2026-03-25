<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconWarning } from '@scalar/icons'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

const { workspaceStore } = defineProps<{
  workspaceStore: WorkspaceStore
}>()

const isDirty = computed(
  () => workspaceStore.workspace.activeDocument?.['x-scalar-is-dirty'] === true,
)

const revert = async (): Promise<void> => {
  const name = workspaceStore.workspace['x-scalar-active-document']
  if (name) {
    await workspaceStore.revertDocumentChanges(name)
  }
}
</script>

<template>
  <div
    v-if="isDirty"
    class="flex flex-col gap-2 rounded-lg border px-3 py-2.5"
    role="status"
    style="
      border-color: color-mix(
        in srgb,
        var(--scalar-color-orange),
        transparent 55%
      );
      background: color-mix(
        in srgb,
        var(--scalar-color-orange),
        transparent 92%
      );
    ">
    <div class="flex items-start gap-2">
      <ScalarIconWarning
        class="mt-0.5 size-4 shrink-0 text-[var(--scalar-color-orange)]" />
      <p class="text-c-1 m-0 text-sm leading-snug">
        OpenApi document was modified. You can revert to the original version.
      </p>
    </div>
    <div class="flex justify-end">
      <ScalarButton
        size="sm"
        type="button"
        variant="outlined"
        @click="revert">
        Revert to original version
      </ScalarButton>
    </div>
  </div>
</template>
