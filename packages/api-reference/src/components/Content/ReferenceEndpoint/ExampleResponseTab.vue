<script lang="ts" setup>
import { useTooltip } from '@anc/library'
import { httpStatusCodes } from '@scalar/api-client'
import { computed } from 'vue'

const props = defineProps<{ title: string }>()

const statusText = computed(() => {
  return httpStatusCodes[props.title].name ?? null
})

const tooltipRef = useTooltip({
  content: statusText.value,
})
</script>
<template>
  <span
    ref="tooltipRef"
    class="codemenu-item-key">
    {{ title }}
  </span>
</template>
