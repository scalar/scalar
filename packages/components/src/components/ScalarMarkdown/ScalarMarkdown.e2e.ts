import { test, takeSnapshot } from '@test/helpers'

test.describe('ScalarMarkdown', () =>
  ['Alerts', 'Blockquotes', 'Codeblocks', 'Headers', 'Html', 'Inline', 'Lists', 'Paragraphs', 'Tables'].forEach(
    (story) => test(story, takeSnapshot),
  ))
