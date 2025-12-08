import { createSidebarState } from '@scalar/sidebar'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { assert, beforeEach, describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'

import { dragHandleFactory } from './drag-handle-factory'

const getDocument = () => {
  return {
    openapi: '3.1.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/users': {
        get: {
          tags: ['users'],
          summary: 'Get Users',
          parameters: [
            {
              name: 'Accept',
              in: 'header',
              description: 'Accept header',
              required: true,
              schema: {
                type: 'string',
              },
              examples: {
                'Test': {
                  value: 'application/json',
                  summary: 'Test example',
                },
              },
            },
          ],
          responses: { '200': { description: 'OK' } },
        },
        post: {
          tags: ['users'],
          summary: 'Create User',
          responses: { '201': { description: 'Created' } },
        },
      },
      '/pets': {
        get: {
          tags: ['pets'],
          summary: 'Get Pets',
          responses: { '200': { description: 'OK' } },
        },
      },
    },
    tags: [
      { name: 'users', description: 'User operations' },
      { name: 'pets', description: 'Pet operations' },
    ],
    'x-scalar-original-document-hash': '',
  } satisfies OpenApiDocument
}

const DOCUMENT_NAME = 'doc-1'

const getSidebarState = (store: ReturnType<typeof createWorkspaceStore>) => {
  const entries = computed(() => {
    const order = store.workspace['x-scalar-order'] ?? Object.keys(store.workspace.documents)
    return order
      .map((doc) => store.workspace.documents[doc]?.['x-scalar-navigation'])
      .filter((nav) => nav !== undefined) as TraversedEntry[]
  })

  return createSidebarState(entries)
}

describe('handleDragEnd', () => {
  let store: ReturnType<typeof createWorkspaceStore>

  beforeEach(async () => {
    store = createWorkspaceStore()
    await store.addDocument({
      name: DOCUMENT_NAME,
      document: getDocument(),
    })
  })

  //------------------------------------------------------------------------------------------------
  // DOCUMENTS
  //------------------------------------------------------------------------------------------------
  it('successfully reorders documents when moving before another document', async () => {
    await store.addDocument({
      name: 'doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Second API', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument,
    })

    const sidebarState = getSidebarState(store)
    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: 'doc-2', parentId: null }, { id: 'doc-1', parentId: null, offset: 'before' })

    expect(result).toBe(true)
    expect(store.workspace['x-scalar-order']).toEqual(['doc-2', 'doc-1'])
  })

  it('successfully reorders documents when moving after another document', async () => {
    await store.addDocument({
      name: 'doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Second API', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument,
    })

    const sidebarState = getSidebarState(store)
    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: 'doc-1', parentId: null }, { id: 'doc-2', parentId: null, offset: 'after' })

    expect(result).toBe(true)
    expect(store.workspace['x-scalar-order']).toEqual(['doc-2', 'doc-1'])
  })

  it('returns false when trying to drop document into another document', () => {
    const sidebarState = getSidebarState(store)
    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: 'doc-1', parentId: null }, { id: 'doc-1', parentId: null, offset: 'into' })

    expect(result).toBe(false)
  })

  it('returns false when dragging document over non-document item', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tagId = navigation?.children?.find((child) => child.type === 'tag')?.id

    assert(tagId, 'Tag ID is required')

    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: 'doc-1', parentId: null }, { id: tagId, parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  //------------------------------------------------------------------------------------------------
  // TAGS
  //------------------------------------------------------------------------------------------------
  it('successfully reorders tags within the same parent', () => {
    const document = store.workspace.documents['doc-1']

    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tags = navigation?.children?.filter((child) => child.type === 'tag') ?? []
    const tagUsers = tags.find((tag) => tag.name === 'users')
    const tagPets = tags.find((tag) => tag.name === 'pets')

    assert(tagUsers, 'Tag users is required')
    assert(tagPets, 'Tag pets is required')

    if (document?.tags) {
      document['x-scalar-order'] = [tagUsers?.id, tagPets?.id]
    }

    store.buildSidebar('doc-1')

    // Check the order of the tags
    const sidebarStructure = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    assert(sidebarStructure, 'Sidebar structure is required')

    const order = sidebarStructure.children?.map((child) => child.id)
    expect(order).toEqual([tagUsers.id, tagPets.id])

    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd(
      { id: tagPets.id, parentId: null },
      { id: tagUsers.id, parentId: null, offset: 'before' },
    )

    expect(result).toBe(true)
    const updatedDoc = store.workspace.documents['doc-1']
    expect(updatedDoc?.['x-scalar-order']).toEqual([tagPets.id, tagUsers.id])

    // Check the order of the tags
    const updatedSidebarStructre = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    assert(updatedSidebarStructre, 'Updated sidebar structure is required')
    const updatedOrder = updatedSidebarStructre.children?.map((child) => child.id)
    expect(updatedOrder).toEqual([tagPets.id, tagUsers.id])
  })

  it('returns false when trying to reorder tags from different parents', async () => {
    await store.addDocument({
      name: 'doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Second API', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              tags: ['items'],
              summary: 'Get Items',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        tags: [{ name: 'items', description: 'Item operations' }],
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument,
    })

    store.buildSidebar('doc-2')

    const sidebarState = getSidebarState(store)
    const nav1 = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const nav2 = store.workspace.documents['doc-2']?.['x-scalar-navigation']
    const tag1 = nav1?.children?.find((child) => child.type === 'tag' && child.name === 'users')
    const tag2 = nav2?.children?.find((child) => child.type === 'tag' && child.name === 'items')

    assert(tag1, 'Tag 1 is required')
    assert(tag2, 'Tag 2 is required')

    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: tag1.id, parentId: null }, { id: tag2.id, parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  it('returns false when trying to drop tag into parent', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tag = navigation?.children?.find((child) => child.type === 'tag')

    assert(tag, 'Tag is required')

    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: tag.id, parentId: null }, { id: tag.id, parentId: null, offset: 'into' })

    expect(result).toBe(false)
  })

  //------------------------------------------------------------------------------------------------
  // OPERATIONS
  //------------------------------------------------------------------------------------------------
  it('successfully reorders operations within the same parent', () => {
    store.buildSidebar('doc-1')
    const document = store.workspace.documents['doc-1']

    const sidebarState = getSidebarState(store)
    const navigation = document?.['x-scalar-navigation']
    const tag = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'users')

    assert(tag, 'Tag is required')
    assert(tag.type === 'tag', 'Tag is required')

    const operations = tag.children?.filter((child) => child.type === 'operation') ?? []

    expect(operations.map((it) => it.id)).toEqual(['doc-1/tag/users/GET/users', 'doc-1/tag/users/POST/users'])

    const opGet = operations[0]
    const opPost = operations[1]

    assert(opGet, 'Operation get is required')
    assert(opGet.type === 'operation', 'Operation get is required')
    assert(opPost, 'Operation post is required')
    assert(opPost.type === 'operation', 'Operation post is required')

    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: opPost.id, parentId: null }, { id: opGet.id, parentId: null, offset: 'before' })

    expect(result).toBe(true)
    const tagObject = store.workspace.documents['doc-1']?.tags?.find((it) => it.name === 'users')
    assert(tagObject, 'Tag object is required')
    expect(tagObject['x-scalar-order']).toEqual([opPost.id, opGet.id])

    // Check the order of the sidebar structure
    const updatedNavigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    assert(updatedNavigation, 'Updated navigation is required')
    const updatedTag =
      updatedNavigation.children?.filter((child) => child.type === 'tag' && child.name === 'users') ?? []
    assert(updatedTag[0]?.type === 'tag', 'Updated tag is required')
    const updatedOperations = updatedTag[0].children?.map((it) => it.id) ?? []
    expect(updatedOperations).toEqual([opPost.id, opGet.id])
  })

  it('returns false when trying to reorder operations from different parents', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tagUsers = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'users')
    const tagPets = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'pets')

    assert(tagUsers, 'Users tag is required')
    assert(tagUsers.type === 'tag', 'Users tag type is required')
    assert(tagPets, 'Pets tag is required')
    assert(tagPets.type === 'tag', 'Pets tag type is required')

    const op1 = tagUsers.children?.find((child) => child.type === 'operation')
    const op2 = tagPets.children?.find((child) => child.type === 'operation')

    assert(op1, 'Operation for users tag is required')
    assert(op1.type === 'operation', 'Operation for users tag is required')
    assert(op2, 'Operation for pets tag is required')
    assert(op2.type === 'operation', 'Operation for pets tag is required')

    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: op1.id, parentId: null }, { id: op2.id, parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  it('successfully moves an operation containing a circular reference to another tag', async () => {
    // Create a document with a schema that has a circular reference (Person references itself via children)
    // This tests that the removeCircular helper properly handles circular refs during dereference
    const documentWithCircularRef = {
      openapi: '3.1.0',
      info: { title: 'Circular Ref API', version: '1.0.0' },
      paths: {
        '/people': {
          get: {
            tags: ['people'],
            summary: 'Get People',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Person',
                    },
                  },
                },
              },
            },
          },
        },
        '/animals': {
          get: {
            tags: ['animals'],
            summary: 'Get Animals',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
      tags: [
        { name: 'people', description: 'People operations' },
        { name: 'animals', description: 'Animal operations' },
      ],
      components: {
        schemas: {
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              // This creates a circular reference - Person has children who are also Person
              children: {
                type: 'array',
                items: { $ref: '#/components/schemas/Person' },
              },
            },
          },
        },
      },
      'x-scalar-original-document-hash': '',
    } as unknown as OpenApiDocument

    await store.addDocument({
      name: 'circular-doc',
      document: documentWithCircularRef,
    })

    store.buildSidebar('circular-doc')

    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['circular-doc']?.['x-scalar-navigation']

    const tagPeople = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'people')
    const tagAnimals = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'animals')

    assert(tagPeople, 'People tag is required')
    assert(tagPeople.type === 'tag', 'People tag type is required')
    assert(tagAnimals, 'Animals tag is required')
    assert(tagAnimals.type === 'tag', 'Animals tag type is required')

    const operation = tagPeople.children?.find((child) => child.type === 'operation')

    assert(operation, 'Operation is required')
    assert(operation.type === 'operation', 'Operation type is required')

    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    // Move the operation with circular ref from 'people' tag to 'animals' tag (offset: 2 = drop into)
    const result = handleDragEnd(
      { id: operation.id, parentId: null },
      { id: tagAnimals.id, parentId: null, offset: 'into' },
    )

    expect(result).toBe(true)

    // Verify the operation was moved
    const updatedDoc = store.workspace.documents['circular-doc']
    const peopleOp = updatedDoc?.paths?.['/people']?.get as
      | { tags?: string[]; responses?: Record<string, unknown> }
      | undefined

    // The operation should now have 'animals' tag instead of 'people'
    expect(peopleOp?.tags).toContain('animals')
    expect(peopleOp?.tags).not.toContain('people')

    // Verify the response schema still exists (was not corrupted by circular ref handling)
    expect(peopleOp?.responses?.['200']).toBeDefined()
  })

  it('returns false when store is null', () => {
    const sidebarState = getSidebarState(store)
    const { handleDragEnd } = dragHandleFactory({
      store: ref(null),
      sidebarState,
    })

    const result = handleDragEnd({ id: 'doc-1', parentId: null }, { id: 'doc-1', parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  it('returns false when dragging item is not found', () => {
    const sidebarState = getSidebarState(store)
    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd(
      { id: 'non-existent', parentId: null },
      { id: 'doc-1', parentId: null, offset: 'before' },
    )

    expect(result).toBe(false)
  })

  it('returns false when hovered item is not found', () => {
    const sidebarState = getSidebarState(store)
    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd(
      { id: 'doc-1', parentId: null },
      { id: 'non-existent', parentId: null, offset: 'before' },
    )

    expect(result).toBe(false)
  })

  it('returns false when trying to drag item to itself', () => {
    const sidebarState = getSidebarState(store)
    const { handleDragEnd } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = handleDragEnd({ id: 'doc-1', parentId: null }, { id: 'doc-1', parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })
})

describe('isDroppable', () => {
  let store: ReturnType<typeof createWorkspaceStore>

  beforeEach(async () => {
    store = createWorkspaceStore()
    await store.addDocument({
      name: DOCUMENT_NAME,
      document: getDocument(),
    })
  })

  //------------------------------------------------------------------------------------------------
  // DOCUMENTS
  //------------------------------------------------------------------------------------------------
  it('returns true when dragging document over another document with reorder offset', async () => {
    await store.addDocument({
      name: 'doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Second API', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument,
    })

    store.buildSidebar('doc-2')

    const sidebarState = getSidebarState(store)
    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: 'doc-1', parentId: null }, { id: 'doc-2', parentId: null, offset: 'before' })

    expect(result).toBe(true)
  })

  it('returns false when trying to drop document into another document', async () => {
    await store.addDocument({
      name: 'doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Second API', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument,
    })

    store.buildSidebar('doc-2')

    const sidebarState = getSidebarState(store)
    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: 'doc-1', parentId: null }, { id: 'doc-2', parentId: null, offset: 'into' })

    expect(result).toBe(false)
  })

  it('returns false when dragging document over non-document', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tag = navigation?.children?.find((child) => child.type === 'tag')

    assert(tag, 'Tag is required')

    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: 'doc-1', parentId: null }, { id: tag.id, parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  //------------------------------------------------------------------------------------------------
  // TAGS
  //------------------------------------------------------------------------------------------------
  it('returns true when dragging tag over another tag with same parent', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tags = navigation?.children?.filter((child) => child.type === 'tag') ?? []
    const tag1 = tags[0]
    const tag2 = tags[1]

    assert(tag1, 'Tag 1 is required')
    assert(tag2, 'Tag 2 is required')
    assert(tag1.type === 'tag', 'Tag 1 type is required')
    assert(tag2.type === 'tag', 'Tag 2 type is required')

    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: tag1.id, parentId: null }, { id: tag2.id, parentId: null, offset: 'before' })

    expect(result).toBe(true)
  })

  it('returns false when dragging tag over tag with different parent', async () => {
    await store.addDocument({
      name: 'doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Second API', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              tags: ['items'],
              summary: 'Get Items',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        tags: [{ name: 'items', description: 'Item operations' }],
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument,
    })

    store.buildSidebar('doc-2')

    const sidebarState = getSidebarState(store)
    const nav1 = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const nav2 = store.workspace.documents['doc-2']?.['x-scalar-navigation']
    const tag1 = nav1?.children?.find((child) => child.type === 'tag' && child.name === 'users')
    const tag2 = nav2?.children?.find((child) => child.type === 'tag' && child.name === 'items')

    assert(tag1, 'Tag 1 is required')
    assert(tag2, 'Tag 2 is required')
    assert(tag1.type === 'tag', 'Tag 1 type is required')
    assert(tag2.type === 'tag', 'Tag 2 type is required')

    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: tag1.id, parentId: null }, { id: tag2.id, parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  //------------------------------------------------------------------------------------------------
  // OPERATIONS
  //------------------------------------------------------------------------------------------------
  it('returns true when reordering operations with same parent', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tag = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'users')
    const operations =
      tag && 'children' in tag ? (tag.children?.filter((child) => child.type === 'operation') ?? []) : []
    const op1 = operations[0]
    const op2 = operations[1]

    assert(op1, 'Operation 1 is required')
    assert(op2, 'Operation 2 is required')
    assert(op1.type === 'operation', 'Operation 1 type is required')
    assert(op2.type === 'operation', 'Operation 2 type is required')

    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: op1.id, parentId: null }, { id: op2.id, parentId: null, offset: 'before' })

    expect(result).toBe(true)
  })

  it('returns false when trying to reorder operations with different parents', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    const tagUsers = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'users')
    const tagPets = navigation?.children?.find((child) => child.type === 'tag' && child.name === 'pets')
    const op1 =
      tagUsers && 'children' in tagUsers ? tagUsers.children?.find((child) => child.type === 'operation') : undefined
    const op2 =
      tagPets && 'children' in tagPets ? tagPets.children?.find((child) => child.type === 'operation') : undefined

    assert(op1, 'Operation 1 is required')
    assert(op2, 'Operation 2 is required')
    assert(op1.type === 'operation', 'Operation 1 type is required')
    assert(op2.type === 'operation', 'Operation 2 type is required')

    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: op1.id, parentId: null }, { id: op2.id, parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  it('returns false when dragging example item', () => {
    const sidebarState = getSidebarState(store)
    const navigation = store.workspace.documents['doc-1']?.['x-scalar-navigation']
    assert(navigation, 'Navigation is required')

    const tag = navigation.children?.find((child) => child.type === 'tag')
    assert(tag, 'Tag is required')
    assert(tag.type === 'tag', 'Tag type is required')

    const operation = tag.children?.find((child) => child.type === 'operation')
    assert(operation, 'Operation is required')
    assert(operation.type === 'operation', 'Operation type is required')

    const example = operation.children?.find((child) => child.type === 'example')
    assert(example, 'Example is required')
    assert(example.type === 'example', 'Example type is required')

    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable({ id: example.id, parentId: null }, { id: 'doc-1', parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  it('returns false when store is null for isDroppable', () => {
    const sidebarState = getSidebarState(store)
    const { isDroppable } = dragHandleFactory({
      store: ref(null),
      sidebarState,
    })

    const result = isDroppable({ id: 'doc-1', parentId: null }, { id: 'doc-1', parentId: null, offset: 'before' })

    expect(result).toBe(false)
  })

  it('returns false when dragging item is not found for isDroppable', () => {
    const sidebarState = getSidebarState(store)
    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable(
      { id: 'non-existent', parentId: null },
      { id: 'doc-1', parentId: null, offset: 'before' },
    )

    expect(result).toBe(false)
  })

  it('returns false when hovered item is not found for isDroppable', () => {
    const sidebarState = getSidebarState(store)
    const { isDroppable } = dragHandleFactory({
      store: ref(store),
      sidebarState,
    })

    const result = isDroppable(
      { id: 'doc-1', parentId: null },
      { id: 'non-existent', parentId: null, offset: 'before' },
    )

    expect(result).toBe(false)
  })
})
