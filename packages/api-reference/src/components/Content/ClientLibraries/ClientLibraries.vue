<script setup lang="ts">
import { useHttpClientStore } from '../../../stores'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import ClientSelector from './ClientSelector.vue'

const { httpTargetTitle, httpClientTitle } = useHttpClientStore()
</script>
<template>
  <div>
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
  font-size: var(--scalar-small);
  font-family: var(--scalar-font-code);
  padding: 8px 12px;
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
