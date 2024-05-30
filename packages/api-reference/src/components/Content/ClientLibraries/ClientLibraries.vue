<script setup lang="ts">
import { useHttpClientStore } from '../../../stores'
import ClientSelector from './ClientSelector.vue'

const { availableTargets, httpTargetTitle, httpClientTitle } =
  useHttpClientStore()
</script>
<template>
  <div>
    <template v-if="availableTargets.length">
      <div class="client-libraries-heading">Client Libraries</div>
      <div>
        <ClientSelector />
      </div>
      <div
        class="selected-client card-footer"
        muted>
        {{ httpClientTitle }}
        {{ httpTargetTitle }}
      </div>
    </template>
  </div>
</template>
<style scoped>
.selected-client {
  color: var(--scalar-color-1);
  font-size: var(--scalar-mini);
  font-family: var(--scalar-font-code);
  padding: 9px 12px;
  border: 1px solid var(--scalar-border-color);
  border-top: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 12px;
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
}
.client-libraries-heading {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-3);
  text-transform: uppercase;
  margin-bottom: 6px;
  display: block;
}
</style>
