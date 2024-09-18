import type { StoreContext } from '@/store/store-context'
import {
  type Tag,
  type TagPayload,
  tagSchema,
} from '@scalar/oas-utils/entities/spec'
import { LS_KEYS, schemaModel } from '@scalar/oas-utils/helpers'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create cookie mutators for the workspace */
export function createStoreTags(useLocalStorage: boolean) {
  const tags = reactive<Record<string, Tag>>({})

  const tagMutators = mutationFactory(
    tags,
    reactive({}),
    useLocalStorage && LS_KEYS.TAG,
  )

  return {
    tags,
    tagMutators,
  }
}

/**
 * Create the extended mutators for tag with side effects
 * TODO:
 * - tag nesting, add/remove into another tag
 */
export function extendedTagDataFactory({
  collectionMutators,
  collections,
  requests,
  requestMutators,
  tagMutators,
}: StoreContext) {
  /** Add tag */
  const addTag = (payload: TagPayload, collectionUid: string) => {
    const collection = collections[collectionUid]
    const tag = schemaModel(payload, tagSchema, false)
    if (!tag) return console.error('INVALID TAG DATA', payload)

    // Add to collection tags
    collectionMutators.edit(collectionUid, 'tags', [
      ...collection.tags,
      tag.uid,
    ])

    // Add to parent collection as a child
    collectionMutators.edit(collectionUid, 'children', [
      ...collection.children,
      tag.uid,
    ])

    tagMutators.add(tag)
    return tag
  }

  /** Delete Tag */
  const deleteTag = (tag: Tag, collectionUid: string) => {
    const collection = collections[collectionUid]

    // Remove from collection tags
    collectionMutators.edit(
      collectionUid,
      'tags',
      collection.tags.filter((uid) => uid !== tag.uid),
    )

    // Remove from collection children
    collectionMutators.edit(
      collectionUid,
      'children',
      collection.children.filter((uid) => uid !== tag.uid),
    )

    // Loop on each child, just requests for now but will add other tags
    tag.children.forEach((childUid) => {
      const request = requests[childUid]
      const filteredTags = request.tags?.filter(
        (tagName) => tagName !== tag.name,
      )

      // Remove the tagName from the request
      requestMutators.edit(childUid, 'tags', filteredTags)

      // Add to the collection children if there's no more tags
      if (!filteredTags?.length && !collection.children.includes(childUid))
        collectionMutators.edit(collectionUid, 'children', [
          ...collection.children,
          childUid,
        ])
    })

    tagMutators.delete(tag.uid)
  }

  return { addTag, deleteTag }
}
