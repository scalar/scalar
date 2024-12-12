<script lang="ts" setup>
import { inject } from 'vue'

import {
  HIDE_DOWNLOAD_BUTTON_SYMBOL,
  OPENAPI_DOCUMENT_URL_SYMBOL,
  downloadSpecBus,
} from '../../helpers'

const props = defineProps<{
  specTitle?: string
}>()

const getHideDownloadButtonSymbol = inject(HIDE_DOWNLOAD_BUTTON_SYMBOL)
const getOpenApiDocumentUrlSymbol = inject(OPENAPI_DOCUMENT_URL_SYMBOL)

// id is retrieved at the layout level
const handleDownloadClick = () => {
  downloadSpecBus.emit({ id: '', specTitle: props.specTitle })
}
</script>
<template>
  <div class="download">
    <template v-if="!getHideDownloadButtonSymbol?.()">
      <!-- Direct URL -->
      <template v-if="getOpenApiDocumentUrlSymbol?.()">
        <a
          class="download-button"
          download
          :href="getOpenApiDocumentUrlSymbol?.()"
          target="_blank">
          Download OpenAPI Document
        </a>
      </template>
      <!-- Generate download from document -->
      <template v-else>
        <button
          class="download-button"
          role="link"
          type="button"
          @click="handleDownloadClick">
          Download OpenAPI Document
        </button>
      </template>
    </template>
  </div>
</template>

<style scoped>
.download {
  margin-bottom: 24px;
}

.download-button {
  color: var(--scalar-link-color, var(--scalar-color-accent));
  font-weight: var(--scalar-link-font-weight, inherit);
  text-decoration: var(--scalar-text-decoration) !important;
  text-decoration-color: var(--scalar-text-decoration-color);
  font-size: var(--scalar-paragraph);
  cursor: pointer;
}
.download-button:hover {
  color: var(--scalar-link-color-hover, var(--scalar-color-accent));
  text-decoration: var(--scalar-text-decoration-hover) !important;
  text-decoration-color: var(--scalar-text-decoration-color-hover);
}
</style>
