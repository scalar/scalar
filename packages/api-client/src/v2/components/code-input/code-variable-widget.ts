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
import { type ContextFunctionName, getContextFunctionComment } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { createApp } from 'vue'

import PillTooltipHost from './PillTooltipHost.vue'
import type { PillContext } from './pill-context'

/**
 * Displays `{{name}}` as a pill: environment variables show the resolved value;
 * context functions (e.g. `{{$guid}}`) show that the value is generated at send time.
 */
class PillWidget extends WidgetType {
  private app: any
  private readonly pillColor: string
  private readonly variableInfo: PillContext

  constructor(
    private readonly variableName: string,
    environment: XScalarEnvironment | undefined,
    variant: PillContext['type'],
  ) {
    super()
    if (variant === 'contextFunction') {
      this.pillColor = 'var(--scalar-color-3)'
      this.variableInfo = {
        type: 'contextFunction',
        identifier: variableName,
        details: getContextFunctionComment(variableName as ContextFunctionName),
      }
      return
    }

    this.pillColor = environment?.color || 'var(--scalar-color-1)'

    const variable = environment?.variables?.find((v) => v.name === variableName)
    const value = variable ? (typeof variable.value === 'string' ? variable.value : variable.value?.default) : undefined
    this.variableInfo = {
      type: 'environment',
      name: variableName,
      value: value || 'No value',
      isDefined: Boolean(value),
    }
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = this.variableInfo.type === 'contextFunction' ? 'cm-pill cm-pill--context-fn' : 'cm-pill'
    span.textContent = this.variableName

    span.style.setProperty('--tw-bg-base', this.pillColor)

    if (this.variableInfo.type === 'environment') {
      span.style.opacity = this.variableInfo.isDefined ? '1' : '0.5'
    }

    this.app = createApp(PillTooltipHost, {
      context: this.variableInfo,
    })
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
    if (!(other instanceof PillWidget)) {
      return false
    }
    if (
      other.variableName !== this.variableName ||
      other.pillColor !== this.pillColor ||
      other.variableInfo.type !== this.variableInfo.type
    ) {
      return false
    }
    const a = other.variableInfo
    const b = this.variableInfo
    if (a.type !== b.type) {
      return false
    }
    if (a.type === 'environment' && b.type === 'environment') {
      return a.name === b.name && a.value === b.value && a.isDefined === b.isDefined
    }
    if (a.type === 'contextFunction' && b.type === 'contextFunction') {
      return a.identifier === b.identifier && a.details === b.details
    }
    return false
  }

  override ignoreEvent(): boolean {
    return false
  }
}

/**
 * Styles the active environment variable pill.
 * This plugin creates decorations for environment variables in the editor.
 */
export const pillPlugin = (props: {
  environment: XScalarEnvironment | undefined
  isReadOnly: boolean | undefined
  isContextFunctionName?: (name: string) => boolean
}) =>
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
        const isContextFn = props.isContextFunctionName ?? (() => false)

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

            const variant: PillContext['type'] = isContextFn(variableName) ? 'contextFunction' : 'environment'

            builder.add(
              start,
              end,
              Decoration.widget({
                widget: new PillWidget(variableName, props.environment, variant),
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
