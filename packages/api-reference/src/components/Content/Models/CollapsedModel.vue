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
    :label="name"
    @click="showCollapsedItems = !showCollapsedItems">
    <template v-if="(schemas as any)[name]">
      <ScalarIcon
        :icon="showCollapsedItems ? 'ChevronDown' : 'ChevronRight'"
        size="md"
        thickness="1.75" />
      <Anchor :id="getModelId(name)">
        <SchemaHeading
          :name="name"
          :value="(schemas as any)[name]" />
      </Anchor>
      <Schema
        v-if="showCollapsedItems"
        :hideHeading="true"
        noncollapsible
        :value="(schemas as any)[name]" />
    </template>
  </div>
</template>
