import type { EditorView } from '@codemirror/view'
import { type Ref, watch } from 'vue'

/** Custom hook to manage a dropdown in a CodeMirror editor */
export function useDropdown(params: {
  codeMirror: Ref<EditorView | null>
  onSelect?: (item: string) => void
  query: Ref<string>
  showDropdown: Ref<boolean>
  dropdownPosition: Ref<{ left: number; top: number }>
}) {
  const { codeMirror, query, showDropdown, dropdownPosition } = params

  function getCursorPos() {
    return codeMirror.value?.state.selection.main.head || 0
  }

  function getCoordsAtPos(pos: number) {
    return codeMirror.value?.coordsAtPos(pos)
  }

  /** Updates position of the dropdown based on the current cursor position */
  function updateDropdownPosition() {
    const cursorPos = getCursorPos()
    requestAnimationFrame(() => {
      const coords = getCoordsAtPos(cursorPos - query.value.length - 2)
      if (coords) {
        dropdownPosition.value = {
          left: coords.left,
          top: Math.max(coords.bottom),
        }
      }
    })
  }

  // Watch for changes in the query and update the dropdown position
  watch(query, updateDropdownPosition)

  /** Inserts selected item at the current cursor position */
  function handleDropdownSelect(item: string) {
    const formattedItem = `{{${item}}}`
    const cursor = getCursorPos()
    const from = Math.max(0, cursor - query.value.length - 2)
    const to = cursor
    codeMirror.value?.dispatch({
      changes: { from, to, insert: formattedItem },
    })
    showDropdown.value = false
  }

  /** Updates dropdown visibility based on current cursor position */
  function updateDropdownVisibility() {
    const cursor = getCursorPos()
    const text = codeMirror.value?.state.doc.sliceString(0, cursor) || ''
    const lastOpenBraceIndex = text.lastIndexOf('{{')
    const lastCloseBraceIndex = text.lastIndexOf('}}')
    if (lastOpenBraceIndex > lastCloseBraceIndex) {
      query.value = text.slice(lastOpenBraceIndex + 2)
      showDropdown.value = true
      dropdownPosition.value = getCoordsAtPos(cursor) || { left: 0, top: 0 }
      // Ensures dropdown position even if the query is empty
      if (query.value === '') {
        updateDropdownPosition()
      }
    } else {
      showDropdown.value = false
    }
  }

  // Watch for changes in the content and update the dropdown visibility
  watch(() => codeMirror.value?.state.doc.toString(), updateDropdownVisibility)

  return {
    handleDropdownSelect,
    updateDropdownVisibility,
  }
}
