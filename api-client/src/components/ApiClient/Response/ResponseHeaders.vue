<script lang="ts" setup>
// import httpHeaders from '../../../fixtures/httpHeaders.json'
import { CollapsibleSection } from '../../CollapsibleSection'
import { SimpleGrid } from '../../Grid'

defineProps<{ headers: Record<string, string>[] }>()
</script>
<template>
  <CollapsibleSection title="Headers">
    <SimpleGrid
      v-show="headers.length > 0"
      :items="headers" />
    <template v-if="headers.length === 0">
      <pre>No headers</pre>
    </template>
  </CollapsibleSection>
</template>
