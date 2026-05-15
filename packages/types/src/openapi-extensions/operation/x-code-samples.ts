export type XCodeSample = {
  lang?: string
  label?: string
  source: string
}

export type XCodeSamples = {
  'x-codeSamples'?: XCodeSample[]
  'x-code-samples'?: XCodeSample[]
  'x-custom-examples'?: XCodeSample[]
}
