<script setup lang="ts">
import { computed } from 'vue'

import SvgRenderer from './SvgRenderer'
import { type Icon, getIcon } from './icons/'

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
    :raw="data" />
</template>
