/**
 * The `maxAliasCount` we pass to the `yaml` parser for API documents.
 *
 * The limit protects against "billion laughs" documents, where a few lines of nested aliases
 * expand exponentially. The parser counts per anchor: each use costs 1 (0 for an empty
 * collection), or, when the anchor contains aliases, as much as the heaviest alias inside it. It
 * throws once one anchor's total exceeds this limit. The limit is not a total for the whole document.
 *
 * Since yaml 2.9.1, merge keys (`<<: *anchor`) count toward the limit as well. Large API Gateway
 * exports merge shared error responses into every operation: one real export with 68 operations
 * needs 10,332, roughly 150 per operation, so the previous limit of 10,000 rejected it.
 *
 * 100,000 leaves room for documents nearly ten times that size. Exponential documents still fail
 * after a few levels of nesting, because each level multiplies the count: ten references per level
 * fail at the fifth level.
 */
export const YAML_MAX_ALIAS_COUNT = 100_000
