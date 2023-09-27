<script lang="ts" setup>
import '../base.css'
import { type ThemeId, getThemeById } from '../index'
import '../scrollbar.css'

defineProps<{
  id?: ThemeId
}>()
</script>
<template>
  <component :is="'style'">{{ getThemeById(id) }}</component>
</template>
