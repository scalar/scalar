import { createActiveEntitiesStore, createWorkspaceStore } from '@scalar/api-client/store'
import { dereference, normalize, upgrade } from '@scalar/openapi-parser'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { type MaybeRefOrGetter, type Ref, computed, ref, toValue, watch } from 'vue'

import { parse } from '@/helpers/parse'
import { useSidebar } from '@/hooks/useSidebar'
import { createEmptySpecification } from '@/libs/openapi'

import { measure } from '@/helpers/measure'
import type { Spec } from '@scalar/types/legacy'
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
  parsedDocument: Ref<Spec>
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

      // Original OpenAPI version (not the one after the upgrade)
      originalOpenApiVersion.value = (typeof content === 'object' && (content.openapi || content.swagger)) || ''

      if (providedDereferencedDocument) {
        return
      }

      // Upgrade
      const outdatedVersion = !originalOpenApiVersion.value.startsWith('3.1')

      const upgraded = outdatedVersion
        ? // Upgrade needed
          measure('upgrade', () => {
            const { specification } = upgrade(content)

            return specification
          })
        : // Skip the upgrade
          content

      // Dereference
      const schema = await measure('dereference', async () => {
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

  watch(
    () => toValue(dereferencedDocument),
    (newDocument) => {
      return (
        newDocument &&
        workspaceStore.importSpecFile(undefined, 'default', {
          dereferencedDocument: newDocument,
          shouldLoad: false,
          documentUrl: toValue(configuration)?.url,
          useCollectionSecurity: true,
          ...(toValue(configuration) ?? apiReferenceConfigurationSchema.parse({})),
        })
      )
    },
  )

  /** Active Entities Store */
  const activeEntitiesStore = createActiveEntitiesStore(workspaceStore)

  /** Parsed document (legacy data structure) */
  const parsedDocument = ref<Spec>(createEmptySpecification())
  const { setParsedSpec } = useSidebar()

  watch(
    () => toValue(dereferencedDocument),
    async (newDocument) => {
      if (!newDocument) {
        return
      }

      const result = await parse(newDocument)
      parsedDocument.value = result
      setParsedSpec(result)
    },
    { immediate: true },
  )

  return {
    originalDocument,
    originalOpenApiVersion,
    dereferencedDocument,
    parsedDocument,
    workspaceStore,
    activeEntitiesStore,
  }
}
