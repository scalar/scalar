<script lang="ts" setup>
import { downloadSpecBus } from '../../../helpers'
</script>
<template>
  <div class="download">
    <div class="download-cta">
      <button
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
  text-decoration: none;
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
}
.download-cta .download-button:hover {
  text-decoration: underline;
}
</style>
