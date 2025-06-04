<script lang="ts" setup>
import GitHubSlugger from 'github-slugger'
import { computed } from 'vue'

import Badge from '@/components/Badge/Badge.vue'
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
const handleDownloadClick = (format: 'json' | 'yaml') => {
  downloadEventBus.emit({ id: '', filename: filename.value, format })
}
</script>
<template>
  <div
    v-if="!config?.hideDownloadButton"
    class="download-container">
    <button
      type="button"
      class="download-button"
      @click.prevent="handleDownloadClick('json')"
      variant="ghost">
      <span> Download OpenAPI Document </span>
      <Badge class="extension">json</Badge>
    </button>
    <button
      type="button"
      class="download-button"
      @click.prevent="handleDownloadClick('yaml')"
      variant="ghost">
      <span> Download OpenAPI Document </span>
      <Badge class="extension">yaml</Badge>
    </button>
  </div>
</template>

<style scoped>
@reference '@/style.css';

.download-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 4px 0 24px;
  position: relative;
  width: fit-content;
  z-index: 0;
}

.download-container:has(:focus-visible)::before,
.download-container:hover::before {
  content: '';
  width: calc(100% + 76px);
  height: 90px;
  position: absolute;
  top: -11px;
  left: -12px;
  border-radius: var(--scalar-radius-lg);
  box-shadow: var(--scalar-shadow-2);
  pointer-events: none;
  background: var(--scalar-background-1);
}

.download-button {
  color: var(--scalar-link-color);
  cursor: pointer;
  display: flex;
  gap: 4px;
  height: fit-content;
  padding: 0;
  position: relative;
  white-space: nowrap;

  outline: none;
}

.download-button::before {
  border-radius: var(--scalar-radius);
  content: '';
  height: calc(100% + 16px);
  left: -9px;
  position: absolute;
  top: -8px;
  width: calc(100% + 70px);
}

.download-button:hover::before {
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.download-button:focus-visible::before {
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  @apply outline;
}

.download-button span {
  align-items: center;
  color: var(--scalar-link-color);
  display: flex;
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-regular);
  gap: 6px;
  line-height: 1.625;
  z-index: 1;
}

.download-button:hover span {
  text-decoration: var(--scalar-text-decoration-hover);
  text-underline-offset: 2px;
}

/* Second button displayed when hovering over the download container */
.download-button:nth-of-type(2) {
  @apply sr-only;
}

.download-container:has(:focus-visible) .download-button:nth-of-type(2),
.download-container:hover .download-button:nth-of-type(2) {
  @apply not-sr-only;

  position: absolute;
  top: 42px;
}

.extension {
  left: calc(100% + 8px);
  opacity: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}
.download-container:has(:focus-visible) .extension,
.download-container:hover .extension {
  opacity: 1;
}
</style>
