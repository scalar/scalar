<script lang="ts" setup>
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
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

const currentResponseExamples = computed(() => {
  const examples =
    currentResponse.value?.content?.['application/json']?.examples

  if (examples) {
    return JSON.parse(examples)
  }

  return false
})

const currentResponseExample = computed(() => {
  return currentResponse.value?.content?.['application/json']?.example
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

const mapFromObject = (object: Record<string, any>) => {
  return Object.keys(object).map((key) => {
    return {
      key,
      value: object[key],
    }
  })
}

const headersHaveDescription = computed(() => {
  const headers = mapFromObject(currentResponse.value.headers)

  return headers.some((header: any) => {
    return header.value.description
  })
})

const headersHaveSchema = computed(() => {
  const headers = mapFromObject(currentResponse.value.headers)

  return headers.some((header: any) => {
    return header.value.schema
  })
})
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
          v-if="currentResponseExample"
          class="code-copy"
          type="button"
          @click="() => copyToClipboard(currentResponseExample)">
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
          <SimpleHeader v-if="headersHaveDescription">Description</SimpleHeader>
          <SimpleHeader v-if="headersHaveSchema">Schema</SimpleHeader>
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
          <SimpleCell v-if="headersHaveDescription">{{ data }}</SimpleCell>
          <SimpleCell v-if="headersHaveSchema">
            <span v-if="data.schema.example">
              <code class="schema-example">{{ data.schema.example }}</code>
            </span>
            <code
              class="schema-type"
              v-else-if="data.schema.type">
              {{ data.schema.type }}
            </code>
            <code v-else>
              {{ data.schema }}
            </code>
          </SimpleCell>
        </SimpleRow>
      </SimpleTable>
    </CardContent>
    <CardContent muted>
      <template v-if="currentResponseExamples">
        <TabGroup vertical>
          <TabList>
            <Tab
              v-for="exampleId in Object.keys(currentResponseExamples)"
              :key="exampleId"
              class="example-response-tab"
              >{{
                currentResponseExamples[exampleId].summary ?? exampleId
              }}</Tab
            >
          </TabList>
          <TabPanels>
            <TabPanel
              v-for="exampleId in Object.keys(currentResponseExamples)"
              :key="exampleId">
              <CodeMirror
                :content="
                  JSON.stringify(
                    currentResponseExamples[exampleId].value,
                    null,
                    2,
                  )
                "
                :languages="['json']"
                readOnly />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </template>
      <template v-else>
        <CodeMirror
          v-show="currentResponseExample"
          :content="currentResponseExample"
          :languages="['json']"
          readOnly />
        <div
          v-if="!currentResponseExample"
          class="scalar-api-reference__empty-state">
          No Body
        </div>
      </template>
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

.schema-type {
  font-size: var(--theme-micro);
  color: var(--theme-color-2);
  font-weight: var(--theme-semibold);
  background: var(--theme-background-3);
  padding: 2px 4px;
  border-radius: 4px;
  margin-right: 4px;
}
.schema-example {
  font-size: var(--theme-micro);
  color: var(--theme-color-2);
  font-weight: var(--theme-semibold);
}

.example-response-tab {
  display: block;
  margin: 6px;
}
</style>
