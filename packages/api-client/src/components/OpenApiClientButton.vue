<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { makeUrlAbsolute } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

const {
  integration,
  isDevelopment,
  url,
  buttonSource,
  source = 'api-reference',
} = defineProps<{
  buttonSource: 'sidebar' | 'modal'
  source?: 'api-reference' | 'gitbook'
  isDevelopment?: boolean
  integration?: string | null
  url?: string
}>()

/** Link to import an OpenAPI document */
const href = computed((): string | undefined => {
  /**
   * The URL we want to pass to client.scalar.com for the import.
   * Might be an OpenAPI document URL, but could also just be the URL of the API reference.
   */
  const urlToImportFrom =
    url ?? (typeof window !== 'undefined' ? window.location.href : undefined)

  if (!urlToImportFrom) {
    return undefined
  }

  const absoluteUrl = makeUrlAbsolute(urlToImportFrom)

  if (!absoluteUrl?.length) {
    return undefined
  }

  // Base URL
  const link = new URL(
    isDevelopment ? 'http://localhost:5065' : 'https://client.scalar.com',
  )

  // URL that we'd like to import
  link.searchParams.set('url', absoluteUrl)

  // Integration identifier
  if (integration !== null) {
    link.searchParams.set('integration', integration ?? 'vue')
  }

  // UTM Source
  link.searchParams.set('utm_source', 'api-reference')
  link.searchParams.set('utm_medium', 'button')
  link.searchParams.set('utm_campaign', buttonSource)

  // Special for gitbook, set the source and grab the logos (hacky)
  if (source === 'gitbook') {
    link.searchParams.set('utm_source', 'gitbook')

    const darkLogo = document.querySelector("img.dark\\:block[alt='Logo']")
    const lightLogo = document.querySelector("img.dark\\:hidden[alt='Logo']")

    if (darkLogo && darkLogo instanceof HTMLImageElement) {
      link.searchParams.set('dark_logo', encodeURIComponent(darkLogo.src))
    }
    if (lightLogo && lightLogo instanceof HTMLImageElement) {
      link.searchParams.set('light_logo', encodeURIComponent(lightLogo.src))
    }
  }

  return link.toString()
})
</script>

<template>
  <a
    v-if="href"
    class="open-api-client-button"
    :href="href"
    target="_blank">
    <ScalarIcon
      icon="ExternalLink"
      size="xs"
      thickness="2.5" />
    Open API Client
  </a>
</template>

<style scoped>
.open-api-client-button {
  cursor: pointer;
  width: 100%;
  padding: 9px 12px;
  height: 31px;
  display: block;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  line-height: 1.385;
  text-decoration: none;
  border-radius: var(--scalar-radius);
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  gap: 6px;
  color: var(--scalar-sidebar-color-1);
}

.open-api-client-button:hover {
  background: var(
    --scalar-sidebar-item-hover-background,
    var(--scalar-background-2)
  );
}
</style>
