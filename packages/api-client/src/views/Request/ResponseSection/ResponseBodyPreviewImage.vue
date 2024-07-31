<script lang="ts" setup>
import { ref, watch } from 'vue'

import ResponseBodyInfo from './ResponseBodyInfo.vue'

const props = defineProps<{
  src: string
  transparent?: boolean
}>()

const error = ref(false)

watch(
  () => props.src,
  () => (error.value = false),
)
</script>
<template>
  <div
    v-if="!error"
    class="border-1/2 flex justify-center rounded"
    :class="{ 'p-2 bg-preview': transparent }">
    <img
      class="max-w-full rounded"
      :src="src"
      @change="error = false"
      @error="error = true" />
  </div>
  <ResponseBodyInfo v-else>Image preview unavailable</ResponseBodyInfo>
</template>
<style scoped>
.light-mode .bg-preview {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23000' fill-opacity='10%25'%3E%3Crect width='8' height='8' /%3E%3Crect x='8' y='8' width='8' height='8' /%3E%3C/svg%3E");
}
.dark-mode .bg-preview {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23FFF' fill-opacity='10%25'%3E%3Crect width='8' height='8' /%3E%3Crect x='8' y='8' width='8' height='8' /%3E%3C/svg%3E");
}
</style>
