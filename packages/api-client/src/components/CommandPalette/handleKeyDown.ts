import { isMacOS } from '@scalar/use-tooltip'

export const handleKeyDown = (
  event: KeyboardEvent,
  handleSubmit: () => void,
) => {
  if (isSubmitKeyCombo(event)) {
    event.stopPropagation()
    event.preventDefault()
    handleSubmit()
  }
}
const isSubmitKeyCombo = (event: KeyboardEvent) => {
  if (isMacOS()) {
    return event.metaKey && event.key === 'Enter'
  } else {
    return event.ctrlKey && event.key === 'Enter'
  }
}
