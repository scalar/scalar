<script lang="ts" setup>
import GitHubSlugger from 'github-slugger'
import { computed } from 'vue'

import Badge from '@/components/Badge/Badge.vue'
import { useConfig } from '@/hooks/useConfig'
import { downloadDocument } from '@/libs/download'

const { title, getOriginalDocument } = defineProps<{
  title?: string
  getOriginalDocument: () => string
}>()

const config = useConfig()

// Format the title to be displayed in the badge.
const slugger = new GitHubSlugger()
const filename = computed(() => slugger.slug(title ?? ''))

// The id is retrieved at the layout level.
const handleDownloadClick = (format: 'json' | 'yaml') => {
  downloadDocument(getOriginalDocument(), filename.value, format)
}
</script>
<template>
  <div
    v-if="['yaml', 'json', 'both'].includes(config?.documentDownloadType)"
    class="download-container group"
    :class="{
      'download-both': config?.documentDownloadType === 'both',
    }">
    <!-- JSON  -->
    <button
      v-if="
        config?.documentDownloadType === 'json' ||
        config?.documentDownloadType === 'both'
      "
      class="download-button"
      type="button"
      @click.prevent="handleDownloadClick('json')">
      <span> Download OpenAPI Document </span>
      <Badge class="extension hidden group-hover:flex">json</Badge>
    </button>

    <!-- YAML -->
    <button
      v-if="
        config?.documentDownloadType === 'yaml' ||
        config?.documentDownloadType === 'both'
      "
      class="download-button"
      type="button"
      @click.prevent="handleDownloadClick('yaml')">
      <span> Download OpenAPI Document </span>
      <Badge class="extension hidden group-hover:flex">yaml</Badge>
    </button>
  </div>
  <template v-else-if="config?.documentDownloadType === 'direct'">
    <a
      v-if="config.url"
      class="download-link"
      :href="config.url">
      Download OpenAPI Document
    </a>
    <a
      v-else
      class="download-link"
      href="#"
      @click.prevent="handleDownloadClick('json')">
      Download OpenAPI Document
    </a>
  </template>
</template>

<style scoped>
@reference '@/style.css';

.download-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 0.5px 8px;
  position: relative;
  width: fit-content;
  z-index: 1;
}

.download-container:has(:focus-visible)::before,
.download-container.download-both:hover::before {
  content: '';
  width: calc(100% + 24px);
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
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: fit-content;
  padding: 0;
  position: relative;
  white-space: nowrap !important;

  outline: none;
}

.download-button::before {
  border-radius: var(--scalar-radius);
  content: '';
  height: calc(100% + 16px);
  left: -9px;
  position: absolute;
  top: -8px;
  width: calc(100% + 18px);
}

.download-button:last-of-type::before {
  width: calc(100% + 15px);
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
  --font-color: var(--scalar-link-color, var(--scalar-color-accent));
  --font-visited: var(--scalar-link-color-visited, var(--scalar-color-2));

  text-decoration: var(--scalar-text-decoration);
  color: var(--font-color);
  font-weight: var(--scalar-link-font-weight, var(--scalar-semibold));
  text-underline-offset: 0.25rem;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(in srgb, var(--font-color) 30%, transparent);
  align-items: center;
  display: flex;
  gap: 6px;
  line-height: 1.625;
  z-index: 1;
}

.download-button:hover span {
  text-decoration-color: var(currentColor, var(--scalar-color-1));
  color: var(--scalar-link-color-hover, var(--scalar-color-accent));
  -webkit-text-decoration: var(--scalar-text-decoration-hover);
  text-decoration: var(--scalar-text-decoration-hover);
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
  z-index: 1;
  background: var(--scalar-link-color, var(--scalar-color-accent));
  color: var(--scalar-background-1);
}
.download-container:has(:focus-visible) .extension,
.download-container:hover .extension {
  opacity: 1;
}

.download-link {
  --font-color: var(--scalar-link-color, var(--scalar-color-accent));
  --font-visited: var(--scalar-link-color-visited, var(--scalar-color-2));

  text-decoration: var(--scalar-text-decoration);
  color: var(--font-color);
  font-weight: var(--scalar-link-font-weight, var(--scalar-semibold));
  text-underline-offset: 0.25rem;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(in srgb, var(--font-color) 30%, transparent);
}

.download-link:hover {
  --font-color: var(--scalar-link-color, var(--scalar-color-accent));
  text-decoration-color: var(--font-color);
}
</style>
