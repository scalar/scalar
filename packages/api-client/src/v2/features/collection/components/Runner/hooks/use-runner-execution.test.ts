import { describe, expect, it } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import { type RunResult, type TestResult, useRunnerExecution } from './use-runner-execution'
import type { SelectedItem } from './use-runner-selection'

const createMockSelectedItem = (overrides: Partial<SelectedItem> = {}): SelectedItem => ({
  id: '/pets|get|default',
  path: '/pets',
  method: 'get',
  exampleKey: 'default',
  label: 'GET /pets — default',
  ...overrides,
})

const createMockRunResult = (overrides: Partial<RunResult> = {}): RunResult => ({
  item: createMockSelectedItem(),
  result: null,
  error: null,
  testResults: [],
  ...overrides,
})

const createMockTestResult = (overrides: Partial<TestResult> = {}): TestResult => ({
  title: 'Test',
  passed: true,
  duration: 10,
  status: 'passed',
  ...overrides,
})

const createHook = (selectedItems: SelectedItem[] = []) => {
  const selectedOrder = ref(selectedItems)
  return useRunnerExecution({
    workspaceStore: {} as never,
    document: null,
    documentName: 'test-doc',
    isWeb: false,
    selectedOrder: computed(() => selectedOrder.value),
  })
}

describe('useRunnerExecution', () => {
  describe('initial state', () => {
    it('initializes with correct default values', () => {
      const hook = createHook()

      expect(hook.isRunning.value).toBe(false)
      expect(hook.hasRunCompleted.value).toBe(false)
      expect(hook.currentRunIndex.value).toBe(null)
      expect(hook.runResults.value).toEqual([])
      expect(hook.runSummary.value).toBe(null)
    })
  })

  describe('run', () => {
    it('does not run when document is null', async () => {
      const hook = createHook([createMockSelectedItem()])

      await hook.run()

      expect(hook.isRunning.value).toBe(false)
      expect(hook.hasRunCompleted.value).toBe(false)
    })

    it('does not run when selectedOrder is empty', async () => {
      const selectedOrder = ref<SelectedItem[]>([])
      const hook = useRunnerExecution({
        workspaceStore: {} as never,
        document: { openapi: '3.1.0' } as never,
        documentName: 'test-doc',
        isWeb: false,
        selectedOrder: computed(() => selectedOrder.value),
      })

      await hook.run()

      expect(hook.isRunning.value).toBe(false)
      expect(hook.hasRunCompleted.value).toBe(false)
    })
  })

  describe('clearResults', () => {
    it('resets all result state', () => {
      const hook = createHook()

      hook.runResults.value = [createMockRunResult()]
      hook.hasRunCompleted.value = true

      hook.clearResults()

      expect(hook.runResults.value).toEqual([])
      expect(hook.hasRunCompleted.value).toBe(false)
    })
  })

  describe('getResultAtIndex', () => {
    it('returns result at valid index', () => {
      const hook = createHook()
      const result = createMockRunResult()
      hook.runResults.value = [result]

      expect(hook.getResultAtIndex(0)).toStrictEqual(result)
    })

    it('returns null for invalid index', () => {
      const hook = createHook()
      hook.runResults.value = [createMockRunResult()]

      expect(hook.getResultAtIndex(5)).toBe(null)
      expect(hook.getResultAtIndex(-1)).toBe(null)
    })

    it('returns null for empty results', () => {
      const hook = createHook()

      expect(hook.getResultAtIndex(0)).toBe(null)
    })
  })

  describe('isResultPassed', () => {
    it('returns false for null result', () => {
      const hook = createHook()

      expect(hook.isResultPassed(null)).toBe(false)
    })

    it('returns false when result has error', () => {
      const hook = createHook()
      const result = createMockRunResult({ error: new Error('Failed') })

      expect(hook.isResultPassed(result)).toBe(false)
    })

    it('returns false when any test failed', () => {
      const hook = createHook()
      const result = createMockRunResult({
        testResults: [createMockTestResult({ passed: true }), createMockTestResult({ passed: false })],
      })

      expect(hook.isResultPassed(result)).toBe(false)
    })

    it('returns true when no error and all tests passed', () => {
      const hook = createHook()
      const result = createMockRunResult({
        testResults: [createMockTestResult({ passed: true }), createMockTestResult({ passed: true })],
      })

      expect(hook.isResultPassed(result)).toBe(true)
    })

    it('returns true when no error and no tests', () => {
      const hook = createHook()
      const result = createMockRunResult({ testResults: [] })

      expect(hook.isResultPassed(result)).toBe(true)
    })
  })

  describe('isResultSkipped', () => {
    it('returns false when run has not completed', () => {
      const hook = createHook()
      hook.hasRunCompleted.value = false

      expect(hook.isResultSkipped(0)).toBe(false)
    })

    it('returns false when result exists at index', () => {
      const hook = createHook()
      hook.hasRunCompleted.value = true
      hook.runResults.value = [createMockRunResult()]

      expect(hook.isResultSkipped(0)).toBe(false)
    })

    it('returns true when run completed but no result at index', () => {
      const hook = createHook()
      hook.hasRunCompleted.value = true
      hook.runResults.value = [createMockRunResult()]

      expect(hook.isResultSkipped(1)).toBe(true)
    })
  })

  describe('getFailedTests', () => {
    it('returns empty array for null result', () => {
      const hook = createHook()

      expect(hook.getFailedTests(null)).toEqual([])
    })

    it('returns empty array when all tests passed', () => {
      const hook = createHook()
      const result = createMockRunResult({
        testResults: [createMockTestResult({ passed: true }), createMockTestResult({ passed: true })],
      })

      expect(hook.getFailedTests(result)).toEqual([])
    })

    it('returns only failed tests', () => {
      const hook = createHook()
      const failedTest = createMockTestResult({ title: 'Failed test', passed: false })
      const passedTest = createMockTestResult({ title: 'Passed test', passed: true })
      const result = createMockRunResult({
        testResults: [passedTest, failedTest],
      })

      const failed = hook.getFailedTests(result)

      expect(failed).toHaveLength(1)
      expect(failed[0]).toBe(failedTest)
    })
  })

  describe('runSummary', () => {
    it('returns null when no results and run not completed', () => {
      const hook = createHook()

      expect(hook.runSummary.value).toBe(null)
    })

    it('computes summary when run completed', async () => {
      const selectedOrder = ref([
        createMockSelectedItem({ id: '1' }),
        createMockSelectedItem({ id: '2' }),
        createMockSelectedItem({ id: '3' }),
      ])
      const hook = useRunnerExecution({
        workspaceStore: {} as never,
        document: null,
        documentName: 'test-doc',
        isWeb: false,
        selectedOrder: computed(() => selectedOrder.value),
      })

      hook.hasRunCompleted.value = true
      hook.runResults.value = [
        createMockRunResult({ testResults: [createMockTestResult({ passed: true })] }),
        createMockRunResult({ error: new Error('Failed') }),
      ]

      await nextTick()

      expect(hook.runSummary.value).toEqual({
        total: 3,
        passed: 1,
        failed: 1,
        skipped: 1,
        duration: null,
        allPassed: false,
      })
    })

    it('reports allPassed true when all passed and none skipped', async () => {
      const selectedOrder = ref([createMockSelectedItem()])
      const hook = useRunnerExecution({
        workspaceStore: {} as never,
        document: null,
        documentName: 'test-doc',
        isWeb: false,
        selectedOrder: computed(() => selectedOrder.value),
      })

      hook.hasRunCompleted.value = true
      hook.runResults.value = [createMockRunResult({ testResults: [createMockTestResult({ passed: true })] })]

      await nextTick()

      expect(hook.runSummary.value?.allPassed).toBe(true)
    })
  })
})
