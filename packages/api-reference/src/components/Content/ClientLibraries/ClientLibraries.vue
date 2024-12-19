<script setup lang="ts">
import { useHttpClientStore } from '../../../stores'
import ClientSelector from './ClientSelector.vue'

const { availableTargets, httpTargetTitle, httpClientTitle } =
  useHttpClientStore()
</script>
<template>
  <div v-if="availableTargets.length">
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
  </div>
</template>
<style scoped>
.selected-client {
  color: var(--scalar-color-1);
  font-size: var(--scalar-mini);
  font-family: var(--scalar-font-code);
  padding: 9px 12px;
  border-top: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: var(--scalar-background-1);
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  min-height: fit-content;
}
.client-libraries-heading {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-1);
  padding: 9px 12px;
  background-color: var(--scalar-background-2);
  display: flex;
  align-items: center;
  max-height: 32px;
}
</style>
