<script setup lang="ts">
import { useHttpClientStore } from '../../../stores'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import ClientSelector from './ClientSelector.vue'

const { httpClient, getClientTitle, getTargetTitle } = useHttpClientStore()
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
      {{ getTargetTitle(httpClient) }}
      {{ getClientTitle(httpClient) }}
    </CardFooter>
  </Card>
</template>
<style scoped>
.selected-client {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-small, var(--default-theme-small));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  padding: 10px 12px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
