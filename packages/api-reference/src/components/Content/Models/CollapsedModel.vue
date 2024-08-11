<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { ref } from 'vue'

import { useNavState } from '../../../hooks'
import Anchor from '../../Anchor/Anchor.vue'
import { Schema, SchemaHeading } from '../Schema'

defineProps<{ name: string; schemas: Record<string, any> }>()
const { getModelId } = useNavState()

const showCollapsedItems = ref(false)
</script>
<template>
  <div
    :id="getModelId(name)"
    class="collapsed-model"
    :label="name"
    @click="showCollapsedItems = !showCollapsedItems">
    <template v-if="(schemas as any)[name]">
      <div class="collapsed-model-trigger">
        <ScalarIcon
          :icon="showCollapsedItems ? 'ChevronDown' : 'ChevronRight'"
          size="md"
          thickness="1.75" />
        <Anchor :id="getModelId(name)">
          <SchemaHeading
            :name="name"
            :value="(schemas as any)[name]" />
        </Anchor>
      </div>
      <Schema
        v-if="showCollapsedItems"
        :hideHeading="true"
        noncollapsible
        :value="(schemas as any)[name]" />
    </template>
  </div>
</template>
<style scoped>
.collapsed-model {
  padding: 0 0 10px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  position: relative;
}
.collapsed-model:has(+ .show-more) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.collapsed-model .collapsed-model-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-top: 10px;
}
.collapsed-model .collapsed-model-trigger:after {
  content: '';
  height: 10px;
  width: 100%;
  position: absolute;
  bottom: 0;
}
.collapsed-model .schema-card {
  margin-top: 10px;
}
.collapsed-model-trigger svg {
  color: var(--scalar-color-3);
  position: absolute;
  left: -18px;
  margin-top: 1px;
}
.collapsed-model:hover .collapsed-model-trigger svg {
  color: var(--scalar-color-1);
}
</style>
