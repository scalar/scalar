<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

import { getMediaTypeConfig } from '@/views/Request/consts'

const props = defineProps<{
  href: string
  type?: string
  filename?: string
}>()

const filenameExtension = computed(() => {
  const extension =
    getMediaTypeConfig(props.type ?? '')?.extension ?? '.unknown'
  return props.filename ? props.filename : `response${extension}`
})
</script>
<template>
  <a
    class="text-c-3 text-xxs hover:bg-b-3 flex items-center gap-1 rounded px-1.5 py-0.5 no-underline"
    :download="`${filenameExtension}`"
    :href="href"
    @click.stop>
    <ScalarIcon
      icon="Download"
      size="xs" />
    <span>
      <span>Download</span>
      <span class="sr-only">Response Body</span>
    </span>
  </a>
</template>
