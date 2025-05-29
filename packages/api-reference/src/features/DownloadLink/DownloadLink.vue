<script lang="ts" setup>
import GitHubSlugger from 'github-slugger'
import { computed } from 'vue'

import { useConfig } from '@/hooks/useConfig'
import { downloadEventBus } from '@/libs/download'

const { title } = defineProps<{
  title?: string
}>()

const config = useConfig()

// Format the title to be displayed in the badge.
const slugger = new GitHubSlugger()
const filename = computed(() => slugger.slug(title ?? ''))

// The id is retrieved at the layout level.
const handleDownloadClick = () => {
  downloadEventBus.emit({ id: '', filename: filename.value })
}
</script>
<template>
  <div class="download">
    <template v-if="!config?.hideDownloadButton">
      <!-- Direct URL -->
      <template v-if="config?.url">
        <a
          class="download-button"
          download
          :href="config?.url"
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
