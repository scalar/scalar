import { convertFetchOptionsToHarRequest } from '@/libs/send-request'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { type ComputedRef, type Ref, computed } from 'vue'

/**
 * Returns a computed containing a code snippet for the given target, client and request
 */
export function useCodeSnippet({
  target,
  client,
  request,
}: {
  target: Ref<string>
  client: Ref<string>
  request: ComputedRef<
    | {
        createUrl: () => string
        createFetchOptions: () => RequestInit
      }
    | null
    | undefined
  >
}) {
  return {
    codeSnippet: computed(() => {
      return createCodeSnippet(
        target.value,
        client.value,
        request.value?.createUrl(),
        request.value?.createFetchOptions(),
      )
    }),
  }
}

/**
 * Create the code example for a request
 */
function createCodeSnippet(
  targetId: string,
  clientId: string,
  url?: string,
  fetchOptions?: RequestInit,
): string {
  if (!url) {
    return ''
  }

  if (!snippetz().hasPlugin(targetId, clientId)) {
    return ''
  }

  const harRequest = convertFetchOptionsToHarRequest(url, fetchOptions)

  return snippetz().print(
    targetId as TargetId,
    clientId as ClientId,
    harRequest,
  )
}
