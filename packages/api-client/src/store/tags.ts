import type { StoreContext } from '@/store/store-context'
import { type Collection, type Tag, type TagPayload, tagSchema } from '@scalar/oas-utils/entities/spec'
import { schemaModel } from '@scalar/oas-utils/helpers'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create cookie mutators for the workspace */
export function createStoreTags(useLocalStorage: boolean) {
  const tags = reactive<Record<string, Tag>>({})

  const tagMutators = mutationFactory(tags, reactive({}), useLocalStorage && LS_KEYS.TAG)

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
  const addTag = (payload: TagPayload, collectionUid: Collection['uid']) => {
    const collection = collections[collectionUid]
    const tag = schemaModel(payload, tagSchema, false)
    if (!tag || !collection) {
      return console.error('INVALID TAG DATA', payload)
    }

    // Add to collection tags
    collectionMutators.edit(collectionUid, 'tags', [...collection.tags, tag.uid])

    // Add to parent collection as a child
    collectionMutators.edit(collectionUid, 'children', [...collection.children, tag.uid])

    tagMutators.add(tag)
    return tag
  }

  /** Delete Tag */
  const deleteTag = (tag: Tag, collectionUid: Collection['uid']) => {
    const collection = collections[collectionUid]

    if (!collection) {
      return
    }

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
      if (!request) {
        return
      }

      const filteredTags = request.tags?.filter((tagName) => tagName !== tag.name)

      // Remove the tagName from the request
      requestMutators.edit(request.uid, 'tags', filteredTags)

      // Add to the collection children if there's no more tags
      if (!filteredTags?.length && !collection.children.includes(childUid)) {
        collectionMutators.edit(collectionUid, 'children', [...collection.children, childUid])
      }
    })

    tagMutators.delete(tag.uid)
  }

  return { addTag, deleteTag }
}
