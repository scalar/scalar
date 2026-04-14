import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { type MaybeRefOrGetter, type Ref, computed, onBeforeUnmount, ref, toValue, watch } from 'vue'

import type { CodeMirrorLanguage } from '../types'

/**
 * Cached reference to the lazily-loaded CodeMirror setup module.
 *
 * Declared at module level so it is shared across all hook instances
 *
 * The heavy CodeMirror packages are only downloaded once regardless of
 * how many editors are on the page.
 */
let _setup: typeof import('./codemirror-setup') | null = null
let _setupPromise: Promise<typeof import('./codemirror-setup')> | null = null

/** Load the CodeMirror setup module, caching the result. */
const loadSetup = (): Promise<typeof import('./codemirror-setup')> => {
  if (_setup) {
    return Promise.resolve(_setup)
  }
  if (!_setupPromise) {
    _setupPromise = import('./codemirror-setup').then((m) => {
      _setup = m
      return m
    })
  }
  return _setupPromise
}

/**
 * Prefetch the CodeMirror chunk without blocking.
 *
 * Call this as early as possible when you know a CodeMirror editor will be
 * needed soon, for example, when detecting `x-scalar-environments` in a
 * loaded OpenAPI document. The browser will start downloading the chunk in
 * the background so it is already cached by the time the first editor mounts.
 */
export const preloadCodeMirror = (): Promise<void> => loadSetup().then(() => undefined)

type BaseParameters = {
  /** Element Ref to mount codemirror to */
  codeMirrorRef: Ref<HTMLDivElement | null>
  /** List of optional extensions for the instance */
  extensions?: MaybeRefOrGetter<Extension[]>
  /** Whether to load a theme.*/
  withoutTheme?: MaybeRefOrGetter<boolean | undefined>
  /** Languages to support for syntax highlighting */
  language: MaybeRefOrGetter<CodeMirrorLanguage | undefined>
  /** Class names to apply to the instance */
  classes?: MaybeRefOrGetter<string[] | undefined>
  /** Put the editor into read-only mode */
  readOnly?: MaybeRefOrGetter<boolean | undefined>
  /** Disable indent with tab */
  disableTabIndent?: MaybeRefOrGetter<boolean | undefined>
  /** Option to show line numbers in the editor */
  lineNumbers?: MaybeRefOrGetter<boolean | undefined>
  withVariables?: MaybeRefOrGetter<boolean | undefined>
  forceFoldGutter?: MaybeRefOrGetter<boolean | undefined>
  disableEnter?: MaybeRefOrGetter<boolean | undefined>
  disableCloseBrackets?: MaybeRefOrGetter<boolean | undefined>
  /** Option to lint and show error in the editor */
  lint?: MaybeRefOrGetter<boolean | undefined>
  onBlur?: (v: string, event: FocusEvent) => void
  onFocus?: (v: string, event: FocusEvent) => void
  placeholder?: MaybeRefOrGetter<string | undefined>
}

export type UseCodeMirrorParameters =
  | (BaseParameters & {
      /** Prefill the content. Will be ignored when a provider is given. */
      content: MaybeRefOrGetter<string | undefined>
      onChange?: (v: string) => void
    })
  | (BaseParameters & {
      provider: MaybeRefOrGetter<Extension | null>
      content?: MaybeRefOrGetter<string | undefined>
      onChange?: (v: string) => void
    })

/** Check if the hook has a provider. In provider mode we ignore the content variable */
const hasProvider = (
  params: UseCodeMirrorParameters,
): params is BaseParameters & {
  content?: MaybeRefOrGetter<string | undefined>
  provider: MaybeRefOrGetter<Extension>
} => 'provider' in params && !!toValue(params.provider)

/** Reactive CodeMirror Integration */
export const useCodeMirror = (
  params: UseCodeMirrorParameters,
): {
  setCodeMirrorContent: (content?: string) => void
  codeMirror: Ref<EditorView | null>
} => {
  const codeMirror: Ref<EditorView | null> = ref(null)

  /** Set the codemirror content value */
  const setCodeMirrorContent = (newValue = '') => {
    if (!codeMirror.value) {
      return
    }

    // No need to set the CodeMirror content if nothing has changed
    if (codeMirror.value.state.doc.toString() === newValue) {
      return
    }

    codeMirror.value.dispatch({
      changes: {
        from: 0,
        to: codeMirror.value.state.doc.length,
        insert: newValue,
      },
      selection: {
        anchor: Math.min(codeMirror.value.state.selection.main.anchor, newValue.length),
      },
    })
  }

  // All options except provider
  const extensionConfig = computed(() => ({
    onChange: params.onChange,
    onBlur: params.onBlur,
    onFocus: params.onFocus,
    disableTabIndent: toValue(params.disableTabIndent),
    language: toValue(params.language),
    classes: toValue(params.classes),
    readOnly: toValue(params.readOnly),
    lineNumbers: toValue(params.lineNumbers),
    withVariables: toValue(params.withVariables),
    forceFoldGutter: toValue(params.forceFoldGutter),
    disableEnter: toValue(params.disableEnter),
    disableCloseBrackets: toValue(params.disableCloseBrackets),
    withoutTheme: toValue(params.withoutTheme),
    lint: toValue(params.lint),
    additionalExtensions: toValue(params.extensions),
    placeholder: toValue(params.placeholder),
  }))

  // ---------------------------------------------------------------------------

  /**
   * Mount (or remount) the CodeMirror editor.
   *
   * Lazily loads the CodeMirror setup chunk on the first call. Subsequent
   * calls reuse the already-loaded module synchronously.
   */
  const mountCodeMirror = async (): Promise<void> => {
    // Capture the current target before awaiting so we can bail out if the
    // ref changed while the chunk was loading (e.g. the component unmounted).
    const mountTarget = params.codeMirrorRef.value
    if (!mountTarget) {
      return
    }

    const setup = await loadSetup()

    // Bail out if the ref changed or the element was removed from the DOM.
    if (params.codeMirrorRef.value !== mountTarget || !mountTarget.isConnected) {
      return
    }

    const provider = hasProvider(params) ? toValue(params.provider) : null
    const extensions = setup.getCodeMirrorExtensions({
      ...extensionConfig.value,
      provider,
    })

    codeMirror.value = new setup.EditorView({
      parent: mountTarget,
      extensions,
    })

    // Set the initial content if a provider is not in use
    if (!hasProvider(params)) {
      setCodeMirrorContent(toValue(params.content))
    }
  }

  // Unmounts CodeMirror if it's mounted already, and mounts CodeMirror, if the given ref exists.
  watch(
    params.codeMirrorRef,
    () => {
      codeMirror.value?.destroy()
      void mountCodeMirror()
    },
    { immediate: true },
  )

  // Cleanup codemirror
  onBeforeUnmount(() => codeMirror.value?.destroy())

  // ---------------------------------------------------------------------------

  // Provider must be watched separately because we need to restart codemirror if the provider changes
  watch(
    () => (hasProvider(params) ? toValue(params.provider) : null),
    () => {
      if (hasProvider(params)) {
        codeMirror.value?.destroy()
        void mountCodeMirror()
      }
    },
  )

  // Update the extensions whenever parameters change.
  // Uses the cached setup module — if the editor is not yet mounted (setup
  // not loaded) `codeMirror.value` will be null and we return early. Once
  // the editor is mounted the setup is guaranteed to be in the cache.
  watch(
    extensionConfig,
    () => {
      const setup = _setup
      if (!codeMirror.value || !setup) {
        return
      }
      // If a provider is

      const provider = hasProvider(params) ? toValue(params.provider) : null
      const extensions = setup.getCodeMirrorExtensions({
        ...extensionConfig.value,
        provider,
      })

      requestAnimationFrame(() => {
        codeMirror.value?.dispatch({
          effects: setup.StateEffect.reconfigure.of(extensions),
        })
      })
    },
    { immediate: true },
  )

  // ---------------------------------------------------------------------------

  // Keep the content in sync when the content is managed externally
  watch(
    () => toValue(params.content),
    () => {
      // When a provider is in use we do not map the content value back to the codemirror instance
      if (hasProvider(params)) {
        return
      }

      setCodeMirrorContent(toValue(params.content))
    },
    { immediate: true },
  )

  return {
    /** Replaces the current content with the given value. */
    setCodeMirrorContent,
    /** Codemirror instance */
    codeMirror,
  }
}
