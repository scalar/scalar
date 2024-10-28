<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { makeUrlAbsolute } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

const { integration, isDevelopment, url } = defineProps<{
  isDevelopment?: boolean
  integration?: string | null | undefined
  url?: string | undefined
}>()

/** Link to import an OpenAPI document */
const href = computed(() => {
  const link = new URL(
    isDevelopment ? 'http://localhost:5065' : 'https://client.scalar.com',
  )

  const absoluteUrl = makeUrlAbsolute(url)
  if (absoluteUrl?.length) link.searchParams.set('url', absoluteUrl)

  // Default integration to vue if not explicitly null
  if (integration !== null)
    link.searchParams.set('integration', integration ?? 'vue')

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
  width: 100%;
  padding: 9px 12px;
  height: 31px;
  display: block;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
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
