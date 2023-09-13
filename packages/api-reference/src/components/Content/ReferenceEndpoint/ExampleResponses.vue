<script lang="ts" setup>
import { type HttpHeader, httpHeaders } from '@scalar/api-client'
import { useClipboard } from '@scalar/use-clipboard'
import { CodeMirror } from '@scalar/use-codemirror'
import { computed, ref } from 'vue'

import type { TransformedOperation } from '../../../types'
import {
  Card,
  CardContent,
  CardFooter,
  CardTab,
  CardTabHeader,
} from '../../Card'
import { Icon } from '../../Icon'
import {
  SimpleCell,
  SimpleHeader,
  SimpleRow,
  SimpleTable,
} from '../../SimpleTable'

const props = defineProps<{ operation: TransformedOperation }>()

const { copyToClipboard } = useClipboard()

// Bring the status codes in the right order.
const orderedStatusCodes = computed(() => {
  return Object.keys(props?.operation?.responses ?? {}).sort((x) => {
    if (x === 'default') {
      return -1
    }

    return 0
  })
})

// Keep track of the current selected tab
const selectedResponseIndex = ref<number>(0)

// Return the whole response object
const currentResponse = computed(() => {
  const currentStatusCode =
    orderedStatusCodes.value[selectedResponseIndex.value]

  return props.operation.responses?.[currentStatusCode]
})

const currentResponseJsonBody = computed(() => {
  return currentResponse.value?.content?.['application/json']?.body
})

const changeTab = (index: number) => {
  selectedResponseIndex.value = index
}

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
</script>
<template>
  <Card v-if="orderedStatusCodes.length">
    <CardTabHeader
      muted
      @change="changeTab">
      <CardTab
        v-for="statusCode in orderedStatusCodes"
        :key="statusCode">
        {{ statusCode }}
      </CardTab>

      <template #actions>
        <button
          v-if="currentResponseJsonBody"
          class="code-copy"
          type="button"
          @click="() => copyToClipboard(currentResponseJsonBody)">
          <Icon
            src="solid/interface-copy-clipboard"
            width="10px" />
        </button>
      </template>
    </CardTabHeader>
    <CardContent
      v-if="currentResponse.headers"
      muted>
      <SimpleTable>
        <SimpleRow>
          <SimpleHeader>Header</SimpleHeader>
          <SimpleHeader>Description</SimpleHeader>
        </SimpleRow>
        <SimpleRow
          v-for="(data, header) in currentResponse.headers"
          :key="header">
          <SimpleCell
            :href="getDocumentationUrlForHttpHeader(header)"
            :strong="true"
            :wrap="false">
            {{ formatHeaderName(header) }}
          </SimpleCell>
          <SimpleCell>{{ data.description }}</SimpleCell>
        </SimpleRow>
      </SimpleTable>
    </CardContent>
    <CardContent muted>
      <CodeMirror
        v-show="currentResponseJsonBody"
        :content="currentResponseJsonBody"
        :languages="['json']"
        readOnly />
      <div
        v-if="!currentResponseJsonBody"
        class="scalar-api-reference__empty-state">
        No Body
      </div>
    </CardContent>
    <CardFooter
      v-if="currentResponse?.description"
      muted>
      <div class="description">
        {{ currentResponse.description }}
      </div>
    </CardFooter>
  </Card>
</template>

<style scoped>
.code-copy {
  display: flex;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  color: var(--theme-color-3);
  border: none;
}
.code-copy:hover {
  color: var(--theme-color-1);
}
.code-copy svg {
  width: 13px;
  height: 13px;
}
.description {
  font-weight: var(--theme-semibold);
  font-size: var(--theme-micro);
}
.scalar-api-reference__empty-state {
  border: 1px dashed var(--theme-border-color);
  width: 100%;
  text-align: center;
  font-size: var(--theme-micro);
  padding: 20px;
  color: var(--theme-color-2);
}
</style>
