import { type ModalState, useModal } from '@scalar/components/modal'
import { onScopeDispose } from 'vue'

/** Confirm each upload separately so saved terms never authorize sharing another API. */
export const useUploadConsent = (): {
  modal: ModalState
  request: () => Promise<boolean>
  respond: (accepted: boolean) => void
} => {
  const modal = useModal()
  const pending: { resolve?: (accepted: boolean) => void } = {}

  const respond = (accepted: boolean): void => {
    pending.resolve?.(accepted)
    pending.resolve = undefined
    modal.hide()
  }

  const request = (): Promise<boolean> => {
    respond(false)
    modal.show()
    return new Promise((resolve) => {
      pending.resolve = resolve
    })
  }

  onScopeDispose(() => respond(false))

  return { modal, request, respond }
}
