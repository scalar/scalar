import { router } from '@/router'
import EnvironmentVariableDropdownVue from '@/views/Environment/EnvironmentVariableDropdown.vue'
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { createApp } from 'vue'

class OverlayWidget extends WidgetType {
  constructor(
    private queryTerm: string,
    private onSelect: (item: string) => void,
  ) {
    super()
  }

  updateQueryTerm(newQueryTerm: string) {
    this.queryTerm = newQueryTerm
  }

  getQueryTerm() {
    return this.queryTerm
  }

  toDOM() {
    const div = document.createElement('div')
    div.style.position = 'fixed' // Ensure relative positioning for absolute child elements
    // div.style.zIndex = '1000' // Ensure the dropdown is above the editor

    // Create a container for the Vue component
    const container = document.createElement('div')
    div.appendChild(container)

    // Mount the Vue component
    createApp(EnvironmentVariableDropdownVue, {
      query: this.queryTerm,
      select: this.onSelect,
    })
      .use(router)
      .mount(container)

    return div
  }

  eq(other: WidgetType) {
    return other instanceof OverlayWidget && this.queryTerm === other.queryTerm
  }
}

export const overlayPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    widget: OverlayWidget | null = null
    view: EditorView

    constructor(view: EditorView) {
      this.view = view
      this.decorations = Decoration.none
      this.handleSelect = this.handleSelect.bind(this)
    }

    handleSelect(item: string) {
      console.log(item)
      if (!this.widget) return
      const { state, dispatch } = this.view
      const cursor = state.selection.main.head
      const from = Math.max(0, cursor - this.widget.getQueryTerm().length - 2)
      const to = cursor
      dispatch({
        changes: { from, to, insert: `{{${item}}}` },
      })
    }

    update(update: ViewUpdate) {
      const offset = this.widget ? -1 - this.widget.getQueryTerm().length : 0
      const cursor = update.state.selection.main.head
      const from = Math.max(0, cursor - 2 + offset)
      const to = cursor
      const text = update.state.doc.sliceString(from, to)
      const decorations = []

      if (text.startsWith('{{') && !text.endsWith('}}')) {
        const queryTerm = text.slice(2)

        this.widget = new OverlayWidget(queryTerm, this.handleSelect)

        decorations.push(
          Decoration.widget({
            widget: this.widget,
            side: 1,
          }).range(to),
        )
      } else {
        this.widget = null
      }

      this.decorations = Decoration.set(decorations)
    }
  },
  {
    decorations: (v) => v.decorations,
  },
)
