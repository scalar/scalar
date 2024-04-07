<script lang="ts" setup>
import { inject } from 'vue'

import { HIDE_DOWNLOAD_BUTTON_SYMBOL, downloadSpecBus } from '../../../helpers'

const getHideDownloadButtonSymbol = inject(HIDE_DOWNLOAD_BUTTON_SYMBOL)
</script>
<template>
  <div class="download">
    <div class="download-cta">
      <button
        v-if="!getHideDownloadButtonSymbol?.()"
        class="download-button"
        type="button"
        @click="downloadSpecBus.emit()">
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
  color: var(--theme-color-accent, var(--default-theme-color-accent));
  text-decoration: var(
    --theme-text-decoration,
    var(--default-theme-text-decoration)
  ) !important;
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
  cursor: pointer;
}
.download-cta .download-button:hover {
  text-decoration: var(
    --theme-text-decoration-hover,
    var(--default-theme-text-decoration-hover)
  ) !important;
}
</style>
