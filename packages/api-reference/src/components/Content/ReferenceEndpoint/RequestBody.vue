<script setup lang="ts">
import type { RequestBody } from '../../../types'
import Schema from '../Schema.vue'

defineProps<{ requestBody?: RequestBody }>()
</script>
<template>
  <div v-if="requestBody && requestBody.content?.['application/json']">
    <div class="request-body-title">
      <slot name="title" />
    </div>
    <div
      v-if="requestBody.content?.['application/json']"
      class="request-body-schema">
      <Schema
        compact
        toggleVisibility
        :value="requestBody.content['application/json'].schema" />
    </div>
  </div>
</template>

<style scoped>
.request-body-title {
  font-size: var(--theme-heading-4, var(--default-theme-heading-4));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  line-height: 1.45;
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
