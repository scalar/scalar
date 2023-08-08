<script setup lang="ts">
import type { BaseParameter } from '../../../types'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{ paths: BaseParameter[] }>()
</script>
<template>
  <CollapsibleSection title="Variables">
    <template v-if="paths.length === 0">
      <div class="scalar-api-client__empty-state">No variables</div>
    </template>
    <template v-else>
      <Grid :items="paths" />
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
