<script setup lang="ts">
import { ref, watchEffect, type Component } from 'vue'

import { getLibraryIcon } from './icons'

const props = defineProps<{
  src: string
}>()

const data = ref<Component>()

watchEffect(async () => {
  data.value = await getLibraryIcon(props.src)
})
</script>
<template>
  <component
    :is="data"
    v-if="data" />
</template>
