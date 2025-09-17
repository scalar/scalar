import { createActiveEntitiesStore, createWorkspaceStore } from '@scalar/api-client/store'
import { measureAsync } from '@scalar/helpers/testing/measure'
import { dereference, normalize } from '@scalar/openapi-parser'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { upgrade } from '@scalar/openapi-upgrader'
import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { type MaybeRefOrGetter, type Ref, computed, ref, toValue, watch } from 'vue'

import { useDocumentFetcher } from './useDocumentFetcher'

/**
 * Pass any data source, retrieve all the data stores and whatever we need to render the API reference.
 */
export function useDocumentSource({
  originalDocument: providedOriginalDocument,
  dereferencedDocument: providedDereferencedDocument,
  configuration,
}: {
  originalDocument?: MaybeRefOrGetter<string>
  dereferencedDocument?: MaybeRefOrGetter<OpenAPIV3_1.Document>
  configuration?: MaybeRefOrGetter<ApiReferenceConfiguration>
}): {
  originalDocument: Ref<string>
  originalOpenApiVersion: Ref<string>
  dereferencedDocument: Ref<OpenAPIV3_1.Document>
  workspaceStore: ReturnType<typeof createWorkspaceStore>
  activeEntitiesStore: ReturnType<typeof createActiveEntitiesStore>
} {
  /** Fetch document from configuration */
  const { originalDocument: fetchedOriginalDocument } = useDocumentFetcher({
    configuration,
  })

  const originalDocument = computed(() => {
    if (providedOriginalDocument) {
      return toValue(providedOriginalDocument)
    }

    return toValue(fetchedOriginalDocument)
  })

  /** Original OpenAPI version */
  const originalOpenApiVersion = ref<string>('')

  /** Dereferenced document */
  const dereferencedDocument = computed(() => {
    if (providedDereferencedDocument) {
      return toValue(providedDereferencedDocument)
    }

    return toValue(manuallyDereferencedDocument)
  })

  const manuallyDereferencedDocument = ref<OpenAPIV3_1.Document>({
    openapi: '3.1.0',
    info: {
      title: '',
      version: '',
    },
    paths: {},
  })

  watch(
    () => toValue(originalDocument),
    async (newDocument) => {
      if (!newDocument) {
        return
      }

      // Make it an object
      const content = normalize(newDocument) as OpenAPI.Document

      if (content === undefined) {
        console.error('Failed to parse the OpenAPI document:', newDocument)
        return
      }

      // Original OpenAPI version (not the one after the upgrade)
      originalOpenApiVersion.value = (typeof content === 'object' && (content.openapi || content.swagger)) || ''

      if (providedDereferencedDocument) {
        return
      }

      // Upgrade
      const outdatedVersion = !originalOpenApiVersion.value.startsWith('3.1')

      const upgraded = outdatedVersion
        ? // Upgrade needed
          upgrade(content)
        : // Skip the upgrade
          content

      // Dereference
      const schema = await measureAsync('dereference', async () => {
        const { schema, errors } = await dereference(upgraded)

        // Error handling
        if (errors?.length) {
          console.warn(
            'Please open an issue on https://github.com/scalar/scalar\n',
            'Scalar OpenAPI Parser Warning:\n',
            errors,
          )
        }

        if (schema === undefined) {
          console.error('Failed to dereference the OpenAPI document', errors)
        }

        return schema
      })

      manuallyDereferencedDocument.value = schema as OpenAPIV3_1.Document
    },
    { immediate: true },
  )

  /** API Client Store */
  const workspaceStore = createWorkspaceStore({
    useLocalStorage: false,
    ...(toValue(configuration) ?? apiReferenceConfigurationSchema.parse({})),
  })

  /** Active Entities Store */
  const activeEntitiesStore = createActiveEntitiesStore(workspaceStore)

  return {
    originalDocument,
    originalOpenApiVersion,
    dereferencedDocument,
    workspaceStore,
    activeEntitiesStore,
  }
}
