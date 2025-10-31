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
import { createApp, defineComponent, h } from 'vue'

/**
 * Displays the value of a variable of the active environment in a pill.
 * Uses Vue for tooltip functionality.
 */
class PillWidget extends WidgetType {
  private app: any
  private readonly pillColor: string
  private readonly variableInfo: { value: string; hasValue: boolean }

  constructor(
    private readonly variableName: string,
    environment: XScalarEnvironment | undefined,
  ) {
    super()
    this.pillColor = environment?.color || 'var(--scalar-color-1)'

    // Look up the variable value directly from the environment
    const variable = environment?.variables?.find((v) => v.name === variableName)
    const value = variable ? (typeof variable.value === 'string' ? variable.value : variable.value?.default) : undefined
    this.variableInfo = {
      value: value || 'No value',
      hasValue: Boolean(value),
    }
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-pill'
    span.textContent = this.variableName

    // Set styles once during creation instead of on every render
    span.style.setProperty('--tw-bg-base', this.pillColor)
    span.style.opacity = this.variableInfo.hasValue ? '1' : '0.5'

    // Create tooltip component with pre-computed values
    const tooltipComponent = defineComponent({
      render: () => {
        const tooltipTrigger = h('div', { class: 'flex items-center gap-1 whitespace-nowrap' }, [
          h('span', this.variableName),
        ])

        return h(
          ScalarTooltip,
          {
            content: this.variableInfo.value,
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

    this.app = createApp(tooltipComponent)
    this.app.mount(span)

    return span
  }

  override destroy(): void {
    if (this.app) {
      this.app.unmount()
      this.app = null
    }
  }

  override eq(other: WidgetType): boolean {
    // Two widgets are equal if they represent the same variable.
    // This allows CodeMirror to reuse widgets instead of recreating them.
    return (
      other instanceof PillWidget &&
      other.variableName === this.variableName &&
      other.pillColor === this.pillColor &&
      other.variableInfo.value === this.variableInfo.value &&
      other.variableInfo.hasValue === this.variableInfo.hasValue
    )
  }

  override ignoreEvent(): boolean {
    return false
  }
}

/**
 * Styles the active environment variable pill.
 * This plugin creates decorations for environment variables in the editor.
 */
export const pillPlugin = (props: { environment: XScalarEnvironment | undefined; isReadOnly: boolean | undefined }) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      lastEnvironment: XScalarEnvironment | undefined

      constructor(view: EditorView) {
        this.lastEnvironment = props.environment
        this.decorations = this.buildDecorations(view)
      }

      update(update: ViewUpdate): void {
        // Rebuild decorations if environment changed
        if (props.environment !== this.lastEnvironment) {
          this.lastEnvironment = props.environment
          this.decorations = this.buildDecorations(update.view)
          return
        }

        // Only rebuild decorations if document or viewport changed
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view)
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>()

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to)

          // Create a new regex instance to ensure lastIndex is reset
          const regex = new RegExp(REGEX.VARIABLES.source, REGEX.VARIABLES.flags)
          let match: RegExpExecArray | null

          while ((match = regex.exec(text)) !== null) {
            const start = from + match.index
            const end = start + match[0].length
            const variableName = match[1] ?? ''

            // Skip decorations that span line breaks as CodeMirror does not allow them
            const matchedText = view.state.doc.sliceString(start, end)
            if (matchedText.includes('\n')) {
              continue
            }

            builder.add(
              start,
              end,
              Decoration.widget({
                widget: new PillWidget(variableName, props.environment),
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

/**
 * Custom backspace handler for the editor.
 * Handles special cases like removing entire variable syntax and clearing all content.
 */
export const backspaceCommand = EditorView.domEventHandlers({
  keydown(event, view): boolean {
    if (event.key !== 'Backspace') {
      return false
    }

    const { state } = view
    const { from, to } = state.selection.main

    // When selecting all content and pressing backspace,
    // prevent breaking line content addition on pill removal
    if (from === 0 && to === state.doc.length) {
      view.dispatch({
        changes: { from: 0, to: state.doc.length },
        selection: { anchor: 0 },
      })
      event.preventDefault()
      return true
    }

    // When cursor is after a variable closing bracket (}}),
    // remove the entire closing syntax at once
    if (from === to && from >= 2) {
      const before = state.doc.sliceString(from - 2, from)
      if (before === '}}') {
        view.dispatch({
          changes: { from: from - 2, to: from },
          selection: { anchor: from - 2 },
        })
        event.preventDefault()
        return true
      }
    }

    return false
  },
})
