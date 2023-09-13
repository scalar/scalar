<script lang="ts" setup>
import { type HttpHeader, httpHeaders } from '@scalar/api-client'
import { computed } from 'vue'

import { mapFromObject } from '../../../../helpers'
import type { ExampleResponseHeaders } from '../../../../types'
import {
  SimpleCell,
  SimpleHeader,
  SimpleRow,
  SimpleTable,
} from '../../../SimpleTable'

const props = defineProps<{
  headers: ExampleResponseHeaders
}>()

const getDocumentationUrlForHttpHeader = (headerName: string) => {
  return httpHeaders.find((header: HttpHeader) => {
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

const headersHaveDescription = computed(() => {
  const headers = mapFromObject(props.headers)

  return headers.some((header: any) => {
    return header.value.description
  })
})

const headersHaveSchema = computed(() => {
  const headers = mapFromObject(props.headers)

  return headers.some((header: any) => {
    return header.value.schema
  })
})
</script>

<template>
  <SimpleTable>
    <SimpleRow>
      <SimpleHeader>Header</SimpleHeader>
      <SimpleHeader v-if="headersHaveDescription">Description</SimpleHeader>
      <SimpleHeader v-if="headersHaveSchema">Value</SimpleHeader>
    </SimpleRow>
    <SimpleRow
      v-for="(data, header) in headers"
      :key="header">
      <SimpleCell
        :href="getDocumentationUrlForHttpHeader(header)"
        :strong="true"
        :wrap="false">
        {{ formatHeaderName(header) }}
      </SimpleCell>
      <SimpleCell v-if="headersHaveDescription">{{ data }}</SimpleCell>
      <SimpleCell v-if="headersHaveSchema">
        <span v-if="data.schema.example">
          <code class="schema-example">{{ data.schema.example }}</code>
        </span>
        <code
          v-else-if="data.schema.type"
          class="schema-type">
          {{ data.schema.type }}
        </code>
        <code v-else>
          {{ data.schema }}
        </code>
      </SimpleCell>
    </SimpleRow>
  </SimpleTable>
</template>
