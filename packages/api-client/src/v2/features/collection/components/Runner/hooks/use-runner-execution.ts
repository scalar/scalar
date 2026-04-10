import { useLoadingState } from '@scalar/components'
import { executePostResponseScript, executePreRequestScript, getScript } from '@scalar/pre-post-request-scripts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import {
  type BuildRequestExampleContext,
  buildRequest,
  createVariablesStoreForRequest,
  getEnvironmentVariables,
  getRequestExampleContext,
  requestFactory,
} from '@scalar/workspace-store/request-example'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type ComputedRef, type Ref, computed, ref } from 'vue'

import { isElectron } from '@/libs/electron'
import { type ResponseInstance, sendRequest } from '@/v2/blocks/operation-block/helpers/send-request'
import { APP_VERSION } from '@/v2/constants'
import { tryCatch } from '@/v2/helpers/safe-run'

import type { SelectedItem } from './use-runner-selection'

export type TestResult = {
  title: string
  passed: boolean
  duration: number
  error?: string
  status: 'pending' | 'passed' | 'failed'
}

export type RunResult = {
  item: SelectedItem
  result: ResponseInstance | null
  error: Error | null
  testResults: TestResult[]
}

export type RunSummary = {
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number | null
  allPassed: boolean
}

type UseRunnerExecutionOptions = {
  /** Workspace store */
  workspaceStore: WorkspaceStore
  /** Document */
  document: OpenApiDocument | null
  /** Document name */
  documentName: string
  /** Whether the layout is web */
  isWeb: boolean
  /** Ordered list of selected items to run */
  selectedOrder: ComputedRef<SelectedItem[]>
}

type UseRunnerExecutionReturn = {
  /** Whether a run is currently in progress */
  isRunning: Ref<boolean>
  /** Whether a run has completed */
  hasRunCompleted: Ref<boolean>
  /** Current index being run (1-based) */
  currentRunIndex: Ref<number | null>
  /** Loading state for the run button */
  runLoader: ReturnType<typeof useLoadingState>
  /** Results from the run */
  runResults: Ref<RunResult[]>
  /** Summary of the run results */
  runSummary: ComputedRef<RunSummary | null>
  /** Start running the selected items */
  run: () => Promise<void>
  /** Clear results and run again */
  rerun: () => void
  /** Clear all results */
  clearResults: () => void
  /** Get the result at a specific index */
  getResultAtIndex: (index: number) => RunResult | null
  /** Check if a result passed */
  isResultPassed: (result: RunResult | null) => boolean
  /** Check if a result was skipped */
  isResultSkipped: (index: number) => boolean
  /** Get failed tests from a result */
  getFailedTests: (result: RunResult | null) => TestResult[]
}

/**
 * Composable for managing runner execution state and logic.
 */
export function useRunnerExecution({
  workspaceStore,
  document,
  documentName,
  isWeb,
  selectedOrder,
}: UseRunnerExecutionOptions): UseRunnerExecutionReturn {
  const isRunning = ref(false)
  const hasRunCompleted = ref(false)
  const currentRunIndex = ref<number | null>(null)
  const runLoader = useLoadingState()
  const runResults = ref<RunResult[]>([])
  const runStartTime = ref<number | null>(null)
  const runEndTime = ref<number | null>(null)

  const runSummary = computed<RunSummary | null>(() => {
    if (runResults.value.length === 0 && !hasRunCompleted.value) {
      return null
    }
    const ran = runResults.value.length
    const total = selectedOrder.value.length
    const passed = runResults.value.filter((r) => !r.error && r.testResults.every((t) => t.passed)).length
    const failed = ran - passed
    const skipped = total - ran
    const duration = runStartTime.value && runEndTime.value ? runEndTime.value - runStartTime.value : null
    const allPassed = failed === 0 && skipped === 0
    return { total, passed, failed, skipped, duration, allPassed }
  })

  const clearResults = () => {
    runResults.value = []
    hasRunCompleted.value = false
    runStartTime.value = null
    runEndTime.value = null
  }

  const rerun = () => {
    clearResults()
    void run()
  }

  const getResultAtIndex = (index: number): RunResult | null => {
    return runResults.value[index] ?? null
  }

  const isResultPassed = (result: RunResult | null): boolean => {
    if (!result) {
      return false
    }
    if (result.error) {
      return false
    }
    if (result.testResults.some((t) => !t.passed)) {
      return false
    }
    return true
  }

  const isResultSkipped = (index: number): boolean => {
    return hasRunCompleted.value && getResultAtIndex(index) === null
  }

  const getFailedTests = (result: RunResult | null): TestResult[] => {
    if (!result) {
      return []
    }
    return result.testResults.filter((t) => !t.passed)
  }

  const getContext = (item: SelectedItem) => {
    const contextResult = getRequestExampleContext(
      workspaceStore,
      documentName,
      { path: item.path, method: item.method, exampleName: item.exampleKey },
      {
        fallbackDocument: document,
        isElectron: isElectron(),
        layout: isWeb ? 'web' : 'other',
        appVersion: APP_VERSION,
      },
    )

    return contextResult
  }

  const getRequestFactory = (ctx: BuildRequestExampleContext, item: SelectedItem) => {
    const globalCookies = [...ctx.cookies.workspace, ...ctx.cookies.document]
    return requestFactory({
      defaultHeaders: ctx.headers.default,
      environment: ctx.environment.environment,
      exampleName: item.exampleKey,
      globalCookies,
      method: item.method,
      operation: ctx.operation,
      path: item.path,
      proxyUrl: ctx.proxy.url ?? '',
      server: ctx.servers.selected,
      selectedSecuritySchemes: ctx.security.selectedSchemes,
      isElectron: isElectron(),
    })
  }

  const run = async () => {
    if (isRunning.value || !document || selectedOrder.value.length === 0) {
      return
    }

    isRunning.value = true
    hasRunCompleted.value = false
    runLoader.start()
    runResults.value = []
    currentRunIndex.value = 0
    runStartTime.value = performance.now()
    runEndTime.value = null

    const variablesStore = createVariablesStoreForRequest()

    // Run each item in the selected order
    for (let i = 0; i < selectedOrder.value.length; i++) {
      currentRunIndex.value = i + 1
      const item = selectedOrder.value[i]!

      // Create a run result for the current item
      const runResult: RunResult = {
        item,
        result: null,
        error: null,
        testResults: [],
      }

      try {
        const contextResult = getContext(item)

        if (!contextResult.ok) {
          runResult.error = new Error(contextResult.error)
          runResults.value = [...runResults.value, runResult]
          continue
        }

        const { request: requestBuilder } = getRequestFactory(contextResult.data, item)

        const preRequestScript = getScript(document['x-pre-request'], contextResult.data.operation['x-pre-request'])
        await executePreRequestScript(preRequestScript, {
          requestBuilder,
          variablesStore,
          onTestResultsUpdate: (newResults) => {
            runResult.testResults = [...newResults]
          },
        })

        const envVariables = {
          ...getEnvironmentVariables(contextResult.data.environment.environment),
          ...variablesStore.getVariables(),
        }

        const requestResult = await tryCatch(() => {
          return buildRequest(requestBuilder, { envVariables })
        })

        if (!requestResult.ok) {
          runResult.error = new Error(requestResult.error)
          runResults.value = [...runResults.value, runResult]
          continue
        }

        const [sendError, sendResult] = await sendRequest({
          isUsingProxy: requestResult.data.isUsingProxy,
          request: requestResult.data.request,
        })

        if (sendError) {
          runResult.error = sendError
          runResults.value = [...runResults.value, runResult]
          continue
        }

        runResult.result = sendResult.response

        const postResponseScript = getScript(
          document['x-post-response'],
          contextResult.data.operation['x-post-response'],
        )

        const preRequestResults = [...runResult.testResults]
        await executePostResponseScript(postResponseScript, {
          requestBuilder,
          response: sendResult.originalResponse.clone(),
          variablesStore,
          onTestResultsUpdate: (postResponseResults) => {
            runResult.testResults = [...preRequestResults, ...postResponseResults]
          },
        })

        runResults.value = [...runResults.value, runResult]

        const hasTestFailure = runResult.testResults.some((t) => !t.passed)
        if (hasTestFailure) {
          break
        }
      } catch (error) {
        runResult.error = error instanceof Error ? error : new Error(String(error))
        runResults.value = [...runResults.value, runResult]
        break
      }
    }

    isRunning.value = false
    hasRunCompleted.value = true
    runEndTime.value = performance.now()
    void runLoader.clear()
    currentRunIndex.value = null
  }

  return {
    isRunning,
    hasRunCompleted,
    currentRunIndex,
    runLoader,
    runResults,
    runSummary,
    run,
    rerun,
    clearResults,
    getResultAtIndex,
    isResultPassed,
    isResultSkipped,
    getFailedTests,
  }
}
