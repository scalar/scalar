<script setup lang="ts">
import type { Parameters } from '../../../types'
import MarkdownRenderer from '../MarkdownRenderer.vue'

defineProps<{ parameter: Parameters }>()
</script>
<template>
  <li>
    <span class="parameter-name">{{ parameter.name }}</span>
    <span
      v-if="parameter.required !== undefined"
      class="parameter-required"
      :class="parameter.required ? 'marc_required' : ''">
      {{ parameter.required ? 'required' : 'optional' }}
    </span>
    <span
      v-if="parameter.schema?.type"
      class="parameter-type">
      {{ parameter.schema?.type }}
    </span>
    <MarkdownRenderer
      v-if="parameter.description"
      class="parameter-description"
      :value="parameter.description" />
  </li>
</template>
