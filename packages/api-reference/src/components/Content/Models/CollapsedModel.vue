<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { nextTick, ref, watch } from 'vue'

import { scrollToId } from '../../../helpers'
import { useNavState } from '../../../hooks'
import Anchor from '../../Anchor/Anchor.vue'
import { Section } from '../../Section'
import { Schema, SchemaHeading } from '../Schema'

const props = defineProps<{ name: string; schemas: Record<string, any> }>()
const { hash, getModelId } = useNavState()

const showCollapsedItems = ref(false)

watch(
  hash,
  async (id) => {
    if (id === getModelId(props.name) && !showCollapsedItems.value) {
      showCollapsedItems.value = true
      await nextTick()
      scrollToId(getModelId(props.name))
    }
  },
  { immediate: true },
)
</script>
<template>
  <div
    :id="getModelId(name)"
    class="collapsed-model"
    :label="name">
    <template v-if="(schemas as any)[name]">
      <div
        class="collapsed-model-trigger"
        @click="showCollapsedItems = !showCollapsedItems">
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
      <Section
        v-if="showCollapsedItems"
        :id="getModelId(name)"
        class="collapsed-model-section"
        :label="name">
        <Schema
          :hideHeading="true"
          noncollapsible
          :value="(schemas as any)[name]" />
      </Section>
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
  font-size: var(--scalar-font-size-3);
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
.collapsed-model .collapsed-model-trigger :deep(.anchor-copy) {
  line-height: 18.5px;
}
.collapsed-model-section {
  padding: 0;
  margin: 0;
}
</style>
