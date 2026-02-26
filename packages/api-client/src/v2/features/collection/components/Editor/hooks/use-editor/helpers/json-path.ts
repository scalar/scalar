export type JsonPathSegment = string | number

/**
 * A lightweight “JSON path” used by this editor to locate nodes in Monaco's JSON AST.
 * This is not JSONPath (the query language), just a list of object keys / array indices.
 */
export type JsonPath = readonly JsonPathSegment[]
