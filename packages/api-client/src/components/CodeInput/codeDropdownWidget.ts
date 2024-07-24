import type { WorkspaceStore } from '@/store'
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  StateEffect,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@scalar/use-codemirror'
import { Teleport, createApp, h } from 'vue'
import type { Router } from 'vue-router'

import EnvironmentVariableDropdownVue from '../../views/Environment/EnvironmentVariableDropdown.vue'

class DropdownWidget extends WidgetType {
  private queryTerm: string
  private onSelect: (item: string) => void
  private dropdown: any = null
  private withServers?: boolean
  private activeParsedEnvironments: WorkspaceStore['activeParsedEnvironments']
  private environments: WorkspaceStore['environments']
  private router: Router

  constructor(
    queryTerm: string,
    onSelect: (item: string) => void,
    activeParsedEnvironments: WorkspaceStore['activeParsedEnvironments'],
    environments: WorkspaceStore['environments'],
    router: Router,
    withServers?: boolean,
  ) {
    super()
    this.queryTerm = queryTerm
    this.onSelect = onSelect
    this.withServers = withServers
    this.activeParsedEnvironments = activeParsedEnvironments
    this.environments = environments
    this.router = router
  }

  updateQueryTerm(newQueryTerm: string) {
    if (this.queryTerm !== newQueryTerm) {
      this.queryTerm = newQueryTerm
    }
  }

  getQueryTerm() {
    return this.queryTerm
  }

  toDOM(view: EditorView) {
    const dropdownElement = document.createElement('span')
    dropdownElement.style.position = 'fixed'
    setTimeout(() => {
      const cursorPos = view.state.selection.main.head
      const coords = view.coordsAtPos(cursorPos - this.queryTerm.length - 2)
      if (coords) {
        const scalarClientRect = document
          .querySelector('.scalar-client')
          ?.getBoundingClientRect()
        if (scalarClientRect) {
          /** Create and mount the Vue component */
          this.dropdown = createApp({
            render: () => {
              return h(Teleport, { to: '.scalar-client' }, [
                h(EnvironmentVariableDropdownVue, {
                  query: this.queryTerm,
                  onSelect: this.onSelect,
                  withServers: this.withServers,
                  activeParsedEnvironments: this.activeParsedEnvironments,
                  environments: this.environments,
                  router: this.router,
                  style: {
                    position: 'absolute',
                    left: `${coords.left - scalarClientRect.left}px`,
                    top: `calc(${coords.bottom - scalarClientRect.top}px + 6px)`,
                  },
                }),
              ])
            },
          })
        }
        this.dropdown.use(this.router)
        this.dropdown.mount(dropdownElement)
      }
    }, 0)
    return dropdownElement
  }

  destroy() {
    if (this.dropdown) {
      this.dropdown.unmount()
      this.dropdown = null
    }
  }

  eq(other: WidgetType) {
    return other instanceof DropdownWidget && this.queryTerm === other.queryTerm
  }
}

export const dropdownPlugin = (props: {
  withServers?: boolean
  activeParsedEnvironments: WorkspaceStore['activeParsedEnvironments']
  environments: WorkspaceStore['environments']
  router: Router
}) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      widget: DropdownWidget | null = null
      view: EditorView

      constructor(view: EditorView) {
        this.view = view
        this.decorations = Decoration.none
        this.handleDropdownSelect = this.handleDropdownSelect.bind(this)
      }

      handleDropdownSelect(item: string) {
        if (!this.widget) return
        const { state, dispatch } = this.view
        const cursor = state.selection.main.head
        const from = Math.max(0, cursor - this.widget.getQueryTerm().length - 2)
        const to = cursor
        const formattedItem = `{{${item}}}`
        dispatch({
          changes: { from, to, insert: formattedItem },
        })

        this.widget?.destroy()
        this.widget = null
        this.decorations = Decoration.none
        this.view.dispatch({
          effects: StateEffect.appendConfig.of([]),
        })

        const newCursor = from + formattedItem.length
        const newQueryTerm = ''
        this.widget = new DropdownWidget(
          newQueryTerm,
          this.handleDropdownSelect,
          props.activeParsedEnvironments,
          props.environments,
          props.router,
          props.withServers,
        )
        this.decorations = Decoration.set([
          Decoration.widget({
            widget: this.widget,
            side: 1,
          }).range(newCursor),
        ])
        this.view.dispatch({
          selection: { anchor: newCursor },
        })
        this.view.focus()
      }

      update(update: ViewUpdate) {
        const cursor = update.state.selection.main.head
        const text = update.state.doc.sliceString(0, cursor)
        const decorations = []
        const lastOpenBraceIndex = text.lastIndexOf('{{')
        const lastCloseBraceIndex = text.lastIndexOf('}}')

        /** Ensure the last '{{' is not closed by '}}' */
        if (lastOpenBraceIndex > lastCloseBraceIndex) {
          const queryTerm = text.slice(lastOpenBraceIndex + 2)

          if (!this.widget || this.widget.getQueryTerm() !== queryTerm) {
            this.widget?.destroy()
            this.widget = new DropdownWidget(
              queryTerm,
              this.handleDropdownSelect,
              props.activeParsedEnvironments,
              props.environments,
              props.router,
            )
          } else {
            this.widget.updateQueryTerm(queryTerm)
          }

          decorations.push(
            Decoration.widget({
              widget: this.widget,
              side: 1,
            }).range(cursor),
          )
        } else {
          this.widget?.destroy()
          this.widget = null
        }

        this.decorations = Decoration.set(decorations)
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  )
