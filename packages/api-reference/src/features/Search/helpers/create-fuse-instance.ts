import type { FuseData } from '@/features/Search/types'
import Fuse from 'fuse.js'

/**
 * Create a Fuse instance for searching the API reference.
 *
 * Doesn't have any data yet, so it's empty.
 */
export function createFuseInstance(): Fuse<FuseData> {
  return new Fuse([], {
    // Define searchable fields with weights to prioritize more important matches
    keys: [
      // Highest weight - titles are most descriptive
      { name: 'title', weight: 0.7 },
      // Medium weight - helpful but often verbose
      { name: 'description', weight: 0.3 },
      // Lowest weight - can be very long and noisy
      { name: 'body', weight: 0.2 },
      // High weight - unique identifiers for operations
      { name: 'id', weight: 0.6 },
      // Good weight - endpoint paths are searchable
      { name: 'path', weight: 0.5 },
      // Medium-high weight - helps with categorization
      { name: 'tag', weight: 0.4 },
      // Medium weight - useful for filtering by method
      { name: 'method', weight: 0.3 },
    ],

    // Threshold controls how strict the matching is (0.0 = perfect match, 1.0 = very loose)
    // 0.3 allows for some typos and partial matches while maintaining relevance
    threshold: 0.3,

    // Maximum distance between characters that can be matched
    // Higher values allow matches even when characters are far apart in long text
    distance: 100,

    // Include the match score in results for debugging and potential UI enhancements
    includeScore: true,

    // Include detailed match information showing which parts of the text matched
    includeMatches: true,

    // Don't require matches to be at the beginning of strings
    // Makes search more flexible and user-friendly
    ignoreLocation: true,

    // Enable advanced search syntax like 'exact' for exact matches or !exclude for exclusions
    useExtendedSearch: true,

    // Find all possible matches in each item, not just the first one
    // Ensures comprehensive search results
    findAllMatches: true,
  })
}
