import { computed, ref } from 'vue'

export type EditorLanguage = 'json' | 'yaml'

const DIAGNOSTICS_COLLAPSED_BOTTOM_PADDING = 46
const DIAGNOSTICS_EXPANDED_BOTTOM_PADDING = 155

export const useEditorState = () => {
  const isAutoSaveEnabled = ref(false)
  const isDirty = ref(false)
  const editorLanguage = ref<EditorLanguage>('json')
  const isDiagnosticsPaneExpanded = ref(false)
  const isEditorMaximized = ref(false)

  const isYamlMode = computed(() => editorLanguage.value === 'yaml')
  const editorBottomPadding = computed(() =>
    isDiagnosticsPaneExpanded.value
      ? DIAGNOSTICS_EXPANDED_BOTTOM_PADDING
      : DIAGNOSTICS_COLLAPSED_BOTTOM_PADDING,
  )
  const editorRootClass = computed(() =>
    isEditorMaximized.value
      ? 'fixed inset-0 z-50 h-screen w-screen border bg-b-1 p-3'
      : '',
  )

  const getLanguageToggleClass = (isActive: boolean): string => {
    const base =
      'rounded-none px-2 py-1 text-[11px] leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-accent/30 focus-visible:ring-offset-1 focus-visible:ring-offset-b-1 first:rounded-md last:rounded-md'
    const active = 'bg-b-2 text-c-1 hover:bg-b-2'
    const inactive = 'text-c-2 hover:bg-b-2/60 hover:text-c-1'
    return `${base} ${isActive ? active : inactive}`
  }

  const toggleEditorMaximized = (): void => {
    isEditorMaximized.value = !isEditorMaximized.value
  }

  return {
    isAutoSaveEnabled,
    isDirty,
    editorLanguage,
    isDiagnosticsPaneExpanded,
    isEditorMaximized,
    isYamlMode,
    editorBottomPadding,
    editorRootClass,
    getLanguageToggleClass,
    toggleEditorMaximized,
  }
}
