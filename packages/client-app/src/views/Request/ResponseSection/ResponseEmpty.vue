<script setup lang="ts">
import Computer from '@/assets/computer.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { executeRequestBus } from '@/libs'
import { useWorkspace } from '@/store/workspace'

const { workspace } = useWorkspace()
</script>
<template>
  <div class="relative col-1 flex-center gap-6 p-2 capitalize">
    <div
      class="flex h-[calc(100%_-_50px)] flex-col items-center justify-center">
      <ScalarAsciiArt :art="Computer" />
    </div>
    <div
      class="text-c-3 right-4 mt-auto flex w-full flex-col items-end gap-2 text-sm">
      <button
        class="flex items-center gap-1.5"
        type="button"
        @click="executeRequestBus.emit()">
        Send Request
        <ScalarHotkey hotkey="↵" />
      </button>
      <button
        v-if="!workspace.isReadOnly"
        class="flex items-center gap-1.5"
        type="button">
        New Request
        <ScalarHotkey hotkey="N" />
      </button>
    </div>
  </div>
</template>
