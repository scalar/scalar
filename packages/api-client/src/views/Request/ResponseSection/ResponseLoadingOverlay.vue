<script setup lang="ts">
import {
  ScalarButton,
  ScalarLoading,
  useLoadingState,
} from '@scalar/components'
import { ref } from 'vue'

import { useWorkspace } from '@/store'

const { events } = useWorkspace()
const loader = useLoadingState()

const timeout = ref<ReturnType<typeof setTimeout>>()

events.requestStatus.on(async (status) => {
  if (status === 'start') {
    timeout.value = setTimeout(() => loader.start(), 1000)
  } else {
    clearTimeout(timeout.value)
    timeout.value = undefined
    await loader.clear()
  }
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
        @click="events.cancelRequest.emit()">
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
