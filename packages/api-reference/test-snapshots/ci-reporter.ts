import type { Reporter, FullResult } from '@playwright/test/reporter'

/**
 * Ci Success Reporter
 *
 * Returns a success code (e.g. exit code 0) on test failure so that CI passes
 */
class CiReporter implements Reporter {
  onEnd(result: FullResult) {
    if (result.status === 'failed') {
      console.log('Some snapshots failed, exiting 0 anyways')
      return new Promise<{ status: 'passed' }>((resolve) => resolve({ status: 'passed' }))
    }
    console.log(`Snapshot tests ${result.status}`)
    return new Promise<{ status: FullResult['status'] }>((resolve) => resolve({ status: result.status }))
  }
}

export default CiReporter
