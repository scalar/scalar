<script setup lang="ts">
import { computed } from 'vue'

import { mapFromObject } from '../../helpers'
import { type Components } from '../../types'
import { Card, CardContent, CardHeader } from '../Card'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../Section'

const props = defineProps<{
  components?: Components
}>()

const models = computed(() => mapFromObject(props.components?.schemas))
</script>
<template>
  <SectionContainer
    v-if="components"
    id="models">
    <Section
      v-for="model in models"
      :key="model.key">
      <SectionHeader>
        {{ model.key }}
      </SectionHeader>
      <SectionContent>
        <Card>
          <CardHeader>Schema</CardHeader>
          <CardContent>
            <pre><code>{{ model.value }}</code></pre>
          </CardContent>
        </Card>
      </SectionContent>
    </Section>
  </SectionContainer>
</template>
