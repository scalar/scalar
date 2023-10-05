<script setup lang="ts">
import { CollapsibleSection } from '../../CollapsibleSection'
// import Copilot from './Copilot.vue'
import { SimpleGrid } from '../../Grid'

defineProps<{
  cookies?: { name: string; value: string }[]
}>()
</script>
<template>
  <CollapsibleSection title="Cookies">
    <SimpleGrid
      v-if="cookies && cookies.length > 0"
      :items="cookies" />
    <template v-if="!cookies || cookies.length === 0">
      <div class="scalar-api-client__empty-state">No Cookies</div>
    </template>
  </CollapsibleSection>
</template>
