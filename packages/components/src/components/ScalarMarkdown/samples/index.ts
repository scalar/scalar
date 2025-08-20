import alerts from './alerts'
import blockquotes from './blockquotes'
import codeblocks from './codeblocks'
import document from './document'
import headers from './headers'
import html from './html'
import inline from './inline'
import lists from './lists'
import paragraphs from './paragraphs'
import tables from './tables'

export const samples = [
  /** Full Markdown Document */
  { label: 'Document', value: document },
  /** Alerts */
  { label: 'Alerts', value: alerts },
  /** Blockquotes */
  { label: 'Blockquotes', value: blockquotes },
  /** Codeblocks */
  { label: 'Codeblocks', value: codeblocks },
  /** Headers */
  { label: 'Headers', value: headers },
  /** HTML */
  { label: 'HTML', value: html },
  /** Inline */
  { label: 'Inline', value: inline },
  /** Lists */
  { label: 'Lists', value: lists },
  /** Paragraphs */
  { label: 'Paragraphs', value: paragraphs },
  /** Tables */
  { label: 'Tables', value: tables },
] as const
