<script setup lang="ts">
import {
  ScalarButton,
  ScalarLoading,
  useLoadingState,
} from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const { eventBus } = defineProps<{
  /** Workspace event bus */
  eventBus: WorkspaceEventBus
}>()

const loader = useLoadingState()
const timeout = ref<ReturnType<typeof setTimeout>>()

const startLoading = () => {
  timeout.value = setTimeout(() => loader.start(), 1000)
}

const stopLoading = () => {
  clearTimeout(timeout.value)
  timeout.value = undefined
  void loader.clear()
}

onMounted(() => {
  eventBus.on('hooks:on:request:sent', startLoading)
  eventBus.on('hooks:on:request:complete', stopLoading)
})

onBeforeUnmount(() => {
  eventBus.off('hooks:on:request:sent', startLoading)
  eventBus.off('hooks:on:request:complete', stopLoading)
  stopLoading()
})
</script>
<template>
  <Transition>
    <div
      v-if="loader.isActive"
      class="bg-b-1 z-overlay absolute inset-0 flex flex-col items-center justify-center gap-6">
      <ScalarLoading
        class="text-c-3"
        :loader
        size="3xl" />
      <ScalarButton
        variant="ghost"
        @click="eventBus.emit('operation:cancel:request')">
        Cancel
      </ScalarButton>
    </div>
  </Transition>
</template>
<style scoped>
.v-enter-active {
  transition: opacity 0.5s ease;
}

.v-enter-from {
  opacity: 0;
}
</style>
