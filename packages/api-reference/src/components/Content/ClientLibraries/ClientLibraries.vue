<script setup lang="ts">
import { useHttpClientStore } from '../../../stores'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import ClientSelector from './ClientSelector.vue'

const { httpTargetTitle, httpClientTitle } = useHttpClientStore()
</script>
<template>
  <Card>
    <CardHeader
      borderless
      transparent>
      Client Libraries
    </CardHeader>
    <CardContent
      frameless
      transparent>
      <ClientSelector />
    </CardContent>
    <CardFooter
      class="selected-client card-footer"
      muted>
      {{ httpClientTitle }}
      {{ httpTargetTitle }}
    </CardFooter>
  </Card>
</template>
<style scoped>
.selected-client {
  color: var(--scalar-color-1);
  font-size: var(--scalar-small);
  font-family: var(--scalar-font-code);
  padding: 10px 12px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
