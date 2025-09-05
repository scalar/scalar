<script lang="ts">
export type RequestExampleProps = {
  /**
   * List of all http clients formatted into option groups for the client selector
   */
  clientOptions: ClientOptionGroup[]
  /**
   * Pre-selected client, this will determine which client is initially selected in the dropdown
   *
   * @defaults to shell/curl or a custom sample if one is available
   */
  selectedClient?: AvailableClients[number]
  /**
   * Which server from the spec to use for the code example
   */
  selectedServer?: ServerObject | undefined
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
  operation: OperationObject
  /**
   * If true and there's no example, we will display a small card with the method and path only
   */
  fallback?: boolean
  /**
   * A method to generate the label of the block, should return an html string
   */
  generateLabel?: () => string
  /**
   * If true, render this as a webhook request example
   */
  isWebhook?: boolean
}

/**
 * Request Example
 *
 * The core component for rendering a request example block,
 * this component does not have much of its own state but operates on props and custom events
 *
 * @event scalar-update-selected-client - Emitted when the selected client changes
 * @event scalar-update-selected-example - Emitted when the selected example changes
 */
export default {}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarCard,
  ScalarCardFooter,
  ScalarCardHeader,
  ScalarCardSection,
  ScalarCodeBlock,
  ScalarCombobox,
} from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconCaretDown } from '@scalar/icons'
import { operationToHar } from '@scalar/oas-utils/helpers/operation-to-har'
import { type AvailableClients, type TargetId } from '@scalar/snippetz'
import { emitCustomEvent } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId, watch, type ComponentPublicInstance } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import { getResolvedRefDeep } from '@/features/example-responses/helpers/get-resolved-ref-deep'
import { findClient } from '@/v2/blocks/scalar-request-example-block/helpers/find-client'
import { generateCustomId } from '@/v2/blocks/scalar-request-example-block/helpers/generate-client-options'
import { generateCodeSnippet } from '@/v2/blocks/scalar-request-example-block/helpers/generate-code-snippet'
import { getSecrets } from '@/v2/blocks/scalar-request-example-block/helpers/get-secrets'
import type {
  ClientOption,
  ClientOptionGroup,
} from '@/v2/blocks/scalar-request-example-block/types'

import ExamplePicker from './ExamplePicker.vue'

const {
  clientOptions,
  selectedClient,
  selectedServer = { url: '/' },
  selectedContentType,
  selectedExample,
  securitySchemes = [],
  method,
  path,
  operation,
  isWebhook,
  generateLabel,
} = defineProps<RequestExampleProps>()

defineSlots<{
  header: () => unknown
  footer: () => unknown
}>()

/** Grab the examples for the given content type */
const operationExamples = computed(() => {
  const content = getResolvedRef(operation.requestBody)?.content ?? {}
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

  return customCodeKeys.flatMap((key) => operation[key] ?? [])
})

/**
 * Group plugins by target/language to show in a dropdown
 */
const clients = computed(() => {
  // Handle custom code examples
  if (customRequestExamples.value.length) {
    const customClients = customRequestExamples.value.map((sample) => {
      const id = generateCustomId(sample)
      const label = sample.label || sample.lang || id

      return {
        id,
        lang: (sample.lang as TargetId) || 'plaintext',
        title: label,
        label,
      } as ClientOption // We yolo assert this as the other properties are only needed in the top selector
    })

    return [
      {
        label: 'Code Examples',
        options: customClients,
      },
      ...clientOptions,
    ]
  }

  return clientOptions
})

/** The locally selected client which would include code samples from this operation only */
const localSelectedClient = ref<ClientOption>(
  findClient(clients.value, selectedClient) ?? null,
)

/** If the globally selected client changes we can update the local one */
watch(
  () => selectedClient,
  (newClient) => {
    const client = findClient(clients.value, newClient)
    if (client) {
      localSelectedClient.value = client
    }
  },
)

/** Generate HAR data for webhook requests */
const webhookHar = computed(() => {
  if (!isWebhook) return null

  try {
    const selectedExample =
      operationExamples.value[selectedExampleKey.value || '']
    const resolvedExample = getResolvedRefDeep(selectedExample)
    const example = resolvedExample?.value ?? resolvedExample?.summary

    return operationToHar({ operation, method, path, example })
  } catch (error) {
    console.error('[webhookHar]', error)
    return null
  }
})

/** Generate the code snippet for the selected example */
const generatedCode = computed<string>(() => {
  try {
    // Use the selected custom example
    if (localSelectedClient.value?.id.startsWith('custom')) {
      return (
        customRequestExamples.value.find(
          (example) =>
            generateCustomId(example) === localSelectedClient.value?.id,
        )?.source ?? 'Custom example not found'
      )
    }

    const selectedExample =
      operationExamples.value[selectedExampleKey.value || '']
    const resolvedExample = getResolvedRefDeep(selectedExample)
    const example = resolvedExample?.value ?? resolvedExample?.summary

    if (isWebhook) {
      return webhookHar.value?.postData?.text ?? ''
    }

    return generateCodeSnippet({
      clientId: localSelectedClient.value?.id as AvailableClients[number],
      operation,
      method,
      server: selectedServer,
      securitySchemes,
      contentType: selectedContentType,
      path,
      example,
    })
  } catch (error) {
    console.error('[generateSnippet]', error)
    return ''
  }
})

/** The language for the code block, used for syntax highlighting */
const codeBlockLanguage = computed(() => {
  if (isWebhook) {
    return webhookLanguage.value
  }

  return localSelectedClient.value?.lang
})

/** Determine the language for webhook content based on MIME type */
const webhookLanguage = computed<string>(() => {
  if (!webhookHar.value?.postData) return 'json'

  const contentType = webhookHar.value.postData.mimeType
  if (contentType?.includes('json')) return 'json'
  if (contentType?.includes('xml')) return 'xml'
  if (contentType?.includes('yaml') || contentType?.includes('yml'))
    return 'yaml'
  if (contentType?.includes('text/plain')) return 'text'

  return 'json'
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
    emitCustomEvent(elem.value?.$el, 'scalar-update-selected-client', option.id)
  }
}

const id = useId()
</script>
<template>
  <ScalarCard
    v-if="generatedCode"
    ref="elem"
    class="request-card dark-mode">
    <!-- Header -->
    <ScalarCardHeader class="pr-2.5">
      <span class="sr-only">Request Example for</span>
      <HttpMethod
        as="span"
        class="request-method"
        :method="method" />
      <span
        v-if="generateLabel"
        v-html="generateLabel()" />
      <slot
        v-else-if="!isWebhook"
        name="header" />
      <!-- Client picker -->
      <template
        v-if="!isWebhook && clients.length"
        #actions>
        <ScalarCombobox
          class="max-h-80"
          :modelValue="localSelectedClient"
          :options="clients"
          placement="bottom-end"
          teleport
          @update:modelValue="selectClient($event as ClientOption)">
          <ScalarButton
            class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-0.5"
            data-testid="client-picker"
            fullWidth
            variant="ghost">
            <span class="text-base font-normal">{{
              localSelectedClient.title
            }}</span>
            <ScalarIconCaretDown
              class="ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100"
              weight="bold" />
          </ScalarButton>
        </ScalarCombobox>
      </template>
    </ScalarCardHeader>

    <!-- Code snippet -->
    <ScalarCardSection class="request-editor-section custom-scroll p-0">
      <div
        :id="`${id}-example`"
        class="code-snippet">
        <ScalarCodeBlock
          class="bg-b-2 !min-h-full -outline-offset-2"
          :content="generatedCode"
          :hideCredentials="secretCredentials"
          :lang="codeBlockLanguage"
          lineNumbers />
      </div>
    </ScalarCardSection>

    <!-- Footer -->
    <ScalarCardFooter
      v-if="Object.keys(operationExamples).length || $slots.footer"
      class="request-card-footer bg-b-3">
      <!-- Example picker -->
      <div
        v-if="Object.keys(operationExamples).length"
        class="request-card-footer-addon">
        <ExamplePicker
          v-model="selectedExampleKey"
          :examples="operationExamples"
          @update:modelValue="
            emitCustomEvent(elem?.$el, 'scalar-update-selected-example', $event)
          " />
      </div>

      <!-- Footer -->
      <slot name="footer" />
    </ScalarCardFooter>
  </ScalarCard>

  <!-- Fallback card with just method and path in the case of no examples -->
  <ScalarCard
    v-else-if="fallback"
    class="request-card dark-mode">
    <ScalarCardSection class="request-card-simple">
      <div class="request-header">
        <HttpMethod
          as="span"
          class="request-method"
          :method="method" />
        <slot name="header" />
      </div>
      <slot name="footer" />
    </ScalarCardSection>
  </ScalarCard>
</template>
<style scoped>
.request-card {
  font-size: var(--scalar-font-size-3);
}
.request-method {
  font-family: var(--scalar-font-code);
  text-transform: uppercase;
  margin-right: 6px;
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
