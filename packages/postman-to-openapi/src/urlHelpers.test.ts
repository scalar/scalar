import { describe, expect, it } from 'vitest'

import { extractPathParameterNames } from './helpers/urlHelpers'

describe('extractPathParameterNames', () => {
  it('should extract double curly brace parameters', () => {
    expect(extractPathParameterNames('/users/{{userId}}/posts/{{postId}}')).toEqual(['userId', 'postId'])
  })

  it('should extract single curly brace parameters', () => {
    expect(extractPathParameterNames('/users/{userId}/posts/{postId}}')).toEqual(['userId', 'postId'])
  })

  it('should extract colon parameters', () => {
    expect(extractPathParameterNames('/users/:userId/posts/:postId')).toEqual(['userId', 'postId'])
  })

  it('should deduplicate repeated parameters', () => {
    expect(extractPathParameterNames('/users/:id/posts/:id')).toEqual(['id'])
  })
})
