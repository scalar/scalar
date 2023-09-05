<script lang="ts" setup>
import { CodeMirror } from '@scalar/use-codemirror'

import { CollapsibleSection } from '../../CollapsibleSection'

withDefaults(defineProps<{ active: boolean; data: any }>(), {
  active: false,
  data: null,
})
</script>
<template>
  <CollapsibleSection title="Body">
    <CodeMirror
      v-if="active"
      :content="data"
      :languages="['json']"
      read-only />
    <div
      v-else
      class="scalar-api-client__empty-state">
      No Response
    </div>
  </CollapsibleSection>
</template>
