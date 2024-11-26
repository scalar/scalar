<script setup lang="ts">
import type { ContentProperties } from '@/types'
import { ScalarIcon } from '@scalar/components'

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
          <ScalarIcon
            icon="Add"
            size="sm" />
          <span>Child Attributes</span>
        </div>
      </div>
    </div>
  </li>
</template>
