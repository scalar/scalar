<script lang="ts" setup>
import { useConfig } from '@/hooks/useConfig'

import { downloadSpecBus } from '../../helpers'

const props = defineProps<{
  specTitle?: string
}>()

const config = useConfig()

// id is retrieved at the layout level
const handleDownloadClick = () => {
  downloadSpecBus.emit({ id: '', specTitle: props.specTitle })
}
</script>
<template>
  <div class="download">
    <template v-if="!config?.hideDownloadButton">
      <!-- Direct URL -->
      <template v-if="config?.spec?.url">
        <a
          class="download-button"
          download
          :href="config?.spec?.url"
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
