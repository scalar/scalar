<script lang="ts" setup>
import { type ThemeId, getThemeStyles } from '@scalar/themes'
import { computed } from 'vue'

const props = defineProps<{
  theme?: ThemeId
}>()

const themeStyleTag = computed(
  () => `<style>
  ${getThemeStyles(props.theme ?? 'default', {
    // TODO: Make this configurable
    fonts: true,
  })}</style>`,
)
</script>

<template>
  <div v-html="themeStyleTag"></div>
</template>
