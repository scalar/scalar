import type { Grammar } from '../core/types'

/**
 * Unified diffs and `git diff` output, plus the older context (`diff -c`) and
 * normal (`diff`) formats that still turn up in READMEs and mailing lists.
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
        // Few alternatives on purpose: diffs are large and simple, so each
        // extra one is a measurable share of the time spent on them.
        //
        // Metadata: git's extended headers, svn's `Index:` and the `====` rule
        // under it, `diff -r` notes, `#` lines in a patch being edited by
        // `git add -p`, and `\ No newline at end of file`.
        {
          match:
            '^(?:(?:diff|index|new file|deleted file|old mode|new mode|similarity index|rename|Index:|Only in|Binary files) |={3,}|#|\\\\)[^\\n]*',
          scope: 'comment',
        },
        // Hunk markers: unified `@@`, context `***************`, `*** 1,5 ****`
        // and `--- 1,6 ----`, and a normal-format command such as `12,14c12`.
        // Ahead of the file headers, which also start with `***` and `---`.
        {
          match:
            '^(?:@@|\\*{15}|\\*{3} \\d+(?:,\\d+)? \\*{4}|-{3} \\d+(?:,\\d+)? -{4}|\\d+(?:,\\d+)?[acd]\\d+(?:,\\d+)?$)[^\\n]*',
          scope: 'keyword',
        },
        { match: '^(?:---|\\+\\+\\+|\\*\\*\\*)[^\\n]*', scope: 'heading' },
        { match: '^[+>][^\\n]*', scope: 'diff.plus' },
        { match: '^[-<][^\\n]*', scope: 'diff.minus' },
      ],
    },
  },
}

export default diff
