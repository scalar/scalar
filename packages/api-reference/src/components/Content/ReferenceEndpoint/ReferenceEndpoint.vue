<script setup lang="ts">
import { getOperationSectionId } from '../../../helpers'
import type { Server, Tag, TransformedOperation } from '../../../types'
import {
  Section,
  SectionColumn,
  SectionContent,
  SectionHeader,
} from '../../Section'
import Copy from './Copy.vue'
import ExampleRequest from './ExampleRequest.vue'
import { ExampleResponses } from './ExampleResponses'

defineProps<{
  operation: TransformedOperation
  server: Server
  parentTag: Tag
}>()
</script>
<template>
  <Section :id="getOperationSectionId(operation)">
    <SectionHeader>
      {{ operation.name || operation.path }}
    </SectionHeader>
    <SectionContent withColumns>
      <SectionColumn>
        <Copy
          :operation="operation"
          :parentTag="parentTag" />
      </SectionColumn>
      <SectionColumn>
        <ExampleRequest
          :operation="operation"
          :server="server" />
        <ExampleResponses
          :operation="operation"
          style="margin-top: 12px" />
      </SectionColumn>
    </SectionContent>
  </Section>
</template>
