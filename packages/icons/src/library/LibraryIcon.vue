<script setup lang="ts">
import { shallowRef, watchEffect, type Component } from 'vue'

import { getLibraryIcon } from './icons'

const props = defineProps<{
  src: string
}>()

const data = shallowRef<Component>()

watchEffect(async () => {
  data.value = await getLibraryIcon(props.src)
})
</script>
<template>
  <component
    :is="data"
    v-if="data" />
</template>
