<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import type { BlockProps } from '@/blocks/types'
import { ExampleResponses } from '@/features/ExampleResponses'

const props = defineProps<BlockProps>()

const { operation } = useBlockProps(props)
</script>

<template>
  <ExampleResponses
    v-if="operation"
    :responses="operation.responses" />
</template>
