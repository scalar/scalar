import { useCodeMirror } from '@scalar/use-codemirror'

import BaseCodeInput from './CodeInput.vue'

/** The public input keeps the full language set available to consumers. */
export const CodeInput: typeof BaseCodeInput = Object.assign({}, BaseCodeInput, {
  props: {
    ...BaseCodeInput.props,
    createEditor: { type: Function, default: useCodeMirror },
  },
})

export { default as CodeInputLite } from './CodeInputLite.vue'
