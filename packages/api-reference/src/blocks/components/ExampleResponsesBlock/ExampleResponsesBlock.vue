<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import type { BlockProps } from '@/blocks/types'

const props = defineProps<BlockProps>()

const { operation } = useBlockProps(props)
</script>

<template>
  <div v-if="operation">
    <h2 class="font-bold">Example Responses</h2>
    {{ operation.responses }}
  </div>
  <div v-else>
    <p>No operation found.</p>
    <p>location: {{ location }}</p>
    <p>store: {{ store }}</p>
  </div>
</template>
