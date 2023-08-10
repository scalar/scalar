<script lang="ts" setup>
import { httpStatusCodes } from '@scalar/api-client'
import { useTooltip } from '@scalar/use-tooltip'
import { computed } from 'vue'

const props = defineProps<{ title: string }>()

const statusText = computed(() => {
  return httpStatusCodes[props.title]?.name ?? null
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
