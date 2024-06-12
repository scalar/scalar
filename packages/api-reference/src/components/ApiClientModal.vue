<script setup lang="ts">
import type { Spec } from '@scalar/oas-utils'
import { onMounted, ref } from 'vue'

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
  const resp = createScalarClient(el.value, {})
  console.log(resp)
})
</script>
<template>
  <div ref="el" />
</template>
