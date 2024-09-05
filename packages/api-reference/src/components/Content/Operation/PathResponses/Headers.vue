<script lang="ts" setup>
import { type HttpHeader, httpHeaders, normalizeHeaderName } from '#legacy'
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
  headers: {
    [key: string]: OpenAPI.HeaderObject
  }
}>()

/** The MDN URL for the header */
const getDocumentationUrlForHttpHeader = (headerName: string) =>
  httpHeaders.find(
    (header: HttpHeader) =>
      header.name.toLowerCase() === headerName.toLowerCase(),
  )?.url

/** An easy-to-work-with header array */
const headersArray = computed(
  () =>
    mapFromObject(props.headers, 'name') as {
      name: string
      value: OpenAPI.HeaderObject
    }[],
)

/** Whether any of the headers has a description */
const headersHaveDescription = computed(() =>
  headersArray.value.some((header: any) => header.value.description),
)

/** Whether any of the headers has a schema */
const headersHaveSchema = computed(() =>
  headersArray.value.some((header: any) => header.value.schema),
)
</script>

<template>
  <SimpleTable>
    <!-- Table Header -->
    <SimpleRow>
      <SimpleHeader>Header</SimpleHeader>
      <SimpleHeader v-if="headersHaveDescription">Description</SimpleHeader>
      <SimpleHeader v-if="headersHaveSchema">Value</SimpleHeader>
    </SimpleRow>
    <!-- Table Body -->
    <SimpleRow
      v-for="{ name, value } in headersArray"
      :key="name">
      <!-- Name -->
      <SimpleCell
        :href="getDocumentationUrlForHttpHeader(name)"
        :strong="true"
        :wrap="false">
        {{ normalizeHeaderName(name) }}
      </SimpleCell>
      <!-- Description -->
      <SimpleCell v-if="headersHaveDescription">{{
        value.description
      }}</SimpleCell>
      <!-- Schema -->
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
