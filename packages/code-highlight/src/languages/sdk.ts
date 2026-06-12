import type { HLJSApi, LanguageFn, Mode } from 'highlight.js'

type LanguageModes = (hljs: HLJSApi) => Mode[]

const functionCallName =
  /\b(?!(?:as|await|catch|class|def|do|else|elsif|elif|enum|for|func|fun|guard|if|interface|new|return|sizeof|struct|switch|throw|try|typeof|using|when|while)\b)[A-Za-z_][A-Za-z0-9_]*[!?]?(?=\s*\()/

const propertyName = /\b[A-Za-z_][A-Za-z0-9_]*[!?]?/

const pascalTypeName = /\b[A-Z][A-Za-z0-9_]*(?:<[A-Za-z0-9_<>, ?:.]+>)?/

const sdkTypeNames =
  'Builder|Client|CURL|CURLcode|Console|Data|Error|HTTP|HTTPURLResponse|HeaderMap|HeaderValue|HttpClient|HttpMethod|HttpRequestMessage|IRestResponse|JSONSerialization|Map|MediaType|MediaTypeHeaderValue|Method|OkHttpClient|Object|ParameterType|Post|Request|RequestBody|Response|RestClient|RestRequest|String|StringContent|URL|URI|URLRequest|URLSession|Uri|curl_slist|string'

const sdkTypeName = new RegExp(`\\b(?:${sdkTypeNames})\\b`)

const sdkTypeCallName = new RegExp(`\\b(?:${sdkTypeNames})\\b(?=\\s*\\()`)

const constantName = /\b(?:CURL[A-Z0-9_]*|CURLOPT_[A-Z0-9_]+|[A-Z][A-Z0-9_]{2,})\b/

const namedArgument = /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*:)/

const operator = /=>|\?:|::|->|===|!==|==|!=|<=|>=|&&|\|\||[+\-*%=&|!<>?:]/

const methodCall = {
  match: [/(?:\.|::|->)/, functionCallName],
  scope: {
    1: 'punctuation',
    2: 'title.function',
  },
  relevance: 0,
} satisfies Mode

const methodCallWithArguments = (hljs: HLJSApi): Mode => ({
  begin: [/(?:\.|::|->)/, functionCallName],
  beginScope: {
    1: 'punctuation',
    2: 'title.function',
  },
  end: /\)/,
  excludeEnd: true,
  contains: argumentModes(hljs),
  relevance: 0,
})

const namespacedConstructorCallWithArguments = (hljs: HLJSApi): Mode => ({
  begin: [/(?:\.|::|->)/, sdkTypeCallName],
  beginScope: {
    1: 'punctuation',
    2: 'title.class',
  },
  end: /\)/,
  excludeEnd: true,
  contains: argumentModes(hljs),
  relevance: 0,
})

const propertyAccess = {
  match: [/(?:\.|::|->)/, propertyName],
  scope: {
    1: 'punctuation',
    2: 'attr',
  },
  relevance: 0,
} satisfies Mode

const namespacedSdkType = {
  match: [/(?:\.|::|->)/, sdkTypeName],
  scope: {
    1: 'punctuation',
    2: 'title.class',
  },
  relevance: 0,
} satisfies Mode

const standaloneFunctionCall = {
  match: functionCallName,
  scope: 'title.function',
  relevance: 0,
} satisfies Mode

const standaloneFunctionCallWithArguments = (hljs: HLJSApi): Mode => ({
  begin: functionCallName,
  beginScope: 'title.function',
  end: /\)/,
  excludeEnd: true,
  contains: argumentModes(hljs),
  relevance: 0,
})

const constructorCall = {
  match: sdkTypeCallName,
  scope: 'title.class',
  relevance: 0,
} satisfies Mode

const constructorCallWithArguments = (hljs: HLJSApi): Mode => ({
  begin: sdkTypeCallName,
  beginScope: 'title.class',
  end: /\)/,
  excludeEnd: true,
  contains: argumentModes(hljs),
  relevance: 0,
})

const namedArgumentMode = {
  match: namedArgument,
  scope: 'attr',
  relevance: 0,
} satisfies Mode

const sdkTypeMode = {
  match: sdkTypeName,
  scope: 'title.class',
  relevance: 0,
} satisfies Mode

const pascalTypeMode = {
  match: pascalTypeName,
  scope: 'title.class',
  relevance: 0,
} satisfies Mode

const constantMode = {
  match: constantName,
  scope: 'variable.constant',
  relevance: 0,
} satisfies Mode

const operatorMode = {
  match: operator,
  scope: 'operator',
  relevance: 0,
} satisfies Mode

const argumentModes = (hljs: HLJSApi): Mode[] => [
  hljs.QUOTE_STRING_MODE,
  hljs.APOS_STRING_MODE,
  hljs.C_NUMBER_MODE,
  namespacedSdkType,
  methodCall,
  constructorCall,
  standaloneFunctionCall,
  sdkTypeMode,
  constantMode,
  pascalTypeMode,
  namedArgumentMode,
  propertyAccess,
  operatorMode,
]

const sdkModes = (hljs: HLJSApi): Mode[] => [
  namespacedConstructorCallWithArguments(hljs),
  methodCallWithArguments(hljs),
  constructorCallWithArguments(hljs),
  standaloneFunctionCallWithArguments(hljs),
  ...argumentModes(hljs),
]

/**
 * Highlight.js grammars skip many call-site and SDK-client tokens that dominate
 * generated snippets. These additive modes keep the stock grammar behavior and
 * fill the common gaps with existing Scalar theme scopes.
 */
export const extendSdkLanguage =
  (language: LanguageFn, modes: LanguageModes = sdkModes): LanguageFn =>
  (hljs) => {
    const grammar = language(hljs)
    const extraModes = modes(hljs)

    return {
      ...grammar,
      contains: [...extraModes, ...(extendContains(grammar.contains, extraModes) as Mode[])],
    }
  }

const extendContains = (
  contains: ReadonlyArray<Mode | 'self'>,
  modes: Mode[],
  seen = new WeakMap<Mode, Mode>(),
): Array<Mode | 'self'> => contains.map((mode) => extendMode(mode, modes, seen))

const extendMode = (mode: Mode | 'self', modes: Mode[], seen: WeakMap<Mode, Mode>): Mode | 'self' => {
  if (mode === 'self') {
    return mode
  }

  const cachedMode = seen.get(mode)

  if (cachedMode) {
    return cachedMode
  }

  const extendedMode: Mode = { ...mode }
  seen.set(mode, extendedMode)

  const contains = getExtendedModeContains(mode, modes, seen)
  const variants = mode.variants?.map((variant) => extendMode(variant, modes, seen) as Mode)

  if (contains) {
    extendedMode.contains = contains
  }

  if (variants) {
    extendedMode.variants = variants
  }

  return extendedMode
}

const isLiteralMode = (mode: Mode): boolean => {
  const scope = typeof mode.scope === 'string' ? mode.scope : mode.className

  return scope === 'string' || scope === 'comment' || scope === 'regexp'
}

const isParameterMode = (mode: Mode): boolean => {
  const scope = typeof mode.scope === 'string' ? mode.scope : mode.className

  return scope === 'params'
}

const getExtendedModeContains = (
  mode: Mode,
  modes: Mode[],
  seen: WeakMap<Mode, Mode>,
): Array<Mode | 'self'> | undefined => {
  if (!mode.contains) {
    return undefined
  }

  if (isLiteralMode(mode)) {
    return mode.contains
  }

  const contains = extendContains(mode.contains, modes, seen)

  return isParameterMode(mode) ? [...modes, ...contains] : contains
}
