<script lang="ts" setup>
import '../base.css'
import { type ThemeId, getThemeById } from '../index'

defineProps<{
  id?: ThemeId
}>()
</script>
<template>
  <component
    :is="'style'"
    v-if="id !== 'none'">
    {{ getThemeById(id) }}
  </component>
</template>
