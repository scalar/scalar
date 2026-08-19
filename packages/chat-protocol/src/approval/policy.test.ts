import { describe, expect, it } from 'vitest'

import { editorApprovalPolicies, openApiApprovalPolicies, resolveApprovalDecision } from './policy'

describe('policy', () => {
  it('auto-executes GET requests on the OpenAPI surface', () => {
    expect(
      resolveApprovalDecision(openApiApprovalPolicies, 'execute-request', { method: 'GET', path: '/planets' }),
    ).toBe('auto')
    expect(
      resolveApprovalDecision(openApiApprovalPolicies, 'execute-request', { method: 'get', path: '/planets' }),
    ).toBe('auto')
  })

  it('requires approval for mutating requests on the OpenAPI surface', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(resolveApprovalDecision(openApiApprovalPolicies, 'execute-request', { method, path: '/planets' })).toBe(
        'approval',
      )
    }
  })

  it('requires approval when the input carries no method', () => {
    expect(resolveApprovalDecision(openApiApprovalPolicies, 'execute-request', {})).toBe('approval')
    expect(resolveApprovalDecision(openApiApprovalPolicies, 'execute-request', undefined)).toBe('approval')
  })

  it('expresses the shipped editor policy', () => {
    expect(resolveApprovalDecision(editorApprovalPolicies, 'write_file', { path: 'a.md', content: '' })).toBe(
      'approval',
    )
    expect(resolveApprovalDecision(editorApprovalPolicies, 'edit_file', { path: 'a.md' })).toBe('auto')
    expect(resolveApprovalDecision(editorApprovalPolicies, 'read_file', { path: 'a.md' })).toBe('auto')
  })

  it('defaults unregistered tools to approval', () => {
    expect(resolveApprovalDecision(editorApprovalPolicies, 'brand-new-tool', {})).toBe('approval')
  })

  it('honors an explicit default decision', () => {
    expect(resolveApprovalDecision({}, 'anything', {}, 'auto')).toBe('auto')
  })
})
