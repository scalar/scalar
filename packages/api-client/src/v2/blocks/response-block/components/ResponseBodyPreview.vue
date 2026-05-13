<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

import { type MediaPreview } from '@/v2/blocks/response-block/helpers/media-types'

import ResponseBodyInfo from './ResponseBodyInfo.vue'
import ResponseBodyRaw from './ResponseBodyRaw.vue'

const {
  src,
  type,
  mode,
  alpha = false,
  content,
} = defineProps<{
  src: string
  type: string
  mode: MediaPreview
  alpha?: boolean | undefined
  /** Decoded body; used when `mode` is `json` for pretty-printed preview (no JSON.parse round-trip). */
  content?: unknown
}>()

const jsonPreviewContent = computed((): string => {
  const value = content
  if (typeof value === 'string') {
    return value
  }
  if (value == null) {
    return ''
  }
  return String(value)
})

const error = ref(false)

watch(
  () => src,
  () => (error.value = false),
)
</script>
<template>
  <ResponseBodyRaw
    v-if="mode === 'json'"
    :content="jsonPreviewContent"
    language="json"
    prettyPrintJson />
  <div
    v-else-if="!error && src"
    class="flex justify-center overflow-auto rounded-b"
    :class="{ 'bg-preview p-2': alpha }">
    <img
      v-if="mode === 'image'"
      class="h-full max-w-full"
      :class="{ rounded: alpha }"
      :src="src"
      @error="error = true" />
    <video
      v-else-if="mode === 'video'"
      autoplay
      controls
      width="100%"
      @error="error = true">
      <source
        :src="src"
        :type="type" />
    </video>
    <audio
      v-else-if="mode === 'audio'"
      class="my-12"
      controls
      @error="error = true">
      <source
        :src="src"
        :type="type" />
    </audio>
    <object
      v-else
      class="aspect-[4/3] w-full"
      :data="src"
      :type="type"
      @error="error = true" />
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
