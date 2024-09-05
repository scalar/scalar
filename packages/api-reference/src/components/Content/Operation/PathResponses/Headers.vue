<script lang="ts" setup>
import { type HttpHeader, httpHeaders } from '#legacy'
import type { OpenAPI } from '@scalar/openapi-types'
import { computed } from 'vue'

import { mapFromObject } from '../../../../helpers'
import {
  SimpleCell,
  SimpleHeader,
  SimpleRow,
  SimpleTable,
} from '../../../SimpleTable'

const props = defineProps<{
  headers: { [key: string]: OpenAPI.HeaderObject }
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
  return headersArray.value.some((header: any) => {
    return header.value.description
  })
})

/** Whether any of the headers has a schema */
const headersHaveSchema = computed(() => {
  return headersArray.value.some((header: any) => {
    return header.value.schema
  })
})

const headersArray = computed(() => {
  return mapFromObject(props.headers, 'name') as {
    name: string
    value: OpenAPI.HeaderObject
  }[]
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
      v-for="{ name, value } in headersArray"
      :key="name">
      <SimpleCell
        :href="getDocumentationUrlForHttpHeader(name)"
        :strong="true"
        :wrap="false">
        {{ formatHeaderName(name) }}
      </SimpleCell>
      <SimpleCell v-if="headersHaveDescription">{{
        value.description
      }}</SimpleCell>
      <SimpleCell v-if="headersHaveSchema">
        <template v-if="'schema' in value">
          <span v-if="value.schema?.example">
            <code class="schema-example">{{ value.schema.example }}</code>
          </span>
          <code
            v-else-if="value.schema?.type"
            class="schema-type">
            {{ value.schema.type }}
          </code>
          <code v-else>
            {{ value.schema }}
          </code>
        </template>
      </SimpleCell>
    </SimpleRow>
  </SimpleTable>
</template>
