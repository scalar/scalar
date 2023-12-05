<script lang="ts" setup>
import { isJsonString } from '../../../helpers'

defineProps<{
  value: string
}>()

/* Generate a download URL for the parsedSpec */
function inlineDownloadUrl(content: string) {
  const blob = isJsonString(content)
    ? new Blob([content], {
        type: 'application/json',
      })
    : new Blob([content], {
        type: 'application/x-yaml',
      })

  return URL.createObjectURL(blob)
}

/* Generate a filename for the parsedSpec */
function getFilename(content: string) {
  return isJsonString(content) ? 'spec.json' : 'spec.yaml'
}
</script>
<template>
  <div
    v-if="value"
    class="download">
    <div class="download-cta">
      <a
        :download="getFilename(value)"
        :href="inlineDownloadUrl(value)">
        Download OpenAPI Spec
      </a>
    </div>
  </div>
</template>

<style scoped>
.download-cta {
  margin-bottom: 24px;
}
.download-cta a {
  color: var(--theme-color-accent, var(--default-theme-color-accent));
  text-decoration: none;
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
}
.download-cta a:hover {
  text-decoration: underline;
}
</style>
