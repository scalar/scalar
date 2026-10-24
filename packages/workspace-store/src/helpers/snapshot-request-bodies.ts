import { forEachPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { snapshotSchema } from '@/helpers/snapshot-schema'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { RequestBodyObject } from '@/schemas/v3.2/strict/openapi-document'
import type { WorkspaceDocument } from '@/schemas/workspace'

/** Authored body examples, indexed by path and method, without copying their schemas. */
export type RequestBodyBaselines = Record<string, Record<string, RequestBodyObject>>

/** Capture resolved payloads while loaded references and configured defaults are still pristine. */
export const snapshotRequestBodies = (document: WorkspaceDocument): RequestBodyBaselines => {
  if (!isOpenApiDocument(document)) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(document.paths ?? {}).flatMap(([path, pathItem]) => {
      const operations: [string, RequestBodyObject][] = []
      forEachPathItemOperation(pathItem, (method, operation) => {
        const body = getResolvedRef(getResolvedRef(operation)?.requestBody)
        if (!body) {
          return
        }
        const content = Object.fromEntries(
          Object.entries(body.content).flatMap(([contentType, media]) => {
            if (media.example === undefined && !media.examples) {
              return []
            }
            return [
              [
                contentType,
                {
                  ...(media.example !== undefined ? { example: snapshotSchema(getResolvedRef(media.example)) } : {}),
                  ...(media.examples
                    ? {
                        examples: Object.fromEntries(
                          Object.entries(media.examples).flatMap(([name, example]) => {
                            const resolved = getResolvedRef(example)
                            return resolved ? [[name, snapshotSchema(resolved)]] : []
                          }),
                        ),
                      }
                    : {}),
                },
              ],
            ]
          }),
        )
        if (Object.keys(content).length) {
          operations.push([method, { content }])
        }
      })
      return operations.length ? [[path, Object.fromEntries(operations)]] : []
    }),
  )
}
