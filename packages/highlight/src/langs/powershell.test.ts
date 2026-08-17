import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import powershell from './powershell'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, so this is visible to every test
// below regardless of the order Vitest schedules files in.
registerLanguage(powershell)

const known = new Set(Object.keys(SCOPES))

/**
 * Idiomatic PowerShell, picked for the constructs that break regex tokenizers:
 * comment-based help, `-Parameter` versus `-eq` versus `Verb-Noun`, backtick
 * escapes, `$var` and `$( ... )` interpolation, both flavours of here-string,
 * attributes that look exactly like type literals, and numbers in every form.
 */
const SAMPLE = `#Requires -Version 7.0
<#
.SYNOPSIS
    Collects widget reports and writes a summary.
.PARAMETER Path
    Folder to scan. Wildcards are allowed.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$Path,

    [ValidateSet('json', 'csv')]
    [string]$Format = 'json',

    [int]$MaxItems = 0x1F,

    [switch]$Force
)

using namespace System.IO

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

enum Severity {
    Info = 0
    Warning = 1
}

class Widget {
    [string]$Name
    [double]$Weight

    Widget([string]$name) {
        $this.Name = $name
        $this.Weight = 1.5e3
    }
}

function Get-Widget {
    [CmdletBinding()]
    param([string]$Root = $env:WIDGET_HOME)

    $threshold = 10kb
    $mask = 0b1010
    foreach ($file in Get-ChildItem -Path $Root -Filter '*.json' -Recurse) {
        if ($file.Length -gt $threshold -and $file.Name -notmatch '^\\.') {
            Write-Verbose "Reading \`"$($file.FullName)\`" -- $($file.Length) bytes\`n"
            $data = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
            [Widget]::new($data.name)
        }
        elseif ($Force -or $mask -band 2) {
            Write-Warning ('Skipped {0}' -f $file.Name)
        }
    }
}

$widgets = Get-Widget -Root $Path -Verbose:$false |
    Where-Object { $_.Weight -ge 1.0 } |
    Sort-Object -Property Name -Descending |
    Select-Object -First ($MaxItems + 1)

$report = @"
Widgets:   $($widgets.Count)
Home:      \${env:WIDGET_HOME}
Escaped:   \`$notAVariable and a tab\`t
"@

$literal = @'
No $interpolation and no \`escapes in here.
'@

if ($widgets.Count -eq 0) {
    throw [System.IO.FileNotFoundException]::new("no widgets under '$Path'")
}
else {
    $report | Out-File -FilePath "$Path\\report.$Format" -Encoding utf8
    Write-Host "Wrote $($widgets.Count) widgets" -ForegroundColor Green
}

exit 0
`

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (code: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (code: string, lang: string): [string, string][] => {
  return runs(code, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (code: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(code, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

describe('powershell', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'powershell')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'powershell')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'powershell')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `powershell emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'powershell')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Every prefix, not a sampled one: a here-string opener or a `$(` that is
    // one character from complete is exactly what an editor sends on each
    // keystroke, and a state that never pops shows up here first.
    for (let end = 0; end <= SAMPLE.length; end++) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'powershell')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control keywords from declaration keywords', () => {
    assertHas(SAMPLE, 'powershell', 'foreach', 'keyword.control')
    assertHas(SAMPLE, 'powershell', 'function', 'keyword.declaration')
  })

  it('separates a command definition from a command call', () => {
    // The same name in both roles: `function Get-Widget` defines it, the
    // pipeline below calls it.
    assertHas(SAMPLE, 'powershell', 'Get-Widget', 'function')
    assertHas(SAMPLE, 'powershell', 'Get-Widget', 'function.call')
  })

  it('separates a comparison operator from a parameter and from a command name', () => {
    assertHas(SAMPLE, 'powershell', '-notmatch', 'keyword.operator')
    assertHas(SAMPLE, 'powershell', '-Recurse', 'variable.parameter')
    // `Get-ChildItem` must stay whole rather than splitting at its hyphen.
    assertHas(SAMPLE, 'powershell', 'Get-ChildItem', 'function.call')
  })

  it('separates a builtin type from a user type and from an attribute', () => {
    assertHas(SAMPLE, 'powershell', 'string', 'type.builtin')
    assertHas(SAMPLE, 'powershell', 'Widget', 'type')
    // Same bracket shape as a type; only the following `(` says otherwise.
    assertHas(SAMPLE, 'powershell', 'CmdletBinding', 'decorator')
  })

  it('separates a declared parameter from an ordinary variable', () => {
    assertHas(SAMPLE, 'powershell', '$Format', 'variable.parameter')
    assertHas(SAMPLE, 'powershell', '$widgets', 'variable')
    assertHas(SAMPLE, 'powershell', '$_', 'variable.builtin')
    assertHas(SAMPLE, 'powershell', 'env:', 'namespace')
  })

  it('scopes backtick escapes and interpolation inside a double-quoted string', () => {
    assertHas(SAMPLE, 'powershell', '`"', 'string.escape')
    assertHas(SAMPLE, 'powershell', '$(', 'interpolation')
    // The interpolation holds real code: `$file` and its member keep their scopes.
    assertHas(SAMPLE, 'powershell', '$file', 'variable')
    assertHas(SAMPLE, 'powershell', 'FullName', 'variable.member')
  })

  it('marks here-string delimiters and leaves the literal flavour literal', () => {
    assertHas(SAMPLE, 'powershell', '@"', 'string.special')
    assertHas(SAMPLE, 'powershell', "@'", 'string.special')
    // `$interpolation` inside `@' ... '@` is text, not a variable.
    const literal = "@'\n$name is literal\n'@"
    expect(scoped(literal, 'powershell').map(([, s]) => s)).toEqual(['string.special', 'string', 'string.special'])
  })

  it('reads comment-based help as documentation', () => {
    assertHas(SAMPLE, 'powershell', '.SYNOPSIS', 'comment.doc')
    assertHas(SAMPLE, 'powershell', '#Requires -Version 7.0', 'comment')
  })

  it('recognises numbers in every literal form', () => {
    for (const literal of ['0x1F', '0b1010', '10kb', '1.5e3', '1.0']) {
      assertHas(SAMPLE, 'powershell', literal, 'number')
    }
  })

  it('is case-insensitive, like the language', () => {
    const shouty = 'IF ($TRUE) { RETURN [STRING]$X }'
    assertHas(shouty, 'powershell', 'IF', 'keyword.control')
    assertHas(shouty, 'powershell', '$TRUE', 'boolean')
    assertHas(shouty, 'powershell', 'RETURN', 'keyword.control')
    assertHas(shouty, 'powershell', 'STRING', 'type.builtin')
  })
})
