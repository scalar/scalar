<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import { useLocalization } from '@/features/localization'

import {
  formatAsyncApiBindings,
  isComplexBindingValue,
} from './helpers/format-async-api-bindings'

const { bindings } = defineProps<{
  /** Raw bindings object (server / channel / operation / message). May be a `$ref`. */
  bindings: unknown
}>()

const { translate } = useLocalization()

/** Per-protocol binding groups, with protocol values resolved and flattened to key/value entries. */
const groups = computed(() => formatAsyncApiBindings(bindings))
</script>

<template>
  <div
    v-if="groups.length"
    class="async-api-bindings">
    <div class="async-api-bindings-title">
      {{ translate('asyncapi.bindings') }}
    </div>
    <div
      v-for="group in groups"
      :key="group.protocol"
      class="async-api-binding-group">
      <Badge class="async-api-binding-protocol">{{ group.protocol }}</Badge>
      <dl class="async-api-binding-entries">
        <template
          v-for="entry in group.entries"
          :key="entry.key">
          <dt class="async-api-binding-key">{{ entry.key }}</dt>
          <dd class="async-api-binding-value">
            <ScalarCodeBlock
              v-if="isComplexBindingValue(entry.value)"
              class="async-api-binding-code"
              :content="entry.value as object"
              lang="json" />
            <span v-else>{{ String(entry.value) }}</span>
          </dd>
        </template>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.async-api-bindings {
  margin-top: 12px;
}
.async-api-bindings-title {
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  padding-bottom: 8px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  margin-bottom: 8px;
}
.async-api-binding-group {
  margin-top: 8px;
}
.async-api-binding-protocol {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.async-api-binding-entries {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  margin: 8px 0 0;
}
.async-api-binding-key {
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
}
.async-api-binding-value {
  margin: 0;
  font-size: var(--scalar-small);
  color: var(--scalar-color-1);
  min-width: 0;
}
.async-api-binding-code {
  font-size: var(--scalar-small);
}
</style>
