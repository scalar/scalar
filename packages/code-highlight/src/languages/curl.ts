import type { LanguageFn } from 'highlight.js'

/**
 * cURL grammar adapted from highlightjs-curl to avoid a CJS dependency.
 */
const curlLanguage: LanguageFn = (hljs) => {
  const quoteString = {
    className: 'string',
    begin: /"/,
    end: /"/,
    contains: [
      hljs.BACKSLASH_ESCAPE,
      {
        className: 'variable',
        begin: /\$\(/,
        end: /\)/,
        contains: [hljs.BACKSLASH_ESCAPE],
      },
    ],
    relevance: 0,
  }

  const optionRequest = {
    className: 'literal',
    begin: /(--request|-X)\s/,
    contains: [
      {
        className: 'symbol',
        begin: /(get|post|delete|options|head|put|patch|trace|connect)/,
        end: /\s/,
        returnEnd: true,
      },
    ],
    returnEnd: true,
    relevance: 10,
  }

  const option = {
    className: 'literal',
    begin: /--/,
    end: /[\s"]/,
    returnEnd: true,
    relevance: 0,
  }

  const optionSingle = {
    className: 'literal',
    begin: /-\w/,
    end: /[\s"]/,
    returnEnd: true,
    relevance: 0,
  }

  const escapedQuote = {
    className: 'string',
    begin: /\\"/,
    relevance: 0,
  }

  const aposString = {
    className: 'string',
    begin: /'/,
    end: /'/,
    relevance: 0,
  }

  const number = {
    className: 'number',
    variants: [{ begin: hljs.C_NUMBER_RE }],
    relevance: 0,
  }

  const pathMode = {
    match: /(\/[a-z._-]+)+/,
  }

  return {
    name: 'curl',
    aliases: ['curl'],
    keywords: 'curl',
    case_insensitive: true,
    contains: [
      optionRequest,
      option,
      optionSingle,
      quoteString,
      escapedQuote,
      aposString,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      number,
      pathMode,
    ],
  }
}

export default curlLanguage
