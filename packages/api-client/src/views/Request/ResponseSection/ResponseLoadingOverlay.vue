<script setup lang="ts">
import { requestStatusBus } from '@/libs'
import { ScalarLoading, useLoadingState } from '@scalar/components'
import { ref } from 'vue'

const loading = useLoadingState()

const timeout = ref<ReturnType<typeof setTimeout>>()

requestStatusBus.on((status) => {
  if (status === 'start')
    timeout.value = setTimeout(() => loading.startLoading(), 1000)
  else (timeout.value = undefined), loading.stopLoading()
})
</script>
<template>
  <Transition>
    <div
      v-if="loading.isLoading"
      class="absolute inset-0 bg-b-1 bg-mix-transparent bg-mix-amount-10 z-10 flex items-center justify-center">
      <ScalarLoading
        class="text-c-3"
        :loadingState="loading"
        size="48px" />
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
