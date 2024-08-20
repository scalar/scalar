<script setup lang="ts">
import { cancelRequestBus, requestStatusBus } from '@/libs'
import {
  ScalarButton,
  ScalarLoading,
  useLoadingState,
} from '@scalar/components'
import { ref } from 'vue'

const loading = useLoadingState()

const timeout = ref<ReturnType<typeof setTimeout>>()

requestStatusBus.on((status) => {
  if (status === 'start')
    timeout.value = setTimeout(() => loading.startLoading(), 1000)
  else
    clearTimeout(timeout.value),
      (timeout.value = undefined),
      loading.stopLoading()
})
</script>
<template>
  <Transition>
    <div
      v-if="loading.isLoading"
      class="absolute inset-0 bg-b-1 z-10 flex flex-col gap-6 items-center justify-center">
      <ScalarLoading
        class="text-c-3"
        :loadingState="loading"
        size="3xl" />
      <ScalarButton
        variant="ghost"
        @click="cancelRequestBus.emit()">
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
