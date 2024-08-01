<script lang="ts" setup>
import { ref, watch } from 'vue'

import ResponseBodyInfo from './ResponseBodyInfo.vue'

const props = defineProps<{
  src: string
  type: string
  alpha?: boolean
  aspect?: string
}>()

const error = ref(false)

watch(
  () => props.src,
  () => (error.value = false),
)
</script>
<template>
  <div
    v-if="!error && src"
    class="border-1/2 flex justify-center rounded overflow-hidden"
    :class="{ 'p-2 bg-preview': alpha }">
    <object
      class="max-w-full"
      :class="alpha ? 'rounded' : 'w-full'"
      :data="src"
      :style="{ aspectRatio: aspect }"
      :type="type"
      @error="error = true"></object>
  </div>
  <ResponseBodyInfo v-else>Preview unavailable</ResponseBodyInfo>
</template>
<style scoped>
.light-mode .bg-preview {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23000' fill-opacity='10%25'%3E%3Crect width='8' height='8' /%3E%3Crect x='8' y='8' width='8' height='8' /%3E%3C/svg%3E");
}
.dark-mode .bg-preview {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23FFF' fill-opacity='10%25'%3E%3Crect width='8' height='8' /%3E%3Crect x='8' y='8' width='8' height='8' /%3E%3C/svg%3E");
}
</style>
