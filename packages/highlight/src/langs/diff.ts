import type { Grammar } from '../core/types'

/**
 * Unified diffs and `git diff` output.
 *
 * Whole lines are scoped, which lets a theme give added and removed lines a
 * background tint rather than only recoloring the leading sign.
 */
const diff: Grammar = {
  name: 'diff',
  aliases: ['patch'],
  states: {
    root: {
      rules: [
        {
          match: '^(?:diff|index|new file|deleted file|old mode|new mode|similarity index|rename) [^\\n]*',
          scope: 'comment',
        },
        { match: '^(?:---|\\+\\+\\+)[^\\n]*', scope: 'heading' },
        { match: '^@@[^\\n]*', scope: 'keyword' },
        { match: '^\\+[^\\n]*', scope: 'diff.plus' },
        { match: '^-[^\\n]*', scope: 'diff.minus' },
        { match: '^\\\\[^\\n]*', scope: 'comment' },
      ],
    },
  },
}

export default diff
