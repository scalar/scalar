<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { computed } from 'vue'

const props = defineProps<{
  integration: string | null
}>()

/** All available framework logos */
const availableIntegrationIcons: Exclude<
  ApiReferenceConfiguration['_integration'],
  null | undefined | 'html'
>[] = [
  'adonisjs',
  'dotnet',
  'elysiajs',
  'express',
  'fastapi',
  'fastify',
  'go',
  'hono',
  'laravel',
  'litestar',
  'nestjs',
  'nextjs',
  'nitro',
  'nuxt',
  'platformatic',
  'react',
  'rust',
  'svelte',
]

/** Icon for the @scalar/api-reference integration the user is coming from */
const integrationIcon = computed(() => {
  const defaultIcon = 'Openapi' as const
  const integration = props.integration?.toLocaleLowerCase()

  if (!integration) {
    return defaultIcon
  }

  const capitalized = integration.charAt(0).toUpperCase() + integration.slice(1)

  return availableIntegrationIcons.includes(integration as any)
    ? (capitalized as Capitalize<(typeof availableIntegrationIcons)[number]>)
    : defaultIcon
})
</script>

<template>
  <ScalarIcon
    class="h-full w-full rounded-lg"
    :logo="integrationIcon" />
</template>
