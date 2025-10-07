<script setup lang="ts">
import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { ScalarIconWebhooksLogo } from '@scalar/icons'

import HttpMethod from './HttpMethod.vue'

defineProps<{
  method: string
  active?: boolean
  webhook?: boolean
}>()
</script>
<template>
  <div>
    &hairsp;
    <span class="sr-only">HTTP Method:&nbsp;</span>
    <HttpMethod
      :class="[
        'sidebar-heading-type',
        `sidebar-heading-type--${method.toLowerCase()}`,
        { 'sidebar-heading-type-active': active },
      ]"
      :method="method"
      property="--method-color"
      short>
      <slot>
        <ScalarIconWebhooksLogo
          v-if="webhook"
          :style="{
            color: getHttpMethodInfo(method).colorVar,
          }"
          weight="bold" />
      </slot>
    </HttpMethod>
  </div>
</template>

<style scoped>
.sidebar-heading-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  line-height: 14px;
  flex-shrink: 0;
  text-transform: uppercase;
  color: var(--method-color, var(--scalar-color-1));
  font-size: 10px;
  font-weight: var(--scalar-bold);
  font-family: var(--scalar-font-code);
  white-space: nowrap;
}
</style>
