<script lang="ts" setup>
import { computed } from 'vue'

import SvgRenderer from './SvgRenderer'
import { getLocalIcon } from './localIcons'

const props = defineProps<{
  src: string
  title?: string
}>()

const data = computed(() => getLocalIcon(props.src))
</script>
<template>
  <SvgRenderer
    v-if="data"
    :raw="data" />
  <!-- Handle fallback -->
  <img
    v-else
    :alt="title"
    :src="src" />
</template>
