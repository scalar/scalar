import type { TraversedEntry } from '@/features/traverse-schema/types'

/** Weak regex to match parameter links */
const IS_PARAMETER_LINK = /^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/

/** Gets the target ID from the hash, handles special cases like parameter links */
const getTargetId = (hash: string) => {
  // Since we don't get lazy on the models just yet
  if (hash.startsWith('model')) {
    return 'models'
  }

  // If we are linking to the parameter, just match the operation
  if (hash.includes('.')) {
    const match = hash.match(IS_PARAMETER_LINK)
    if (match?.[0]) {
      return match[0]
    }
  }

  return hash
}

/** Loops through the entries and returns the index of the current entry based on the hash */
export const getCurrentIndex = (hash: string, entries: TraversedEntry[]) => {
  const targetId = getTargetId(hash)

  return entries.findIndex((entry) => {
    // For tag just check starts with as the ID should start with the tag ID
    if ('tag' in entry) {
      return targetId.startsWith(entry.id)
    }

    // Otherwise check for a complete match
    return targetId === entry.id
  })
}
