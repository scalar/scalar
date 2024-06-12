<script setup lang="ts">
import type { Spec } from '@scalar/oas-utils'
import { onMounted, ref, toRaw } from 'vue'

const props = defineProps<{
  parsedSpec: Spec
  proxyUrl?: string
}>()

console.log(props.parsedSpec)
console.log(props.proxyUrl)

const el = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  if (!el.value) return

  const { createScalarClient } = await import('@scalar/api-client-modal')
  const { open } = await createScalarClient(el.value, {
    // TODO need @hans to figure out why this gives an error
    // parsedSpec: toRaw(props.parsedSpec),
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    },
    proxyUrl: props.proxyUrl,
  })

  open()
})
</script>
<template>
  <div ref="el" />
</template>
