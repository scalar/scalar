<script setup lang="ts">
import { CodeExample } from '@scalar/blocks/code-example'
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import type {
  OpenApiDocument,
  OperationObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, provide, ref, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import { LinkList } from '@/components/LinkList'
import OperationPath from '@/components/OperationPath.vue'
import { Section, SectionContent, SectionHeaderTag } from '@/components/Section'
import AskAgentButton from '@/features/ask-agent-button/AskAgentButton.vue'
import { ExampleResponses } from '@/features/example-responses'
import { ExternalDocs } from '@/features/external-docs'
import { useLocalization } from '@/features/localization'
import Callbacks from '@/features/Operation/components/callbacks/Callbacks.vue'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import OperationScopes from '@/features/Operation/components/OperationScopes.vue'
import SecurityRequirementBadge from '@/features/Operation/components/SecurityRequirementBadge.vue'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@/features/Operation/helpers/operation-stability'
import type { OperationProps } from '@/features/Operation/Operation.vue'
import {
  REQUEST_BODY_COMPOSITION_INDEX_SYMBOL,
  type RequestBodyCompositionSelection,
} from '@/features/Operation/request-body-composition-index'
import { getXKeysFromObject } from '@/features/specification-extension'
import SpecificationExtension from '@/features/specification-extension/SpecificationExtension.vue'
import { TestRequestButton } from '@/features/test-request-button'
import { XBadges } from '@/features/x-badges'

const {
  clientOptions,
  document,
  eventBus,
  isWebhook,
  method,
  operation,
  options,
  path,
  requiredSecurity,
  selectedServer,
  selectedSecuritySchemes,
  selectedClient,
  selectedExample,
} = defineProps<
  Omit<
    OperationProps,
    | 'document'
    | 'pathValue'
    | 'server'
    | 'isCollapsed'
    | 'securitySchemes'
    | 'authStore'
  > & {
    /** Operation object with path params */
    operation: OperationObject
    /** The selected server for the operation */
    selectedServer: ServerObject | null
    /** The selected security schemes for the operation */
    selectedSecuritySchemes: SecuritySchemeObjectSecret[]
    /** Required/optional security state for the badge next to the path */
    requiredSecurity: RequiredSecurity
    /** The document the operation belongs to, used to resolve schema references for display */
    document?: OpenApiDocument
  }
>()
const { translate } = useLocalization()

const operationTitle = computed(() => operation.summary || path || '')

const labelId = useId()

const operationExtensions = computed(() => getXKeysFromObject(operation))

/** Track the selected request body content type so the code sample stays in sync */
const selectedRequestBodyContentType = ref<string | undefined>()

/** Selected request body oneOf/anyOf variants; synced with schema dropdowns and code sample */
const requestBodyCompositionSelection = ref<RequestBodyCompositionSelection>({})

const requestBodyCompositionSelectionForCodeSample = computed(
  (): RequestBodyCompositionSelection => ({
    ...requestBodyCompositionSelection.value,
  }),
)

const requestBodyCompositionSelectionKey = computed(() =>
  JSON.stringify(requestBodyCompositionSelectionForCodeSample.value),
)

provide(REQUEST_BODY_COMPOSITION_INDEX_SYMBOL, requestBodyCompositionSelection)
</script>

<template>
  <Section
    :id="id"
    :aria-labelledby="labelId"
    :label="operationTitle"
    tabindex="-1"
    @intersecting="() => eventBus?.emit('intersecting:nav-item', { id })">
    <SectionContent>
      <!-- Badges -->
      <div class="flex flex-row justify-between gap-1">
        <!-- Left -->
        <div class="flex gap-1">
          <!-- Operation ID -->
          <Badge v-if="options?.showOperationId && operation.operationId">
            {{ operation.operationId }}
          </Badge>
          <!-- Stability badge -->
          <Badge
            v-if="getOperationStability(operation)"
            class="capitalize"
            :class="getOperationStabilityColor(operation)">
            {{ getOperationStability(operation) }}
          </Badge>
          <!-- Webhook badge -->
          <Badge
            v-if="isWebhook"
            class="font-code text-green flex w-fit items-center justify-center gap-1">
            <ScalarIconWebhooksLogo weight="bold" />
            {{ translate('operation.webhook') }}
          </Badge>
          <!-- x-badges before -->
          <XBadges
            :badges="operation['x-badges']"
            position="before" />
        </div>
        <!-- Right -->
        <div class="flex gap-1">
          <!-- x-badges after -->
          <XBadges
            :badges="operation['x-badges']"
            position="after" />
        </div>
      </div>
      <div class="operation-layout">
        <!-- Title -->
        <div
          class="operation-title"
          :class="isOperationDeprecated(operation) && 'deprecated'">
          <Anchor
            @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })">
            <SectionHeaderTag
              :id="labelId"
              :level="3">
              {{ operationTitle }}
            </SectionHeaderTag>
          </Anchor>
        </div>

        <!-- Required auth badge -->
        <div class="operation-auth">
          <SecurityRequirementBadge :requiredSecurity />
        </div>

        <!-- Description -->
        <div class="operation-description">
          <SpecificationExtension :value="operationExtensions" />
          <ScalarMarkdown
            :anchorPrefix="id"
            :aria-label="translate('common.description')"
            role="group"
            transformType="heading"
            :value="operation.description"
            withAnchors
            withImages />
        </div>

        <!--
          Parameters, request body, responses and callbacks.

          This block is kept before the examples in source order on purpose: the
          request body schema (via SchemaComposition) seeds the shared
          requestBodyCompositionSelection on mount, which drives the
          CodeExample's :key. Mounting the details first means the code
          sample reads the final key on its first render and is never remounted —
          a remount would reset the selected client and tear down an open client
          picker. The grid (see grid-template-areas below) still paints the
          examples on the right, independent of this source order.
        -->
        <div class="operation-details">
          <OperationScopes :requiredSecurity />
          <OperationParameters
            v-model:selectedContentType="selectedRequestBodyContentType"
            :breadcrumb="[id]"
            :document
            :eventBus
            :options
            :parameters="operation.parameters"
            :requestBody="getResolvedRef(operation.requestBody)" />
          <OperationResponses
            :breadcrumb="[id]"
            :collapsableItems="!options.expandAllResponses"
            :document
            :eventBus
            :options
            :responses="operation.responses" />

          <!-- Callbacks -->
          <ScalarErrorBoundary>
            <Callbacks
              v-if="operation.callbacks"
              :callbacks="operation.callbacks"
              class="mt-6"
              :document
              :eventBus
              :options
              :path />
          </ScalarErrorBoundary>
        </div>

        <!-- Example request and responses -->
        <div class="examples">
          <!-- External Docs -->
          <LinkList v-if="operation.externalDocs">
            <ExternalDocs :value="operation.externalDocs" />
          </LinkList>

          <!-- New Example Request -->
          <ScalarErrorBoundary>
            <CodeExample
              :key="requestBodyCompositionSelectionKey"
              :clientOptions
              :eventBus
              fallback
              :isWebhook
              :method
              :operation
              :path
              :requestBodyCompositionSelection="
                requestBodyCompositionSelectionForCodeSample
              "
              :securitySchemes="selectedSecuritySchemes"
              :selectedClient
              :selectedContentType="selectedRequestBodyContentType"
              :selectedExample
              :selectedServer>
              <template #header>
                <OperationPath
                  class="font-code text-c-2 [&_em]:text-c-1 min-w-0 [&_em]:not-italic"
                  :deprecated="operation?.deprecated"
                  :path="path" />
              </template>
              <template
                v-if="!isWebhook"
                #footer="{ exampleName }">
                <div class="flex">
                  <AskAgentButton />
                  <TestRequestButton
                    v-if="!options.hideTestRequestButton"
                    :id
                    :eventBus
                    :exampleName
                    :method
                    :path
                    :requestBodyCompositionSelection="
                      requestBodyCompositionSelectionForCodeSample
                    " />
                </div>
              </template>
            </CodeExample>
          </ScalarErrorBoundary>

          <ScalarErrorBoundary>
            <ExampleResponses
              v-if="operation.responses"
              :eventBus
              :responses="operation.responses"
              :selectedExample
              style="margin-top: 12px" />
          </ScalarErrorBoundary>
        </div>
      </div>
    </SectionContent>
  </Section>
</template>

<style scoped>
/*
 * The operation is a single grid so the request example can sit beside the
 * details on wide screens, then be lifted directly under the description when
 * the layout collapses (see the container query below). Vertical rhythm comes
 * from element margins rather than row-gap, because the details block carries
 * its own leading margin (mt-6) that already spaces it from whatever precedes
 * it — a row-gap would double that gap.
 */
.operation-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto 1fr;
  grid-template-areas:
    'heading     badge'
    'description examples'
    'details     examples';
  column-gap: 48px;
  row-gap: 0;
}

.operation-title {
  grid-area: heading;
  margin-bottom: 12px;

  /* Mirror the shared section header typography (see SectionHeader.vue) */
  font-size: var(--font-size, var(--scalar-heading-1));
  font-weight: var(--font-weight, var(--scalar-bold));
  color: var(--scalar-color-1);
  line-height: 1.45;
}

.operation-auth {
  grid-area: badge;
  justify-self: end;
  align-self: start;
}

.operation-description {
  grid-area: description;
  min-width: 0;
}

.operation-details {
  grid-area: details;
  min-width: 0;
}

.examples {
  grid-area: examples;
  align-self: start;
  min-width: 0;

  position: sticky;
  top: calc(var(--refs-viewport-offset) + 24px);
}

.examples > * {
  max-height: calc((var(--refs-viewport-height) - 60px) / 2);
  position: relative;
}

.examples > *:first-of-type:last-of-type {
  max-height: calc((var(--refs-viewport-height) - 60px));
}

/*
 * Don't constrain card height on mobile
 * (or zoomed in screens)
 */
@media (max-width: 600px) {
  .examples > * {
    max-height: unset;
  }
}

.deprecated * {
  text-decoration: line-through;
}

/*
 * On narrow containers the layout collapses to a single column: the request
 * example is lifted directly under the description, and the auth badge becomes
 * an eyebrow above the title.
 */
@container narrow-references-container (max-width: 900px) {
  .operation-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'badge'
      'heading'
      'description'
      'examples'
      'details';
    column-gap: 0;
  }

  .operation-auth {
    justify-self: start;
    margin-bottom: 4px;
  }

  .operation-title {
    margin-bottom: 24px;
  }

  .operation-description {
    margin-bottom: 24px;
  }

  /* Don't make the examples sticky on narrow viewports */
  .examples {
    position: static;
  }
}
</style>
