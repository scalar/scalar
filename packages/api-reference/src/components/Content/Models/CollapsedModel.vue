<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { ref } from 'vue'

import { useNavState } from '../../../hooks'
import { Schema, SchemaHeading } from '../Schema'

defineProps<{ name: string; schemas: Record<string, any> }>()
const { getModelId } = useNavState()

const showCollapsedItems = ref(false)
</script>
<template>
  <div
    :id="getModelId(name)"
    :label="name"
    @click="showCollapsedItems = !showCollapsedItems">
    <template v-if="(schemas as any)[name]">
      <ScalarIcon
        :icon="showCollapsedItems ? 'ChevronDown' : 'ChevronRight'"
        size="md"
        thickness="1.75" />
      <SchemaHeading
        :name="name"
        :value="(schemas as any)[name]" />
      <Schema
        v-if="showCollapsedItems"
        :hideHeading="true"
        noncollapsible
        :value="(schemas as any)[name]" />
      <!-- <SectionContent>
        <SectionHeader :level="2">
          <Anchor :id="getModelId(name)">
            {{ (schemas as any)[name].title ?? name }}
          </Anchor>
        </SectionHeader>
        <Schema
          :name="name"
          noncollapsible
          :value="(schemas as any)[name]" />
      </SectionContent> -->
    </template>
  </div>
</template>
