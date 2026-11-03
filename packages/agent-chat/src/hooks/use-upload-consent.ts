import { type Ref, onScopeDispose, ref } from 'vue'

/** Confirm each upload separately so saved terms never authorize sharing another API. */
export const useUploadConsent = (): {
  document: Ref<string>
  request: (document: string) => Promise<boolean>
  respond: (accepted: boolean) => void
} => {
  const document = ref('')
  const pending: { resolve?: (accepted: boolean) => void } = {}

  const respond = (accepted: boolean): void => {
    pending.resolve?.(accepted)
    pending.resolve = undefined
  }

  const request = (content: string): Promise<boolean> => {
    respond(false)
    document.value = content
    return new Promise((resolve) => {
      pending.resolve = resolve
    })
  }

  onScopeDispose(() => respond(false))

  return { document, request, respond }
}
