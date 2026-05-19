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

/**
 * Validates the `src` against an allow-list of safe protocols before it is
 * passed to a rendering element. This blocks XSS vectors such as
 * `javascript:` and `vbscript:` URIs and also prevents accidentally embedding
 * a `data:text/html` payload that could execute script in the app origin.
 *
 * Allowed:
 *   - `blob:` (the standard case — generated client-side by `URL.createObjectURL`)
 *   - `http:` / `https:`
 *   - `data:` URIs whose MIME type is a known safe media kind
 *     (`image/*`, `video/*`, `audio/*`, `application/pdf`, `application/octet-stream`)
 *
 * Anything else (including malformed or relative URLs) collapses to an empty
 * string so the template falls back to the "Preview unavailable" message.
 */
const safeSrc = computed((): string => {
  if (!src) {
    return ''
  }

  if (src.startsWith('data:')) {
    return /^data:(image\/|video\/|audio\/|application\/pdf|application\/octet-stream)/i.test(
      src,
    )
      ? src
      : ''
  }

  try {
    const parsed = new URL(src)
    if (
      parsed.protocol === 'blob:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:'
    ) {
      return src
    }
  } catch {
    // Malformed or relative URL — refuse to render.
  }

  return ''
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
    v-else-if="!error && safeSrc"
    class="flex justify-center overflow-auto rounded-b"
    :class="{ 'bg-preview p-2': alpha }">
    <img
      v-if="mode === 'image'"
      class="h-full max-w-full"
      :class="{ rounded: alpha }"
      :src="safeSrc"
      referrerpolicy="no-referrer"
      @error="error = true" />
    <video
      v-else-if="mode === 'video'"
      autoplay
      controls
      width="100%"
      @error="error = true">
      <source
        :src="safeSrc"
        :type="type" />
    </video>
    <audio
      v-else-if="mode === 'audio'"
      class="my-12"
      controls
      @error="error = true">
      <source
        :src="safeSrc"
        :type="type" />
    </audio>
    <!--
      `<object>` would execute scripts inside the embedded document in the
      app's origin, so we render arbitrary previews inside a strictly
      sandboxed `<iframe>` instead. The empty `sandbox` attribute disables
      scripts, forms, popups and same-origin access, leaving only inert
      rendering (e.g. the browser's built-in PDF viewer).
    -->
    <iframe
      v-else
      class="aspect-[4/3] w-full border-0"
      :src="safeSrc"
      sandbox=""
      referrerpolicy="no-referrer"
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
