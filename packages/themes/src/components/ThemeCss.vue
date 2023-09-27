<script lang="ts" setup>
import '@scalar/themes/base.css'
import '@scalar/themes/scrollbar.css'

import { type ThemeId, getThemeById } from '../index'

defineProps<{
  id: ThemeId
}>()
</script>
<template>
  <component :is="'style'">{{ getThemeById(id) }}</component>
</template>
