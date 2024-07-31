<script lang="ts" setup>
import { ref, watch } from 'vue'

import ResponseBodyInfo from './ResponseBodyInfo.vue'

const props = defineProps<{
  src: string
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
    class="border-1/2 flex justify-center rounded">
    <iframe
      class="w-full"
      :src="src"
      @error="error = true" />
  </div>
  <ResponseBodyInfo v-else>Image preview unavailable</ResponseBodyInfo>
</template>
