import { ScalarTooltip } from '@scalar/components'
import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import {
  Decoration,
  type DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@scalar/use-codemirror'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { nanoid } from 'nanoid'
import { createApp, defineComponent, h } from 'vue'

/**
 * Displays the value of a variable of the active environment in a pill
 */
class PillWidget extends WidgetType {
  private app: any
  private uid: string
  environment: XScalarEnvironment | undefined
  isReadOnly: boolean

  constructor(
    private variableName: string,
    environment: XScalarEnvironment | undefined,
    isReadOnly: boolean | undefined,
  ) {
    super()
    this.variableName = variableName
    this.environment = environment
    this.isReadOnly = isReadOnly ?? false
    this.uid = nanoid()
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-pill'
    span.textContent = `${this.variableName}`

    const tooltipComponent = defineComponent({
      props: { variableName: { type: String, default: null } },
      render: () => {
        const variable = this.environment?.variables?.[this.variableName]
        const value = typeof variable === 'string' ? variable : variable?.default

        // Set the pill color based on the environment source or fallback to default color
        const pillColor = this.environment?.color || 'var(--scalar-color-1)'

        span.style.setProperty('--tw-bg-base', pillColor)

        // Set opacity based on the existence of a value
        span.style.opacity = value ? '1' : '0.5'

        // Tooltip content as string
        const tooltipContent = value || 'No value'

        // Tooltip trigger element
        const tooltipTrigger = h('div', { class: 'flex items-center gap-1 whitespace-nowrap' }, [
          h('span', this.variableName),
        ])

        return h(
          ScalarTooltip,
          {
            content: tooltipContent,
            delay: 0,
            placement: 'bottom',
            offset: 6,
          },
          {
            default: () => tooltipTrigger,
          },
        )
      },
    })

    this.app = createApp(tooltipComponent, { variableName: this.variableName })
    this.app.mount(span)

    return span
  }

  override destroy() {
    if (this.app) {
      this.app.unmount()
    }
  }

  override eq(other: WidgetType) {
    return other instanceof PillWidget && other.variableName === this.variableName && other.uid === this.uid
  }

  override ignoreEvent() {
    return false
  }
}

/**
 * Styles the active environment variable pill
 */
export const pillPlugin = (props: { environment: XScalarEnvironment | undefined; isReadOnly: boolean | undefined }) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          requestAnimationFrame(() => {
            this.decorations = this.buildDecorations(update.view)
            update.view.update([])
          })
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>()

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to)
          let match

          while ((match = REGEX.VARIABLES.exec(text)) !== null) {
            const start = from + match.index
            const end = start + match[0].length
            const variableName = match[1] ?? ''
            builder.add(
              start,
              end,
              Decoration.widget({
                widget: new PillWidget(variableName, props.environment, props.isReadOnly),
                side: 1,
              }),
            )
          }
        }

        return builder.finish()
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  )

export const backspaceCommand = EditorView.domEventHandlers({
  keydown(event, view) {
    if (event.key === 'Backspace') {
      const { state } = view
      const { from, to } = state.selection.main

      // Prevent breaking line content addition on pill removal
      if (from === 0 && to === state.doc.length) {
        view.dispatch({
          changes: { from: 0, to: state.doc.length },
          selection: { anchor: 0 },
        })
        event.preventDefault()
        return true
      }

      if (from === to && from > 0) {
        const before = state.doc.sliceString(from - 2, from)
        if (before === '}}') {
          view.dispatch({
            changes: { from: from - 2, to },
            selection: { anchor: from - 2 },
          })
          event.preventDefault()
          return true
        }
      }
    }
    return false
  },
})
