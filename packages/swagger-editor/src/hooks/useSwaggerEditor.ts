import { type Extension } from '@codemirror/state'
import { type Ref, ref, watch } from 'vue'

const globalExtensions: Extension[] = []
const globalStatusText = ref<string>('')

export const useSwaggerEditor = () => {
  const registerExtension = (extension: Extension) => {
    globalExtensions.push(extension)
  }

  const bindStatusText = (statusText: Ref<string> | string) => {
    if (typeof statusText === 'string') {
      globalStatusText.value = statusText
    } else {
      globalStatusText.value = statusText.value

      watch(statusText, (value) => {
        globalStatusText.value = value
      })
    }
  }

  return {
    registerExtension,
    bindStatusText,
    extensions: globalExtensions,
    statusText: globalStatusText,
  }
}
