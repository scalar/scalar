import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import {
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
} from '@scalar/workspace-store/mutators'
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/info'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { PartialDeep } from 'type-fest'
import type { ComputedRef } from 'vue'

const log = (...args: any[]) => console.log(...args)

/**
 * Top level state mutation handling for the workspace store in the client
 */
export const useWorkspaceClientEvents = (
  eventBus: WorkspaceEventBus,
  document: ComputedRef<WorkspaceDocument | null>,
) => {
  //------------------------------------------------------------------------------------
  // Document Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on(
    'update:document-icon',
    (icon: string) => document.value && (document.value['x-scalar-client-config-icon'] = icon),
  )

  eventBus.on(
    'update:document-info',
    (info: PartialDeep<InfoObject>) =>
      document.value && (document.value.info = mergeObjects(document.value.info, info)),
  )

  //------------------------------------------------------------------------------------
  // Auth Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('delete:security-scheme', log)
  // eventBus.on('update:security-scheme', ({ payload }) => {

  // })
  eventBus.on('update:selected-scopes', ({ id, name, scopes, meta }) => {
    updateSelectedScopes({
      document: document.value,
      id,
      name,
      scopes,
      meta,
    })
  })
  eventBus.on('update:selected-security-schemes', ({ create, updated, meta }) => {
    updateSelectedSecuritySchemes({
      document: document.value,
      selectedSecuritySchemes: updated,
      create,
      meta,
    })
  })
  eventBus.on('update:security-scheme', ({ data, name }) => {
    updateSecurityScheme({
      document: document.value,
      data,
      name,
    })
  })
  eventBus.on('update:active-auth-index', ({ index, meta }) => {
    updateSelectedAuthTab({
      document: document.value,
      index,
      meta,
    })
  })

  //------------------------------------------------------------------------------------
  // Operation Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('operation:update:description', ({ description, meta }) => {
    const operation = getResolvedRef(document.value?.paths?.[meta.path]?.[meta.method])

    // Don't proceed if operation doesn't exist
    if (!operation) {
      return
    }

    operation.summary = description
  })

  eventBus.on('operation:add:parameter', ({ type, meta, payload }) => {
    const operation = getResolvedRef(document.value?.paths?.[meta.path]?.[meta.method])

    // Don't proceed if operation doesn't exist
    if (!operation) {
      return
    }

    // Initialize parameters array if it doesn't exist
    if (!operation.parameters) {
      operation.parameters = []
    }

    // Add the new parameter
    operation.parameters.push({
      name: payload.key,
      in: type,
      required: type === 'path' ? true : false,
      examples: {
        [meta.exampleKey]: {
          value: payload.value,
          'x-disabled': !payload.isEnabled,
        },
      },
    })
  })
  eventBus.on('operation:update:parameter', ({ meta, payload, index, type }) => {
    const operation = getResolvedRef(document.value?.paths?.[meta.path]?.[meta.method])

    // Don't proceed if operation doesn't exist
    if (!operation) {
      return
    }

    // Get all resolved parameters of the specified type
    // The passed index corresponds to this filtered list
    const resolvedParameters =
      operation.parameters?.map((it) => getResolvedRef(it)).filter((it) => it.in === type) ?? []
    const parameter = resolvedParameters[index]

    // Don't proceed if parameter doesn't exist
    if (!parameter) {
      return
    }

    parameter.name = payload.key ?? parameter.name ?? ''

    // TODO: handle content-type parameters
    if ('examples' in parameter) {
      if (!parameter.examples) {
        parameter.examples = {}
      }

      const example = getResolvedRef(parameter.examples[meta.exampleKey])

      if (!example) {
        return
      }

      example.value = payload.value ?? example?.value ?? ''
      example['x-disabled'] = payload.isEnabled === undefined ? example['x-disabled'] : !payload.isEnabled
    }
  })
  eventBus.on('operation:delete:parameter', ({ index, meta, type }) => {
    const operation = getResolvedRef(document.value?.paths?.[meta.path]?.[meta.method])

    // Don't proceed if operation doesn't exist
    if (!operation) {
      return
    }

    // Translate the index from the filtered list to the actual parameters array
    const resolvedParameters =
      operation.parameters?.map((it) => getResolvedRef(it)).filter((it) => it.in === type) ?? []
    const parameter = resolvedParameters[index]

    // Don't proceed if parameter doesn't exist
    if (!parameter) {
      return
    }

    const actualIndex = operation.parameters?.findIndex((it) => getResolvedRef(it) === parameter) as number

    // Remove the parameter from the operation
    operation.parameters?.splice(actualIndex, 1)
  })
  eventBus.on('operation:delete-all:parameters', ({ meta, type }) => {
    const operation = getResolvedRef(document.value?.paths?.[meta.path]?.[meta.method])

    // Don't proceed if operation doesn't exist
    if (!operation) {
      return
    }

    // Filter out parameters of the specified type
    operation.parameters = operation.parameters?.filter((it) => getResolvedRef(it).in !== type) ?? []
  })
}
