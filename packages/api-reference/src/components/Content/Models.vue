<script setup lang="ts">
import { getModelSectionId } from '../../helpers'
import { type Components } from '../../types'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../Section'
import Schema from './Schema.vue'

defineProps<{
  components?: Components
}>()
</script>
<template>
  <SectionContainer
    v-if="components"
    id="models">
    <Section
      v-for="name in Object.keys(components?.schemas ?? {})"
      :id="getModelSectionId(name)"
      :key="name">
      <template v-if="components?.schemas?.[name]">
        <SectionHeader>
          {{ name }}
        </SectionHeader>
        <SectionContent>
          <Schema :value="components?.schemas?.[name]" />
        </SectionContent>
      </template>
    </Section>
  </SectionContainer>
</template>
