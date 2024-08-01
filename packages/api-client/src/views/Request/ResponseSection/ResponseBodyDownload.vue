<script lang="ts" setup>
import { mediaTypes } from '@/views/Request/consts'
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

const props = defineProps<{
  href: string
  type?: string
}>()

const extension = computed(
  () => mediaTypes[props.type ?? '']?.extension ?? '.unknown',
)
</script>
<template>
  <a
    class="flex gap-1 text-c-3 text-xxs no-underline items-center hover:bg-b-3 rounded py-0.5 px-1.5"
    :download="`response${extension}`"
    :href="href"
    @click.stop>
    <ScalarIcon
      icon="Download"
      size="xs" />
    <span>Download</span>
  </a>
</template>
