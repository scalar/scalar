<script lang="ts" setup>
import { httpHeaders } from '../../../fixtures'
import { CollapsibleSection } from '../../CollapsibleSection'
import {
  SimpleCell,
  SimpleHeader,
  SimpleRow,
  SimpleTable,
} from '../../SimpleTable'

defineProps<{ headers: Record<string, string>[] }>()

const getDocumentationUrlForHttpHeader = (headerName: string) => {
  return httpHeaders.find((header) => {
    return header.name.toLowerCase() === headerName.toLowerCase()
  })?.url
}

// Make the first letter and all letters after a - uppercase
const formatHeaderName = (headerName: string) => {
  return headerName
    .split('-')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('-')
}
</script>
<template>
  <CollapsibleSection title="Headers">
    <SimpleTable v-if="headers.length > 0">
      <SimpleRow>
        <SimpleHeader>Key</SimpleHeader>
        <SimpleHeader>Value</SimpleHeader>
      </SimpleRow>
      <SimpleRow
        v-for="header in headers"
        :key="header.name">
        <SimpleCell
          :href="getDocumentationUrlForHttpHeader(header.name)"
          :strong="true"
          :wrap="false">
          {{ formatHeaderName(header.name) }}
        </SimpleCell>
        <SimpleCell>{{ header.value }}</SimpleCell>
      </SimpleRow>
    </SimpleTable>
    <template v-else>
      <div class="scalar-api-client__empty-state">No Headers</div>
    </template>
  </CollapsibleSection>
</template>
