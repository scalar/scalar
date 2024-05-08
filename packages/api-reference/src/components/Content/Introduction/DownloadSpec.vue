<script lang="ts" setup>
import { inject } from 'vue'

import { HIDE_DOWNLOAD_BUTTON_SYMBOL, downloadSpecBus } from '../../../helpers'

const props = defineProps<{
  specTitle?: string
}>()

const getHideDownloadButtonSymbol = inject(HIDE_DOWNLOAD_BUTTON_SYMBOL)

// id is retrieved at the layout level
const handleDownloadClick = () => {
  downloadSpecBus.emit({ id: '', specTitle: props.specTitle })
}
</script>
<template>
  <div class="download">
    <div class="download-cta">
      <button
        v-if="!getHideDownloadButtonSymbol?.()"
        class="download-button"
        type="button"
        @click="handleDownloadClick">
        Download OpenAPI Spec
      </button>
    </div>
  </div>
</template>

<style scoped>
.download-cta {
  margin-bottom: 24px;
}
.download-cta .download-button {
  color: var(--scalar-color-accent);
  text-decoration: var(--scalar-text-decoration) !important;
  font-size: var(--scalar-paragraph);
  cursor: pointer;
}
.download-cta .download-button:hover {
  text-decoration: var(--scalar-text-decoration-hover) !important;
}
</style>
