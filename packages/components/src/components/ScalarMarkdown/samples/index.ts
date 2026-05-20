import alerts from './alerts'
import blockquotes from './blockquotes'
import codeblocks from './codeblocks'
import document from './document'
import headers from './headers'
import html from './html'
import inline from './inline'
import listsEdge from './lists-edge'
import listsInteractions from './lists-interactions'
import listsMixed from './lists-mixed'
import listsOrdered from './lists-ordered'
import listsTasks from './lists-tasks'
import listsUnordered from './lists-unordered'
import paragraphs from './paragraphs'
import tables from './tables'

export const samples = [
  /** Full Markdown Document */
  { label: 'Document', key: 'document', value: document },
  /** Alerts */
  { label: 'Alerts', key: 'alerts', value: alerts },
  /** Blockquotes */
  { label: 'Blockquotes', key: 'blockquotes', value: blockquotes },
  /** Codeblocks */
  { label: 'Codeblocks', key: 'codeblocks', value: codeblocks },
  /** Headers */
  { label: 'Headers', key: 'headers', value: headers },
  /** HTML */
  { label: 'HTML', key: 'html', value: html },
  /** Inline */
  { label: 'Inline', key: 'inline', value: inline },
  /** Lists */
  { label: 'Unordered Lists', key: 'lists-unordered', value: listsUnordered },
  { label: 'Ordered Lists', key: 'lists-ordered', value: listsOrdered },
  { label: 'Task Lists', key: 'lists-task', value: listsTasks },
  { label: 'Mixed Lists', key: 'lists-mixed', value: listsMixed },
  { label: 'List Interactions', key: 'lists-interactions', value: listsInteractions },
  { label: 'List Edge Cases', key: 'lists-edge-cases', value: listsEdge },
  /** Paragraphs */
  { label: 'Paragraphs', key: 'paragraphs', value: paragraphs },
  /** Tables */
  { label: 'Tables', key: 'tables', value: tables },
] as const satisfies { label: string; key: string; value: string }[]
