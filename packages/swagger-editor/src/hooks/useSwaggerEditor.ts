import { type Extension } from '@codemirror/state'

const globalExtensions: Extension[] = []

export const useSwaggerEditor = () => {
  const registerExtension = (extension: Extension) => {
    globalExtensions.push(extension)
  }

  return {
    registerExtension,
    extensions: globalExtensions,
  }
}
