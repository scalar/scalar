<script setup lang="ts">
import { type Components } from '../../types'
import { Card, CardContent, CardHeader } from '../Card'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../Section'
import Schema from './Schema.vue'

const props = defineProps<{
  components?: Components
}>()
</script>
<template>
  <SectionContainer
    v-if="components"
    id="models">
    <Section
      v-for="name in Object.keys(components?.schemas ?? {})"
      :key="name">
      <SectionHeader>
        {{ name }}
      </SectionHeader>
      <SectionContent>
        <Schema :value="components?.schemas?.[name]" />
      </SectionContent>
    </Section>
  </SectionContainer>
</template>
