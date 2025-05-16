import { createActiveEntitiesStore, createWorkspaceStore } from '@scalar/api-client/store'
import { dereference, upgrade } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types'
import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { type MaybeRefOrGetter, computed, ref, toValue, watch } from 'vue'

import { parse } from '@/helpers/parse'
import { useSidebar } from '@/hooks/useSidebar'
import { createEmptySpecification } from '@/libs/openapi'
import type { ReferenceLayoutProps } from '@/types'

import { useDocumentFetcher } from './useDocumentFetcher'

/**
 * Pass any data source, retrieve all the data stores and whatever we need to render the API reference.
 */
export function useDataSource({
  originalDocument: providedOriginalDocument,
  dereferencedDocument: providedDereferencedDocument,
  configuration,
}: {
  originalDocument?: MaybeRefOrGetter<ReferenceLayoutProps['originalDocument']>
  dereferencedDocument?: MaybeRefOrGetter<ReferenceLayoutProps['dereferencedDocument']>
  configuration?: MaybeRefOrGetter<ApiReferenceConfiguration>
}) {
  /** Fetch document from configuration */
  const { originalDocument: fetchedOriginalDocument } = useDocumentFetcher({
    configuration,
  })

  const originalDocument = computed(() => {
    if (providedOriginalDocument) {
      return providedOriginalDocument
    }

    return toValue(fetchedOriginalDocument)
  })

  /** Dereferenced document */
  const dereferencedDocument = computed(() => {
    if (providedDereferencedDocument) {
      return providedDereferencedDocument
    }
    return manuallyDereferencedDocument.value
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
    async (newVal) => {
      if (!newVal) {
        return
      }
      if (providedDereferencedDocument) {
        return
      }

      // TODO: Load external references

      const { specification: upgraded } = upgrade(toValue(newVal) ?? {})

      const { schema } = await dereference(upgraded)
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
    () => toValue(originalDocument),
    (newDocument) =>
      newDocument &&
      workspaceStore.importSpecFile(newDocument, 'default', {
        shouldLoad: false,
        documentUrl: toValue(configuration)?.url,
        useCollectionSecurity: true,
        ...(toValue(configuration) ?? apiReferenceConfigurationSchema.parse({})),
      }),
    { immediate: true },
  )

  /** Active Entities Store */
  const activeEntitiesStore = createActiveEntitiesStore(workspaceStore)

  /** Parsed document (legacy data structure) */
  const parsedDocument = ref<Spec>(createEmptySpecification())
  const { setParsedSpec } = useSidebar()

  watch(
    () => toValue(originalDocument),
    async (newVal) => {
      if (!newVal) {
        return
      }
      const result = await parse(toValue(newVal))
      parsedDocument.value = result
      setParsedSpec(result)
    },
    { immediate: true },
  )

  return {
    originalDocument,
    dereferencedDocument,
    parsedDocument,
    workspaceStore,
    activeEntitiesStore,
  }
}
