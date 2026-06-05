import { readFileSync } from 'node:fs'

import { getOpenApiDocument } from '@test/helpers'
import { describe, expect, it } from 'vitest'
import YAML from 'yaml'

import { createWorkspaceStore } from '@/client'

const fixture = YAML.parse(
  readFileSync(new URL('../test/fixtures/petstore-dynamicref-showcase.yaml', import.meta.url), 'utf-8'),
)

describe('$dynamicRef integration', () => {
  it('loads the petstore-dynamicref-showcase fixture', async () => {
    const store = createWorkspaceStore()

    const ok = await store.addDocument({
      name: 'petstore',
      document: fixture,
    })

    expect(ok).toBe(true)

    const doc = getOpenApiDocument(store, 'petstore') as any
    expect(doc).toBeDefined()
    expect(doc.openapi).toBe('3.1.0')
  })

  // ---------------------------------------------------------------------------
  // ApiEnvelopeTemplate: inline $dynamicRef in response $defs
  // ---------------------------------------------------------------------------

  it('resolves ApiEnvelopeTemplate $dynamicRef to pet in POST /pets response', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    const responseSchema = doc.paths['/pets'].post.responses['201'].content['application/json'].schema

    const envelope = responseSchema['$ref-value']
    expect(envelope).toBeDefined()

    const dataField = envelope.properties.data
    expect(dataField).toBeDefined()

    const dataValue = dataField['$ref-value']
    expect(dataValue).toBeDefined()

    // Override has $ref to pet, not the placeholder's `not: {}`
    expect(dataValue.$ref).toBeDefined()
    expect(dataValue.not).toBeUndefined()

    // Follow through to the actual pet schema
    const petSchema = dataValue['$ref-value']
    expect(petSchema).toBeDefined()
    expect(petSchema.allOf).toBeDefined()
  })

  it('resolves ApiEnvelopeTemplate $dynamicRef to PaginatedPetItems in GET /pets response', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    const responseSchema = doc.paths['/pets'].get.responses['200'].content['application/json'].schema

    const envelope = responseSchema['$ref-value']
    expect(envelope).toBeDefined()

    const dataField = envelope.properties.data
    expect(dataField).toBeDefined()

    const dataValue = dataField['$ref-value']
    expect(dataValue).toBeDefined()
    expect(dataValue.$dynamicAnchor).toBe('dataType')

    // PaginatedPetItems is a $ref to PaginatedTemplate
    const paginatedItems = dataValue['$ref-value']
    expect(paginatedItems).toBeDefined()

    const template = paginatedItems['$ref-value']
    expect(template).toBeDefined()
    expect(template.properties.items).toBeDefined()
    expect(template.properties.total).toBeDefined()
  })

  it('resolves ApiEnvelopeTemplate $dynamicRef to pet in GET /pets/{petId} response', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    // Path key contains {petId} — exercises JSON Pointer encoding for {} chars
    const responseSchema = doc.paths['/pets/{petId}'].get.responses['200'].content['application/json'].schema

    const envelope = responseSchema['$ref-value']
    expect(envelope).toBeDefined()

    const dataField = envelope.properties.data
    expect(dataField).toBeDefined()

    const dataValue = dataField['$ref-value']
    expect(dataValue).toBeDefined()

    // Override should target pet, not the placeholder
    expect(dataValue.$ref).toBeDefined()
    expect(dataValue.not).toBeUndefined()

    const petSchema = dataValue['$ref-value']
    expect(petSchema).toBeDefined()
    expect(petSchema.allOf).toBeDefined()
  })

  it('resolves ApiEnvelopeTemplate $dynamicRef to PaginatedOwnerItems in GET /owners response', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    const responseSchema = doc.paths['/owners'].get.responses['200'].content['application/json'].schema

    const envelope = responseSchema['$ref-value']
    expect(envelope).toBeDefined()

    const dataField = envelope.properties.data
    expect(dataField).toBeDefined()

    const dataValue = dataField['$ref-value']
    expect(dataValue).toBeDefined()
    expect(dataValue.$dynamicAnchor).toBe('dataType')

    // PaginatedOwnerItems is a $ref to PaginatedTemplate
    const paginatedItems = dataValue['$ref-value']
    expect(paginatedItems).toBeDefined()

    const template = paginatedItems['$ref-value']
    expect(template).toBeDefined()

    // Verify nested $dynamicRef for itemType resolves to Owner
    const itemsArray = template.properties?.items
    expect(itemsArray).toBeDefined()

    const itemOverride = itemsArray.items?.['$ref-value']
    expect(itemOverride).toBeDefined()
    expect(itemOverride.$dynamicAnchor).toBe('itemType')

    const ownerSchema = itemOverride['$ref-value']
    expect(ownerSchema).toBeDefined()
    expect(ownerSchema.properties?.name).toBeDefined()
    expect(ownerSchema.properties?.email).toBeDefined()
  })

  // ---------------------------------------------------------------------------
  // ApiEnvelopeTemplate: fallback to placeholder when accessed outside response
  // ---------------------------------------------------------------------------

  it('resolves $dynamicRef to placeholder when template is accessed directly', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    // Access ApiEnvelopeTemplate directly from components/schemas,
    // not through a response — no caller context, so $dynamicRef
    // should fall back to the placeholder { not: {} }
    const template = doc.components.schemas.ApiEnvelopeTemplate
    expect(template).toBeDefined()

    const dataField = template.properties.data
    expect(dataField).toBeDefined()

    const dataValue = dataField['$ref-value']
    expect(dataValue).toBeDefined()

    // Should be the placeholder, not an override
    expect(dataValue.not).toBeDefined()
    expect(dataValue.$ref).toBeUndefined()
  })

  // ---------------------------------------------------------------------------
  // LocalizedSpeciesCategory: recursive $dynamicRef
  // ---------------------------------------------------------------------------

  it('resolves LocalizedSpeciesCategory recursive $dynamicRef', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    const schema = doc.paths['/species/tree'].get.responses['200'].content['application/json'].schema

    const category = schema['$ref-value']
    expect(category).toBeDefined()

    // LocalizedSpeciesCategory uses allOf to extend BaseSpeciesCategory
    expect(category.allOf).toBeDefined()
    expect(category.allOf.length).toBe(2)

    // First allOf element is BaseSpeciesCategory ($ref)
    const base = category.allOf[0]['$ref-value']
    expect(base).toBeDefined()
    expect(base.properties?.children).toBeDefined()

    // Second allOf element adds locale and displayName
    expect(category.allOf[1].properties?.displayName).toBeDefined()
    expect(category.allOf[1].properties?.locale).toBeDefined()

    // Verify the $dynamicRef inside children.items resolves to
    // LocalizedSpeciesCategory (not BaseSpeciesCategory), proving recursion
    const childrenItems = base.properties.children.items
    expect(childrenItems).toBeDefined()

    const resolvedChild = childrenItems['$ref-value']
    expect(resolvedChild).toBeDefined()
    // LocalizedSpeciesCategory has allOf, BaseSpeciesCategory does not
    expect(resolvedChild.allOf).toBeDefined()
    expect(resolvedChild.$dynamicAnchor).toBe('speciesCategory')
  })

  // ---------------------------------------------------------------------------
  // ShelterFolder: nested multi-anchor $dynamicRef
  // ---------------------------------------------------------------------------

  it('resolves ShelterFolder nested $dynamicRef for folderType and resourceType', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    const schema = doc.paths['/shelters/{shelterId}/resources'].get.responses['200'].content['application/json'].schema

    // ShelterResource is a oneOf: [Document, shelter-folder]
    const resource = schema['$ref-value']
    expect(resource).toBeDefined()
    expect(resource.oneOf).toBeDefined()
    expect(resource.oneOf.length).toBe(2)

    // shelter-folder = allOf[0: ShelterFolderTemplate with $defs, 1: {accessLevel}]
    const folder = resource.oneOf[1]['$ref-value']
    expect(folder).toBeDefined()
    expect(folder.allOf).toBeDefined()
    expect(folder.allOf.length).toBe(2)

    // allOf[0] carries $defs with folderType/resourceType overrides and $ref to template
    const allOfFirst = folder.allOf[0]
    expect(allOfFirst.$defs).toBeDefined()
    expect(allOfFirst.$defs.folderType).toBeDefined()
    expect(allOfFirst.$defs.resourceType).toBeDefined()

    // Resolve through to ShelterFolderTemplate
    const template = allOfFirst['$ref-value']
    expect(template).toBeDefined()
    expect(template.properties?.children).toBeDefined()
    expect(template.properties?.shortcuts).toBeDefined()

    // children.items.oneOf[1] = $dynamicRef '#folderType'
    // Should resolve to shelter-folder (recursive self-reference)
    const childrenItems = template.properties.children.items
    const folderTypeRef = childrenItems.oneOf[1]
    expect(folderTypeRef).toBeDefined()

    const resolvedFolderType = folderTypeRef['$ref-value']
    expect(resolvedFolderType).toBeDefined()
    // It should have $dynamicAnchor: 'folderType' and $ref back to shelter-folder
    expect(resolvedFolderType.$dynamicAnchor).toBe('folderType')

    // shortcuts.items = $dynamicRef '#resourceType'
    // Should resolve to ShelterResource
    const shortcutsItems = template.properties.shortcuts.items
    const resolvedResourceType = shortcutsItems['$ref-value']
    expect(resolvedResourceType).toBeDefined()
    expect(resolvedResourceType.$dynamicAnchor).toBe('resourceType')
  })

  // ---------------------------------------------------------------------------
  // Regression: simple $ref without $dynamicRef still works
  // ---------------------------------------------------------------------------

  it('resolves plain $ref chains without $dynamicRef (PetCreateRequest)', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'petstore', document: fixture })
    const doc = getOpenApiDocument(store, 'petstore') as any

    // PetCreateRequest is just { $ref: '#/components/schemas/PetFields' }
    const reqSchema = doc.paths['/pets'].post.requestBody.content['application/json'].schema

    const fields = reqSchema['$ref-value']
    expect(fields).toBeDefined()
    expect(fields.properties?.name).toBeDefined()
    expect(fields.properties?.species).toBeDefined()
    expect(fields.properties?.status).toBeDefined()
  })
})
