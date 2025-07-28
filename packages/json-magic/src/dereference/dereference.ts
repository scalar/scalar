import { bundle } from '@/bundle'
import { fetchUrls } from '@/bundle/plugins/fetch-urls'
import { createMagicProxy } from '@/magic-proxy'
import type { UnknownObject } from '@/types'

type DereferenceResult =
  | {
      success: true
      data: UnknownObject
    }
  | {
      success: false
      errors: string[]
    }

type ReturnDereferenceResult<Opt extends { sync?: boolean }> = Opt['sync'] extends true
  ? DereferenceResult
  : Promise<DereferenceResult>

/**
 * Dereferences a JSON object, resolving all $ref pointers.
 *
 * This function can operate synchronously (no remote refs, no async plugins) or asynchronously (with remote refs).
 * If `options.sync` is true, it simply wraps the input in a magic proxy and returns it.
 * Otherwise, it bundles the document, resolving all $refs (including remote ones), and returns a promise.
 *
 * @param input - JSON Schema object to dereference.
 * @param options - Optional settings. If `sync` is true, dereferencing is synchronous.
 * @returns A DereferenceResult (or Promise thereof) indicating success and the dereferenced data, or errors.
 *
 * @example
 * // Synchronous dereference (no remote refs)
 * const result = dereference({ openapi: '3.0.0', info: { title: 'My API', version: '1.0.0' } }, { sync: true });
 * if (result.success) {
 *   console.log(result.data); // Magic proxy-wrapped document
 * }
 *
 * @example
 * // Asynchronous dereference (with remote refs)
 * dereference({ $ref: 'https://example.com/api.yaml' })
 *   .then(result => {
 *     if (result.success) {
 *       console.log(result.data); // Fully dereferenced document
 *     } else {
 *       console.error(result.errors);
 *     }
 *   });
 */
export const dereference = <Opts extends { sync?: boolean }>(
  input: UnknownObject,
  options?: Opts,
): ReturnDereferenceResult<Opts> => {
  if (options?.sync) {
    return {
      success: true,
      data: createMagicProxy(input),
    } as ReturnDereferenceResult<Opts>
  }

  const errors: string[] = []

  return bundle(input, {
    plugins: [fetchUrls()],
    treeShake: false,
    urlMap: true,
    hooks: {
      onResolveError(node) {
        errors.push(`Failed to resolve ${node.$ref}`)
      },
    },
  }).then((result) => {
    if (errors.length > 0) {
      return {
        success: false,
        errors,
      }
    }

    return {
      success: true,
      data: createMagicProxy(result as UnknownObject),
    }
  }) as ReturnDereferenceResult<Opts>
}
