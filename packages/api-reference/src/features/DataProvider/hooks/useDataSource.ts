import { createActiveEntitiesStore, createWorkspaceStore } from '@scalar/api-client/store'
import { dereference, normalize, upgrade } from '@scalar/openapi-parser'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types'
import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { type MaybeRefOrGetter, computed, ref, toValue, watch } from 'vue'

import { parse } from '@/helpers/parse'
import { useSidebar } from '@/hooks/useSidebar'
import { createEmptySpecification } from '@/libs/openapi'
import type { ReferenceLayoutProps } from '@/types'

import { measure } from '@/helpers/measure'
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

      if (providedDereferencedDocument) {
        return
      }

      // TODO: Load external references

      // Make it an object
      const content = normalize(newDocument) as OpenAPI.Document

      // Original OpenAPI version
      originalOpenApiVersion.value = content.openapi || content.swagger || ''

      // Upgrade
      const outdatedVersion = !content.openapi?.startsWith('3.1')
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
        const { schema } = await dereference(upgraded)

        return schema
      })

      manuallyDereferencedDocument.value = schema as OpenAPIV3_1.Document
    },
    { immediate: true },
  )

  // TODO: Load external references
  // TODO: Error handling

  // const start = performance.now()

  // const { filesystem } = await load(dereferencedDocument, {
  //   plugins: [
  //     fetchUrls({
  //       fetch: (url) => fetch(proxyUrl ? redirectToProxy(proxyUrl, url) : url),
  //     }),
  //   ],
  // })

  // const { schema, errors } = await dereference(filesystem)

  // const end = performance.now()
  // console.log(`dereference: ${Math.round(end - start)} ms`)

  // if (errors?.length) {
  //   console.warn(
  //     'Please open an issue on https://github.com/scalar/scalar\n',
  //     'Scalar OpenAPI Parser Warning:\n',
  //     errors,
  //   )
  // }

  // if (schema === undefined) {
  //   reject(errors?.[0]?.message ?? 'Failed to parse the OpenAPI file.')

  //   return resolve(transformResult(createEmptySpecification() as OpenAPI.Document))
  // }

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
