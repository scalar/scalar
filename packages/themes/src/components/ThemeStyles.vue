<script lang="ts" setup>
import '../base.css'
import { type ThemeId, getThemeById } from '../index'
import DefaultFonts from './DefaultFonts.vue'

withDefaults(
  defineProps<{
    id?: ThemeId
    withoutDefaultFonts?: boolean
  }>(),
  {
    withoutDefaultFonts: false,
  },
)
</script>
<template>
  <DefaultFonts v-if="!withoutDefaultFonts" />
  <component
    :is="'style'"
    v-if="id !== 'none'">
    {{ getThemeById(id, { layer: 'scalar-theme' }) }}
  </component>
</template>
