<script setup lang="ts">
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarCombobox,
} from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { XCodeSample } from '@scalar/openapi-types/schemas/extensions'
import { type AvailableClients } from '@scalar/snippetz'
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
import { ExamplePicker } from '@/features/example-request'
import { findClient } from '@/v2/blocks/scalar-request-example-block/helpers/find-client'
import {
  generateClientOptions,
  generateCustomId,
} from '@/v2/blocks/scalar-request-example-block/helpers/generate-client-options'
import { generateCodeSnippet } from '@/v2/blocks/scalar-request-example-block/helpers/generate-code-snippet'
import { getSecrets } from '@/v2/blocks/scalar-request-example-block/helpers/get-secrets'
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
   * The security schemes which are applicable to this operation
   */
  securitySchemes?: SecuritySchemeObject[]
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
   * A method to generate the label of the block, should return an html string
   */
  generateLabel?: () => string
  /**
   * Config options for the block
   */
  config?: {
    hideClientSelector?: boolean
  }
}

const {
  allowedClients,
  selectedClient = 'shell/curl',
  selectedServer,
  selectedContentType,
  selectedExample,
  securitySchemes = [],
  method,
  path,
  operation,
  generateLabel,
  config = {
    hideClientSelector: false,
  },
} = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedClient': [id: AvailableClients[number]]
  'update:selectedExample': [name: string]
}>()

defineSlots<{
  header: () => unknown
  footer: () => unknown
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
const selectedExampleKey = ref<string>(
  selectedExample ?? Object.keys(operationExamples.value)[0],
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

/** Generate the code snippet for the selected example */
const generatedCode = computed<string>(() => {
  try {
    // Use the selected custom example
    if (localSelectedClient.value.id.startsWith('custom')) {
      return (
        customRequestExamples.value.find(
          (example) =>
            generateCustomId(example) === localSelectedClient.value.id,
        )?.source ?? 'Custom example not found'
      )
    }

    return generateCodeSnippet({
      clientId: localSelectedClient.value.id as AvailableClients[number],
      operation,
      method,
      server: selectedServer,
      securitySchemes,
      contentType: selectedContentType,
      path,
      example: operationExamples.value[selectedExampleKey.value || ''],
    })
  } catch (error) {
    console.error('[generateSnippet]', error)
    return ''
  }
})

/**  Block secrets from being shown in the code block */
const secretCredentials = computed(() => getSecrets(securitySchemes))

/** Grab the ref to freeze the ui as the clients change so there's no jump as the size of the dom changes */
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
        <span
          v-if="generateLabel"
          v-html="generateLabel()" />
        <slot name="header" />
      </div>

      <!-- Client picker -->
      <template
        #actions
        v-if="!config.hideClientSelector">
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
      v-if="Object.keys(operationExamples).length || $slots.footer"
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

      <!-- Footer -->
      <slot name="footer" />
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
