import { type MaybeRefOrGetter, onScopeDispose, toValue, watch } from 'vue'

import { ensureJsonPointerLinkSupport } from '@/v2/features/editor/helpers/json/json-pointer-links'
import { parseJsonPointerPath } from '@/v2/features/editor/helpers/json/json-pointer-path'
import type { EditorModel } from '@/v2/features/editor/helpers/model'

const JSON_LANGUAGE_ID = 'json'

type EditorNavigationApi = {
  focusPath: (path: string[]) => Promise<void>
}

/**
 * Enables clickable JSON Pointer links when the editor model is JSON.
 * Relates link support to the current model and uses the provided editor API to navigate.
 *
 * Call this hook with the return value of useEditor (or a ref to it) and the same model
 * passed to useEditor. When the model's language is JSON, links like "#/paths/..." in
 * string values become clickable and trigger focusPath on the editor.
 */
export const useJsonPointerLinkSupport = (
  editorApi: MaybeRefOrGetter<EditorNavigationApi | undefined>,
  model: MaybeRefOrGetter<EditorModel | undefined>,
): void => {
  let disposeLinkSupport: (() => void) | null = null

  const setupOrDispose = () => {
    const api = toValue(editorApi)
    const currentModel = toValue(model)

    if (disposeLinkSupport) {
      disposeLinkSupport()
      disposeLinkSupport = null
    }

    if (!api?.focusPath || !currentModel) {
      return
    }

    const languageId = currentModel.model.getLanguageId()
    if (languageId !== JSON_LANGUAGE_ID) {
      return
    }

    const navigate = async (pointer: string): Promise<void> => {
      const path = parseJsonPointerPath(pointer)
      if (!path) {
        return
      }
      await api.focusPath(path.map(String))
    }

    const result = ensureJsonPointerLinkSupport(navigate)
    disposeLinkSupport = result.dispose
  }

  watch(
    () => [toValue(editorApi), toValue(model)] as const,
    () => {
      setupOrDispose()
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    if (disposeLinkSupport) {
      disposeLinkSupport()
      disposeLinkSupport = null
    }
  })
}
