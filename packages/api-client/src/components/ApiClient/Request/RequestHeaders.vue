<script setup lang="ts">
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{ headers?: any[] }>()
</script>
<template>
  <CollapsibleSection title="Headers">
    <template v-if="!headers || headers.length === 0">
      <div class="scalar-api-client__empty-state">No Headers</div>
    </template>
    <template v-else>
      <Grid :items="headers" />
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
