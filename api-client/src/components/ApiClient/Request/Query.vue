<script setup lang="ts">
import type { Query } from '../../../types'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{ queries: Query[] }>()
</script>
<template>
  <CollapsibleSection title="Query">
    <template v-if="queries.length === 0">
      <span>No Query Parameters</span>
    </template>
    <template v-else>
      <Grid :items="queries" />
      <!-- @addAnother="addQuery"
          @deleteItem="deleteQuery"
          @toggleDescription="toggleDescription"
          @toggleVisibility="(key, value) => updateQuery(key, 'active', value)"
          @updateDescription="(key, value) => updateQuery(key, 'description', value)"
          @updateKey="(key, value) => updateQuery(key, 'key', value)"
          @updateOrder="updateQueryOrder"
          @updateValue="(key, value) => updateQuery(key, 'value', value)" -->
    </template>
  </CollapsibleSection>
</template>
