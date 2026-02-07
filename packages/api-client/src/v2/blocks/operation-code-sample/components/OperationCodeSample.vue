<script lang="ts">
export type OperationCodeSampleProps = {
  /**
   * Integration type: determines if the code sample is displayed in a client environment
   * or in an API reference environment.
   */
  integration?: 'client' | 'reference'
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
  selectedServer?: ServerObject | null
  /**
   * The selected content type from the requestBody.content, this will determine which examples are available
   * as well as the content type of the code example
   *
   * @defaults to the first content type if not provided
   */
  selectedContentType?: string
  /**
   * Example name to use for resolving example values for parameters AND requestBody
   *
   * @example "limited"
   * ```ts
   * parameters: {
   *   name: 'foobar',
   *   in: 'query',
   *   examples: {
   *     limited: {
   *       dataValue: 10,
   *     }
   *   }
   * },
   * body: {
   *   content: {
   *     'application/json': {
   *       examples: {
   *         limited: {
   *           dataValue: { foo: 'bar' },
   *         }
   *       }
   *     }
   *   }
   * }
   *
   * ```
   */
  selectedExample?: string
  /**
   * Event bus
   */
  eventBus: WorkspaceEventBus
  /**
   * The security schemes which are applicable to this operation
   */
  securitySchemes: SecuritySchemeObjectSecret[]
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
  /**
   * Workspace + document cookies
   */
  globalCookies?: XScalarCookie[]
}

/**
 * Request Example
 *
 * The core component for rendering a request example block,
 * this component does not have much of its own state but operates on props and custom events
 *
 * @event workspace:update:selected-client - Emitted when the selected client changes
 * @event scalar-update-selected-example - removed for now, we can bring it back when we need it
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
  ScalarVirtualText,
} from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconCaretDown } from '@scalar/icons'
import { type AvailableClients } from '@scalar/snippetz'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type {
  OperationObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { operationToHar } from '@v2/blocks/operation-code-sample/helpers/operation-to-har/operation-to-har'
import { computed, ref, useId, watch, type ComponentPublicInstance } from 'vue'

import HttpMethod from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'
import { findClient } from '@/v2/blocks/operation-code-sample/helpers/find-client'
import { getClients } from '@/v2/blocks/operation-code-sample/helpers/get-clients'
import { getCustomCodeSamples } from '@/v2/blocks/operation-code-sample/helpers/get-custom-code-samples'
import { getSecrets } from '@/v2/blocks/operation-code-sample/helpers/get-secrets'
import type {
  ClientOption,
  ClientOptionGroup,
  CustomClientOption,
} from '@/v2/blocks/operation-code-sample/types'
import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

import { generateCodeSnippet } from '../helpers/generate-code-snippet'
import ExamplePicker from './ExamplePicker.vue'

const {
  integration,
  clientOptions,
  selectedClient,
  selectedServer = null,
  selectedContentType,
  selectedExample,
  securitySchemes = [],
  method,
  eventBus,
  path,
  operation,
  isWebhook,
  generateLabel,
  globalCookies,
} = defineProps<OperationCodeSampleProps>()

defineSlots<{
  header: () => unknown
  footer: () => unknown
}>()

/** Grab the examples for the given content type */
const requestBodyExamples = computed(() => {
  const content = getResolvedRef(operation.requestBody)?.content ?? {}
  const contentType = selectedContentType || Object.keys(content)[0]
  if (!contentType) return {}

  const examples = content[contentType]?.examples ?? {}

  return examples
})

/** The currently selected example key */
const selectedExampleKey = ref<string>(
  selectedExample ?? Object.keys(requestBodyExamples.value)[0] ?? '',
)

/** Grab any custom code samples from the operation */
const customCodeSamples = computed(() => getCustomCodeSamples(operation))

/** Merge custom code samples with the client options */
const clients = computed(() =>
  getClients(customCodeSamples.value, clientOptions),
)

/** The locally selected client which would include code samples from this operation only */
const localSelectedClient = ref<ClientOption | CustomClientOption | undefined>(
  findClient(clients.value, selectedClient),
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
    return operationToHar({
      operation,
      method,
      path,
      example: selectedExampleKey.value,
    })
  } catch (error) {
    console.error('[webhookHar]', error)
    return null
  }
})

/** Generate the code snippet for the selected example */
const generatedCode = computed<string>(() => {
  if (isWebhook) {
    return webhookHar.value?.postData?.text ?? ''
  }

  return generateCodeSnippet({
    includeDefaultHeaders: integration === 'client',
    clientId: localSelectedClient.value?.id,
    customCodeSamples: customCodeSamples.value,
    operation,
    method,
    path,
    contentType: selectedContentType,
    server: selectedServer,
    securitySchemes,
    example: selectedExampleKey.value,
    globalCookies,
  })
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
  if (option && !option.id.startsWith('custom')) {
    eventBus.emit('workspace:update:selected-client', option.id)
  }
}

// Virtualize the code block if it's too large
// This prevents the entire app from freezing up if there's a massive example
// We set a lower threshold here as code examples can get quite large
const VIRTUALIZATION_THRESHOLD = 20_000

const shouldVirtualize = computed(
  () => (generatedCode.value.length ?? 0) > VIRTUALIZATION_THRESHOLD,
)

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
      <slot name="header" />
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
            class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-0.5 py-0 text-base font-normal"
            data-testid="client-picker"
            variant="ghost">
            {{ localSelectedClient?.title }}
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
          v-if="!shouldVirtualize"
          class="bg-b-2 h-full"
          :content="generatedCode"
          :hideCredentials="secretCredentials"
          :lang="codeBlockLanguage"
          lineNumbers />
        <ScalarVirtualText
          v-else
          containerClass="custom-scroll scalar-code-block border rounded-b flex flex-1 max-h-screen"
          contentClass="language-plaintext whitespace-pre font-code text-base"
          :lineHeight="20"
          :text="generatedCode" />
      </div>
    </ScalarCardSection>

    <!-- Footer -->
    <ScalarCardFooter
      v-if="Object.keys(requestBodyExamples).length > 1 || $slots.footer"
      class="request-card-footer bg-b-3">
      <!-- Example picker -->
      <div
        v-if="Object.keys(requestBodyExamples).length > 1"
        class="request-card-footer-addon">
        <template v-if="Object.keys(requestBodyExamples).length">
          <ExamplePicker
            v-model="selectedExampleKey"
            :examples="requestBodyExamples" />
        </template>
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
  position: relative;
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
