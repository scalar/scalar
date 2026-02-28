import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { type MaybeRefOrGetter, onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue'

export const useMonacoMarkers = (editorRef: MaybeRefOrGetter<monaco.editor.IStandaloneCodeEditor | undefined>) => {
  const markers = ref<monaco.editor.IMarker[]>([])

  let dispose: monaco.IDisposable | null = null
  const retryTimeouts: ReturnType<typeof setTimeout>[] = []

  const updateMarkers = () => {
    const editor = toValue(editorRef)
    const resource = editor?.getModel()?.uri

    if (!resource) {
      markers.value = []
      return
    }

    markers.value = monaco.editor
      .getModelMarkers({})
      .filter((marker) => marker.resource.toString() === resource.toString())
  }

  const scheduleMarkerReads = () => {
    retryTimeouts.push(setTimeout(updateMarkers, 0), setTimeout(updateMarkers, 80), setTimeout(updateMarkers, 220))
  }

  onMounted(() => {
    dispose = monaco.editor.onDidChangeMarkers(() => {
      scheduleMarkerReads()
    })

    // initial fetch
    scheduleMarkerReads()
  })

  onBeforeUnmount(() => {
    dispose?.dispose()
    retryTimeouts.forEach((timeout) => clearTimeout(timeout))
  })

  watch(
    () => toValue(editorRef)?.getModel()?.uri?.toString(),
    () => {
      scheduleMarkerReads()
    },
    { immediate: true },
  )

  return {
    markers,
  }
}
