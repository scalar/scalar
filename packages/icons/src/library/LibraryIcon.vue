<script setup lang="ts">
import { computed } from 'vue'

import { getLibraryIcon } from './icons'

const props = defineProps<{
  src: string
}>()

const data = computed(() => getLibraryIcon(props.src))
</script>
<template>
  <component
    :is="data"
    v-if="data" />
</template>
