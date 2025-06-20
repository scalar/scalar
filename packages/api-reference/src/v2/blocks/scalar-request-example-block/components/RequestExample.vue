<script setup lang="ts">
import { getSnippet } from '@scalar/api-client/views/Components/CodeSnippet'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarCombobox,
} from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { XCodeSample } from '@scalar/openapi-types/schemas/extensions'
import {
  type AvailableClients,
  type ClientId,
  type TargetId,
} from '@scalar/snippetz'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import {
  isReference,
  type Dereference,
} from '@scalar/workspace-store/schemas/v3.1/type-guard'
import { computed, ref, useId, watch, type ComponentPublicInstance } from 'vue'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/Card'
import { HttpMethod } from '@/components/HttpMethod'
import ScreenReader from '@/components/ScreenReader.vue'
import { ExamplePicker } from '@/features/ExampleRequest'
import { TestRequestButton } from '@/features/TestRequestButton'
import { findClient } from '@/v2/blocks/scalar-request-example-block/helpers/find-client'
import {
  generateClientOptions,
  generateCustomId,
} from '@/v2/blocks/scalar-request-example-block/helpers/generate-client-options'
import type { ClientOption } from '@/v2/blocks/scalar-request-example-block/types'

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
  selectedServer?: ServerObject
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
  selectedSecuritySchemes?: SecuritySchemeObject[]
  /**
   * HTTP method of the operation
   */
  method: HttpMethodType
  /**
   * Path of the operation
   */
  path: string
  /**
   * De-referenced OpenAPI Operation object
   */
  operation: Dereference<OperationObject>
  /**
   * If true and there's no example, we will display a small card with the method and path only
   */
  fallback?: boolean
  /**
   * A method to generate the label of the block, defaults to method and path if not provided
   */
  generateLabel?: string
  /**
   * Config options for the block
   */
  config?: {
    hideTestRequestButton?: boolean
    hideClientSelector?: boolean
  }
}

const {
  allowedClients,
  selectedClient = 'shell/curl',
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

const emit = defineEmits<{
  'update:selectedClient': [id: AvailableClients[number]]
}>()

/** Grab the examples for the given content type */
const operationExamples = computed(() => {
  if (isReference(operation.requestBody)) {
    return {}
  }

  const content = operation.requestBody?.content ?? {}
  const contentType = selectedContentType || Object.keys(content)[0]
  const examples = content[contentType]?.examples ?? {}

  return examples
})

/** The currently selected example key */
const selectedExampleKey = ref<string | null>(
  Object.keys(operationExamples.value)[0] ?? null,
)

/** Grab any custom code samples from the operation */
const customRequestExamples = computed(() => {
  const customCodeKeys = [
    'x-custom-examples',
    'x-codeSamples',
    'x-code-samples',
  ] as const

  return customCodeKeys.flatMap(
    (key) => (operation[key] as XCodeSample[]) ?? [],
  )
})

/**
 * Group plugins by target/language to show in a dropdown
 */
const clients = computed(() =>
  generateClientOptions(customRequestExamples.value, allowedClients),
)

/** The locally selected client which would include code samples from this operation only */
const localSelectedClient = ref<ClientOption>(
  findClient(clients.value, selectedClient),
)

/** If the globally selected client changes we can update the local one */
watch(
  () => selectedClient,
  (newClient) => {
    localSelectedClient.value = findClient(clients.value, newClient)
  },
)

/** Generate the code snippet for the selected example OR operation */
const generateSnippet = () => {
  // Use the selected custom example
  if (localSelectedClient.value.id.startsWith('custom')) {
    return (
      customRequestExamples.value.find(
        (example) => generateCustomId(example) === localSelectedClient.value.id,
      )?.source ?? ''
    )
  }

  const clientKey = httpClient.clientKey as ClientId<TargetId>
  const targetKey = httpClient.targetKey

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
const selectClient = (option: ClientOption) => {
  // We need to freeze the ui to prevent scrolling as the clients change
  if (elem.value) {
    const unfreeze = freezeElement(elem.value.$el)
    setTimeout(() => {
      unfreeze()
    }, 300)
  }
  // Update to the local example
  localSelectedClient.value = option

  // Emit the change if it's not a custom example
  if (!option.id.startsWith('custom')) {
    emit('update:selectedClient', option.id as AvailableClients[number])
  }
}

const id = useId()
</script>
<template>
  <Card
    v-if="clients.length"
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
          :method="method" />
        <slot name="header" />
      </div>

      <!-- Client picker -->
      <template #actions>
        <!-- TODO: we need to fix the focus scrolling issue OR just use scalarDropdown -->
        <ScalarCombobox
          class="max-h-80"
          :modelValue="localSelectedClient"
          :options="clients"
          teleport
          placement="bottom-end"
          @update:modelValue="selectClient($event as ClientOption)">
          <ScalarButton
            class="text-c-1 hover:bg-b-3 flex h-full w-fit gap-1.5 px-1.5 py-0.75 font-normal"
            fullWidth
            variant="ghost">
            <span>{{ localSelectedClient.title }}</span>
            <ScalarIconCaretDown />
          </ScalarButton>
        </ScalarCombobox>
      </template>
    </CardHeader>

    <!-- Code snippet -->
    <CardContent
      borderless
      class="request-editor-section custom-scroll"
      frameless>
      <div
        :id="`${id}-example`"
        class="code-snippet">
        <ScalarCodeBlock
          class="bg-b-2 -outline-offset-2"
          :content="generatedCode"
          :hideCredentials="secretCredentials"
          :lang="localSelectedClient.lang"
          lineNumbers />
      </div>
    </CardContent>

    <!-- Footer -->
    <CardFooter
      v-if="
        Object.keys(operationExamples).length || !config.hideTestRequestButton
      "
      class="request-card-footer"
      contrast>
      <!-- Example picker -->
      <div
        v-if="Object.keys(operationExamples).length"
        class="request-card-footer-addon">
        <ExamplePicker
          class="request-example-selector"
          :examples="operationExamples"
          v-model="selectedExampleKey" />
      </div>

      <!-- Open API client -->
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
          :method="method" />
        <slot name="header" />
      </div>
      <slot name="footer" />
    </CardContent>
  </Card>
</template>
<style scoped>
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
