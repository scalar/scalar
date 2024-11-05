<script lang="ts" setup>
import { mediaTypes } from '@/views/Request/consts'
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

const props = defineProps<{
  href: string
  type?: string
  filename?: string
}>()

const filenameExtension = computed(() => {
  const extension = mediaTypes[props.type ?? '']?.extension ?? '.unknown'
  return props.filename ? props.filename : `response${extension}`
})
</script>
<template>
  <a
    class="flex gap-1 text-c-3 text-xxs no-underline items-center hover:bg-b-3 rounded py-0.5 px-1.5"
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
