<script lang="ts" setup>
import '../base.css'
import { type ThemeId, getThemeById } from '../index'
import '../scrollbar.css'

defineProps<{
  id?: ThemeId | 'none'
}>()
</script>
<template>
  <component
    :is="'style'"
    v-if="id !== 'none'">
    {{ getThemeById(id) }}
  </component>
</template>
