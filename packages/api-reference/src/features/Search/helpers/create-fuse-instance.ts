import Fuse from 'fuse.js'

import type { FuseData } from '@/features/Search/types'

/**
 * Create a Fuse instance for searching the API reference.
 *
 * Doesn't have any data yet, so it's empty.
 */
export function createFuseInstance(): Fuse<FuseData> {
  return new Fuse([], {
    // Define searchable fields with weights to prioritize more important matches.
    //
    // Field design: short, high-signal fields (`title`, `parameters`, `body`) are weighted higher than
    // long verbose fields (`description`, `parameterDescriptions`, `bodyDescriptions`). This way an
    // exact match on a parameter or body field name surfaces the right operation, even when an
    // unrelated operation happens to mention that word in its prose description.
    keys: [
      // Highest weight - titles are the most descriptive identifier of an entry.
      { name: 'title', weight: 0.7 },
      // High weight - operationIds are explicit unique identifiers.
      { name: 'operationId', weight: 0.6 },
      // Clean parameter names. Above `path` so `userId` ranks the operation that defines the param
      // higher than another operation that merely contains it in its path string.
      { name: 'parameters', weight: 0.55 },
      // Clean request-body property names — same reasoning as `parameters`.
      { name: 'body', weight: 0.55 },
      // Endpoint paths.
      { name: 'path', weight: 0.5 },
      // Tag names — useful for categorization.
      { name: 'tag', weight: 0.4 },
      // Verbose prose — helpful but often noisy.
      { name: 'description', weight: 0.3 },
      // HTTP method - useful for filtering.
      { name: 'method', weight: 0.3 },
      // Response examples can help full-text matching.
      { name: 'responseExamples', weight: 0.25 },
      // Verbose parameter descriptions — supplementary signal only.
      { name: 'parameterDescriptions', weight: 0.2 },
      // Verbose request-body descriptions — supplementary signal only.
      { name: 'bodyDescriptions', weight: 0.2 },
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
