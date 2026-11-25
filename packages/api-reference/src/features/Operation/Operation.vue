<script lang="ts">
/**
 * References Operation "block"
 */
export default {}

export type OperationProps = {
  id: string
  method: string
  /** The subset of the configuration object required for the operation component */
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'baseServerURL'
    | 'servers'
    | 'expandAllParameters'
    | 'expandAllResponses'
    | 'hideModels'
    | 'hideModelNames'
    | 'hideTestRequestButton'
    | 'layout'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'maxVisibleRequestBodyProperties'
    | 'schemaKeyboardNav'
    | 'showOperationId'
    | 'multipartNaming'
    | 'showExtensions'
  >
  /** Document object */
  document: OpenApiDocument
  /** Key of the operations path in the document.paths object */
  path: string
  /** OpenAPI path object that will include the operation */
  pathValue: PathItemObject | undefined
  /** Currently selected server for the document */
  server: ServerObject | null
  /** Current client state for the path item's server selections and variable values. */
  serverPathValue?: NodeInput<PathItemObject>
  /** The merged security schemes for the document and the authentication configuration */
  securitySchemes: MergedSecuritySchemes
  /** The http client options for the dropdown */
  clientOptions: ClientOptionGroup[]
  /** Whether the Classic layout operation is collapsed */
  isCollapsed: boolean
  /** Whether the operation is a webhook */
  isWebhook: boolean
  /** The currently selected client for the document */
  selectedClient: WorkspaceStore['workspace']['x-scalar-default-client']
  /** The currently selected example key, shared across operations for in-sync example pickers */
  selectedExample: WorkspaceStore['workspace']['x-scalar-default-example']
  /** The event bus */
  eventBus: WorkspaceEventBus
  /** The auth store */
  authStore: AuthStore
}
</script>

<script lang="ts" setup>
import type { ClientOptionGroup } from '@scalar/blocks/code-example'
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getPathItemOperation,
  getPathItemServerTarget,
} from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import {
  getResolvedRef,
  type NodeInput,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  combineParams,
  getOperationServerScope,
  prepareServerSelection,
  type MergedSecuritySchemes,
} from '@scalar/workspace-store/request-example'
import type {
  OpenApiDocument,
  PathItemObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import { filterSelectedSecurity } from '@/features/Operation/helpers/filter-selected-security'
import { SpecificationExtension } from '@/features/specification-extension'

import {
  getRequiredSecurity,
  type RequiredSecurity,
} from './helpers/get-required-security'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  specificationExtension = SpecificationExtension,
  authStore,
  clientOptions,
  document,
  eventBus,
  isCollapsed,
  isWebhook,
  method,
  options,
  path,
  pathValue,
  securitySchemes,
  server,
  serverPathValue,
} = defineProps<OperationProps & SchemaRenderingProps>()

defineSlots<{
  /** Replaces the default copy control without replacing the security badge. */
  actions?: () => unknown
}>()

/**
 * Operation from the new workspace store, ensure we are de-reference
 *
 * Also adds in params from the pathItemObject
 */
const operation = computed(() => {
  const entity = getResolvedRef(getPathItemOperation(pathValue, method))

  if (!entity) {
    return null
  }

  // Combine params from the pathItem and the operation
  const parameters = combineParams(pathValue?.parameters, entity.parameters)
  return { ...entity, parameters }
})

/**
 * Determine the effective server for the code examples.
 */
const selectedServer = computed<ServerObject | null>(() => {
  if (isWebhook) {
    return null
  }

  const scope = getOperationServerScope({
    configuredServers: options.servers,
    pathItem: getPathItemServerTarget(serverPathValue ?? pathValue),
    operation: serverPathValue
      ? getResolvedRef(getPathItemOperation(serverPathValue, method))
      : operation.value,
  })
  if (scope.type === 'document') {
    return server
  }

  return prepareServerSelection(scope.target, {
    baseServerUrl: options.baseServerURL,
    documentUrl: document['x-scalar-original-source-url'],
  })
})

const requiredSecurity = computed<RequiredSecurity>(() =>
  getRequiredSecurity(operation.value, document),
)

/** We must ensure the selected security schemes are required on this operation */
const selectedSecuritySchemes = computed(() =>
  filterSelectedSecurity(
    document,
    operation.value,
    authStore.getAuthSelectedSchemas({
      type: 'document',
      documentName: document?.['x-scalar-navigation']?.name ?? '',
    }),
    authStore.getAuthSelectedSchemas({
      type: 'operation',
      documentName: document?.['x-scalar-navigation']?.name ?? '',
      path,
      method,
    }),
    securitySchemes,
  ),
)
</script>

<template>
  <template v-if="operation">
    <ClassicLayout
      v-if="options.layout === 'classic'"
      :id
      :clientOptions
      :document
      :eventBus
      :expansion="expansion"
      :isCollapsed
      :isWebhook
      :method
      :operation
      :options
      :path
      :pathValue
      :requiredSecurity
      :scrollTargetId="scrollTargetId"
      :selectedClient
      :selectedExample
      :selectedSecuritySchemes
      :selectedServer
      :specificationExtension="specificationExtension">
      <template
        v-if="$slots.actions"
        #actions>
        <slot name="actions" />
      </template>
    </ClassicLayout>
    <ModernLayout
      v-else
      :id
      :clientOptions
      :document
      :eventBus
      :expansion="expansion"
      :isWebhook
      :method
      :operation
      :options
      :path
      :pathValue
      :requiredSecurity
      :scrollTargetId="scrollTargetId"
      :selectedClient
      :selectedExample
      :selectedSecuritySchemes
      :selectedServer
      :specificationExtension="specificationExtension">
      <template
        v-if="$slots.actions"
        #actions>
        <slot name="actions" />
      </template>
    </ModernLayout>
  </template>
</template>
