<script setup lang="ts">
import { ScalarIconDownloadSimple } from '@scalar/icons'
</script>
<template>
  <a
    class="download-app-button flex flex-row gap-2 rounded !px-3 !py-1.5 sm:px-3"
    href="https://scalar.com/download?utm_source=web_client&utm_medium=download_button&utm_campaign=topnav"
    target="_blank"
    type="button">
    <ScalarIconDownloadSimple size="sm" />
    <span class="sr-only text-sm font-medium sm:not-sr-only">
      Download App
    </span>
  </a>
</template>
<style scoped>
.download-app-button {
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  background: linear-gradient(rgba(255, 255, 255, 0.75), rgba(0, 0, 0, 0.035));
}

.dark-mode .download-app-button {
  background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.15));
}

.download-app-button:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.035), rgba(255, 255, 255, 0.75));
}

.dark-mode .download-app-button:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.1));
}
</style>
