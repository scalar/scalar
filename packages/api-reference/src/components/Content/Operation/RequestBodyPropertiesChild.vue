<script setup lang="ts">
import type { ContentProperties } from '../../../types'

defineProps<{ contentProperties: ContentProperties }>()
</script>
<template>
  <li
    v-for="(value, key) in contentProperties"
    :key="key">
    <div class="param-editor">
      <div class="param-editor-flex">
        <span class="parameter-name">{{ key }}</span>
        <span class="parameter-type">{{ value.type }}</span>
      </div>
      <p
        v-if="value.description"
        class="parameter-description">
        {{ value.description }}
      </p>
      <div
        v-if="value.type === 'object'"
        class="parameter-child parameter-child__on">
        <div class="parameter-child-trigger">
          <svg
            fill="currentColor"
            height="14"
            viewBox="0 0 14 14"
            width="14"
            xmlns="http://www.w3.org/2000/svg">
            <polygon
              fill-rule="nonzero"
              points="14 8 8 8 8 14 6 14 6 8 0 8 0 6 6 6 6 0 8 0 8 6 14 6" />
          </svg>
          <span>Child Attributes</span>
        </div>
      </div>
    </div>
  </li>
</template>
