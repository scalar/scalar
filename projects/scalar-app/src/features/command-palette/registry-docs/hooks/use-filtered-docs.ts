import { computed, ref } from 'vue'

import { useRegistryDocuments } from '@/hooks/use-registry-documents'

export function useFilteredDocs(initialValue = '') {
  const { documents } = useRegistryDocuments()

  const query = ref(initialValue)
  /** A list of all versions of all documents that can be loaded */
  const flatVersionList = computed<
    {
      docUid: string
      versionUid: string
      namespace: string
      slug: string
      version: string
    }[]
  >(() =>
    documents.value.flatMap((d) =>
      d.versions.map((v) => ({
        docUid: d.uid,
        versionUid: v.uid,
        namespace: d.namespace,
        slug: d.slug,
        version: v.version,
      })),
    ),
  )

  const getUnique = (arr: string[]) => {
    return [...new Set(arr)]
  }

  // ---------------------------------------------------------------------------
  // Query processing to map to a document versions
  //
  // Format: @namespace/doc-slug/version or @namespace/doc-slug@version

  /**
   * Parse the query into its component parts
   */
  const parsedQuery = computed(() => {
    const value = query.value

    // Must start with @
    if (!value.startsWith('@')) {
      return {
        namespace: '',
        docSlug: '',
        version: '',
        stage: 'all-docs' as const,
      }
    }

    // Remove leading @ and split by /
    const withoutAt = value.substring(1)
    const slashParts = withoutAt.split('/')

    if (slashParts.length === 1) {
      // Just @namespace (possibly incomplete)
      return {
        namespace: slashParts[0],
        docSlug: '',
        version: '',
        stage: 'namespace' as const,
      }
    }

    const namespace = slashParts[0]
    let docSlugPart = slashParts[1] || ''
    let version = ''
    let stage: 'doc' | 'version' = 'doc'

    // Check if there's a version separator
    if (slashParts.length === 3) {
      // Format: @namespace/doc-slug/version
      version = slashParts[2]
      stage = 'version'
    } else if (docSlugPart.includes('@')) {
      // Format: @namespace/doc-slug@version
      const atIndex = docSlugPart.indexOf('@')
      version = docSlugPart.substring(atIndex + 1)
      docSlugPart = docSlugPart.substring(0, atIndex)
      stage = 'version'
    }

    return { namespace, docSlug: docSlugPart, version, stage }
  })

  const activeNamespace = computed(() => parsedQuery.value.namespace)
  const activeDocSlug = computed(() => parsedQuery.value.docSlug)

  /** When we start with an @ symbol we prompt to select the namespace first */
  const isSelectingNamespace = computed(
    () => parsedQuery.value.stage === 'namespace',
  )

  const isSelectingAllDocs = computed(
    () => parsedQuery.value.stage === 'all-docs',
  )

  const isSelectingDoc = computed(() => parsedQuery.value.stage === 'doc')

  const isSelectingVersion = computed(
    () => parsedQuery.value.stage === 'version',
  )

  /**
   * We filter the list context based on the current query. Logic is:
   *
   * When empty we show all docs
   * When starting with an @ symbol and before the slash we show the namespaces
   * After the first slash we show docs
   * After the doc is selected we show the versions
   */
  const completionOptions = computed<string[]>(() => {
    // Check if query matches a complete entry (either format)
    const completeMatches = flatVersionList.value.filter(
      (d) =>
        query.value === `@${d.namespace}/${d.slug}/${d.version}` ||
        query.value === `@${d.namespace}/${d.slug}@${d.version}`,
    )

    if (completeMatches.length > 0) {
      return []
    }

    if (isSelectingNamespace.value) {
      return getUnique(flatVersionList.value.map((d) => `@${d.namespace}`))
    }

    if (isSelectingAllDocs.value) {
      return getUnique(
        flatVersionList.value
          .filter((d) => d.slug.includes(query.value))
          .map((d) => `@${d.namespace}/${d.slug}`),
      )
    }

    if (isSelectingDoc.value) {
      return getUnique(
        flatVersionList.value
          .filter((d) => d.namespace === activeNamespace.value)
          .map((d) => `${d.slug}`),
      )
    }

    if (isSelectingVersion.value) {
      return getUnique(
        flatVersionList.value
          .filter(
            (d) =>
              d.namespace === activeNamespace.value &&
              d.slug === activeDocSlug.value,
          )
          .map((d) => d.version),
      )
    }

    // If we don't have a namespace then we just show all docs and filter to match
    return getUnique(
      flatVersionList.value.map((d) => `@${d.namespace}/${d.slug}`),
    )
  })

  /**
   * Returns the selected document if:
   * 1. namespace, slug, and version all match exactly
   * 2. namespace and slug match but version is empty - matches 'latest'
   */
  const selectedDocument = computed<{
    namespace: string
    slug: string
    version: string
    documentUid: string
    versionUid: string
  } | null>(() => {
    const { namespace, docSlug, version } = parsedQuery.value

    // Must have at least namespace and docSlug
    if (!namespace || !docSlug) {
      return null
    }

    // Find the matching document
    const doc = documents.value.find(
      (d) => d.namespace === namespace && d.slug === docSlug,
    )

    if (!doc) {
      return null
    }

    // If version is specified, find exact match
    if (version) {
      const matchingVersion = doc.versions.find((v) => v.version === version)
      if (!matchingVersion) {
        return null
      }
      return {
        namespace: doc.namespace,
        slug: doc.slug,
        version: matchingVersion.version,
        documentUid: doc.uid,
        versionUid: matchingVersion.uid,
      }
    }

    // No version specified, use 'latest' (first version in array or highest semver)
    // For now, we'll use the first version as 'latest'
    const latestVersion = doc.versions[0]
    if (!latestVersion) {
      return null
    }

    return {
      namespace: doc.namespace,
      slug: doc.slug,
      version: latestVersion.version,
      documentUid: doc.uid,
      versionUid: latestVersion.uid,
    }
  })

  // ---------------------------------------------------------------------------

  function handleSelect(value: string | null) {
    if (!value) {
      return
    }

    if (isSelectingNamespace.value) {
      query.value = `${value}/`
      return
    }

    if (isSelectingAllDocs.value) {
      query.value = `${value}/`
      return
    }

    if (isSelectingDoc.value) {
      query.value = `@${activeNamespace.value}/${value}@`
      return
    }

    if (isSelectingVersion.value) {
      query.value = `@${activeNamespace.value}/${activeDocSlug.value}@${value}`
      return
    }
  }

  return {
    query,
    completionOptions,
    handleSelect,
    selectedDocument,
  }
}
