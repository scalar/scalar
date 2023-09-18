import { type Extension } from '@codemirror/state'
import { type Ref, computed, reactive, ref, watch } from 'vue'

const globalExtensions = reactive<{
  values: { key: string; extension: any }[]
}>({ values: [] })

const globalStatusText = ref<string>('')

export const useSwaggerEditor = () => {
  const unregisterExtension = (key: string) => {
    globalExtensions.values = globalExtensions.values.filter(
      (extension) => extension.key !== key,
    )
  }

  const registerExtension = (key: string, extension: Extension) => {
    unregisterExtension(key)
    globalExtensions.values.push({ key, extension })
  }

  const extensions = computed(() => {
    return globalExtensions.values.map(
      (item: { extension: Extension }) => item.extension,
    )
  })

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
    unregisterExtension,
    bindStatusText,
    extensions,
    statusText: globalStatusText,
  }
}
