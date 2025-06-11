<script setup lang="ts">
import { getSnippet } from '@scalar/api-client/views/Components/CodeSnippet'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import { ScalarCodeBlock } from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
// TODO: move to the new types
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import {
  AVAILABLE_CLIENTS,
  type AvailableClients,
  type ClientId,
  type TargetId,
} from '@scalar/snippetz'
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/Card'
import ScreenReader from '@/components/ScreenReader.vue'

type Props = {
  /**
   * List of all allowed clients, this will determine which clients are available in the dropdown
   *
   * For the complete list:
   * @see https://github.com/scalar/scalar/blob/main/packages/types/src/snippetz/snippetz.ts#L8
   *
   * @defaults to all available clients + any included custom code examples
   */
  allowedClients?: AvailableClients[number][]
  /**
   * Pre-selected client, this will determine which client is initially selected in the dropdown
   *
   * @defaults to js/fetch or a custom sample if one is available
   */
  selectedClient?: AvailableClients[number]
  /**
   * Which server from the spec to use for the code example
   */
  selectedServer?: OpenAPIV3_1.ServerObject
  /**
   * The selected content type from the requestBody.content, this will determine which examples are available
   * as well as the content type of the code example
   *
   * @defaults to the first content type
   */
  selectedContentType?: string
  /**
   * In case you wish to pre-select an example from the requestBody.content.examples
   */
  selectedExample?: string
  /**
   * The currently selected security schemes which are applicable to this operation
   */
  selectedSecuritySchemes?: OpenAPIV3_1.SecuritySchemeObject[]
  /**
   * The HTTP method of the operation
   */
  method: HttpMethod
  /**
   * The path of the operation
   */
  path: string
  /**
   * The OpenAPI Operation object
   */
  operation: OpenAPIV3_1.OperationObject
  /** Config options for the block */
  config?: {
    hideTestRequestButton?: boolean
    hideClientSelector?: boolean
    generateLabel?: string
  }
}

const {
  allowedClients = AVAILABLE_CLIENTS,
  selectedClient = 'js/fetch',
  selectedServer,
  selectedContentType,
  selectedExample,
  selectedSecuritySchemes,
  method,
  path,
  operation,
  config = {
    hideTestRequestButton: false,
    hideClientSelector: false,
  },
} = defineProps<Props>()

/** Grab any custom code samples from the operation */
const customRequestExamples = computed(() => {
  const customCodeKeys = [
    'x-custom-examples',
    'x-codeSamples',
    'x-code-samples',
  ] as const

  return customCodeKeys.flatMap((key) => operation[key] ?? [])
})

/** The locally selected client which would include code samples from this operation only */
const localSelectedClient = ref<string>(
  customRequestExamples.value[0]?.lang || selectedClient,
)

/** If the globally selected client changes we can update the local one */
watch(
  () => selectedClient,
  (newClient) => {
    localSelectedClient.value = newClient
  },
)

/** Grab the examples for the given content type */
const getOperationExamples = computed(() => {
  const content = operation.requestBody?.content ?? {}
  const contentType = selectedContentType || Object.keys(content)[0]

  return content[contentType]?.examples ?? {}
})

const generateSnippet = () => {
  // Use the selected custom example
  if (localHttpClient.value.targetKey === 'customExamples') {
    return (
      customRequestExamples.value[localHttpClient.value.clientKey]?.source ?? ''
    )
  }

  const clientKey = httpClient.clientKey as ClientId<TargetId>
  const targetKey = httpClient.targetKey

  // TODO: Currently we just grab the first one but we should sync up the store with the example picker
  const example = requestExamples[operation.examples[0]]
  if (!example) {
    return ''
  }

  // Ensure the selected security is in the security requirements
  const schemes = filterSecurityRequirements(
    operation.security || collection.security,
    collection.selectedSecuritySchemeUids,
    securitySchemes,
  )

  const [error, payload] = getSnippet(targetKey, clientKey, {
    operation,
    example,
    server,
    securitySchemes: schemes,
  })
  if (error) {
    return error.message ?? ''
  }
  return payload
}

const generatedCode = computed<string>(() => {
  try {
    return generateSnippet()
  } catch (error) {
    console.error('[generateSnippet]', error)
    return ''
  }
})

/** Code language of the snippet */
const language = computed(() => {
  // const key =
  //   // Specified language
  //   localHttpClient.value?.targetKey === 'customExamples'
  //     ? (customRequestExamples.value[localHttpClient.value.clientKey]?.lang ??
  //       'plaintext')
  //     : // Or language for the globally selected HTTP client
  //       httpClient.targetKey
  // // Normalize language
  // if (key === 'shell' && generatedCode.value.includes('curl')) {
  //   return 'curl'
  // }
  // if (key === 'Objective-C') {
  //   return 'objc'
  // }
  // return key
})

/**  Block secrets from being shown in the code block */
const secretCredentials = computed(
  () => [],
  // Object.values(securitySchemes).flatMap((scheme) => {
  //   if (scheme.type === 'apiKey') {
  //     return scheme.value
  //   }
  //   if (scheme?.type === 'http') {
  //     return [
  //       scheme.token,
  //       scheme.password,
  //       btoa(`${scheme.username}:${scheme.password}`),
  //     ]
  //   }
  //   if (scheme.type === 'oauth2') {
  //     return Object.values(scheme.flows).map((flow) => flow.token)
  //   }

  //   return []
  // }),
)

const elem = ref<ComponentPublicInstance | null>(null)

/** Set custom example, or update the selected HTTP client globally */
const updateHttpClient = (value: string) => {
  const data = JSON.parse(value)
  console.log('updateHttpClient', data)

  // // We need to freeze the ui to prevent scrolling as the clients change
  // if (elem.value) {
  //   const unfreeze = freezeElement(elem.value.$el)
  //   setTimeout(() => {
  //     unfreeze()
  //   }, 300)
  // }

  // // Update to the local example
  // if (data.targetKey === 'customExamples') {
  //   localHttpClient.value = data
  // }
  // // Here we need to handle a special case when we have custom selected and the global doesn't change
  // else if (
  //   localHttpClient.value.targetKey === 'customExamples' &&
  //   data.targetKey === httpClient.targetKey &&
  //   data.clientKey === httpClient.clientKey
  // ) {
  //   localHttpClient.value = data
  // }
  // // Update the global example
  // else {
  //   setHttpClient(data)
  // }
}

/** Update the selected example and the operation ID */
const handleExampleUpdate = (value: string) => {
  console.log('handleExampleUpdate', value)
  // selectedExampleKey.value = value
  // operationId.value = operation.operationId

  // const example = requestExamples[operation.examples[0]]
  // const selectedExample = getExamplesFromOperation.value[value]

  // // Update the example body
  // if (example && selectedExample?.value) {
  //   try {
  //     requestExampleMutators.edit(
  //       example.uid,
  //       'body.raw.value',
  //       JSON.stringify(selectedExample.value, null, 2),
  //     )
  //   } catch (error) {
  //     console.error('[handleExampleUpdate]', error)
  //   }
  // }
}
</script>
<template>
  <Card
    v-if="availableTargets.length || customRequestExamples.length"
    :aria-labelledby="`${id}-header`"
    class="dark-mode"
    ref="elem"
    role="region">
    <!-- Header -->
    <CardHeader muted>
      <div
        :id="`${id}-header`"
        class="request-header">
        <ScreenReader>Request Example for</ScreenReader>
        <HttpMethod
          as="span"
          class="request-method"
          :method="operation.method" />
        <slot name="header" />
      </div>

      <!-- Client picker -->
      <template #actions>
        <!-- <TextSelect
          class="request-client-picker"
          :controls="`${id}-example`"
          :modelValue="JSON.stringify(localHttpClient)"
          :options="options"
          @update:modelValue="updateHttpClient">
          <template v-if="localHttpClient.targetKey === 'customExamples'">
            <ScreenReader>Selected Example:</ScreenReader>
            {{
              customRequestExamples[localHttpClient.clientKey].label ??
              'Example'
            }}
          </template>
          <template v-else>
            <ScreenReader>Selected HTTP client:</ScreenReader>
            {{ httpTargetTitle }}
            {{ httpClientTitle }}
          </template>
        </TextSelect> -->
      </template>
    </CardHeader>
    <CardContent
      borderless
      class="request-editor-section custom-scroll"
      frameless>
      <!-- Multiple examples -->
      <div
        :id="`${id}-example`"
        class="code-snippet">
        <ScalarCodeBlock
          class="bg-b-2 -outline-offset-2"
          :content="generatedCode"
          :hideCredentials="secretCredentials"
          :lang="language"
          lineNumbers />
      </div>
    </CardContent>

    <!-- Footer -->
    <CardFooter
      v-if="hasMultipleExamples || !config.hideTestRequestButton"
      class="request-card-footer"
      contrast>
      <!-- Example picker -->
      <div
        v-if="hasMultipleExamples"
        class="request-card-footer-addon">
        <ExamplePicker
          class="request-example-selector"
          :examples="getExamplesFromOperation"
          :modelValue="selectedExampleKey"
          @update:modelValue="handleExampleUpdate" />
      </div>

      <!-- Test request button -->
      <TestRequestButton
        :operation="operation"
        v-if="!config.hideTestRequestButton" />
    </CardFooter>
  </Card>

  <!-- Fallback card with just method and path in the case of no examples -->
  <Card
    v-else-if="fallback"
    class="dark-mode">
    <CardContent class="request-card-simple">
      <div class="request-header">
        <HttpMethod
          as="span"
          class="request-method"
          :method="operation.method" />
        <slot name="header" />
      </div>
      <slot name="footer" />
    </CardContent>
  </Card>
</template>
<style scoped>
.request {
  display: flex;
  flex-wrap: nowrap;
}
.request-header {
  display: flex;
  gap: 6px;
  text-transform: initial;
}
.request-method {
  font-family: var(--scalar-font-code);
  text-transform: uppercase;
}
.request-client-picker {
  padding-left: 12px;
  padding-right: 9px;
}
.request-card-footer {
  display: flex;
  justify-content: flex-end;
  padding: 6px;
  flex-shrink: 0;
}
.request-card-footer-addon {
  display: flex;
  align-items: center;

  flex: 1;
  min-width: 0;
}
.request-editor-section {
  display: flex;
  flex: 1;
}
.request-card-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 8px 8px 8px 12px;

  font-size: var(--scalar-small);
}
.code-snippet {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
