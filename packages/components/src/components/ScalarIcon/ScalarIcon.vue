<script setup lang="ts">
import { computed } from 'vue'

import SvgRenderer from './SvgRenderer'
import { type Icon, getIcon } from './icons/'

/**
 * Icon wrapper for all scalar icons
 * This icon will expand to fit whatever container its in so make sure to constrain it
 */
const props = defineProps<{
  icon: Icon
}>()

const data = computed(() => getIcon(props.icon))
</script>

<template>
  <SvgRenderer
    v-if="data"
    class="flow-icon"
    height="100%"
    :raw="data"
    width="100%" />
</template>
