import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import lua from './lua'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(lua)

const known = new Set(Object.keys(SCOPES))

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

/** Whether `run` sits in `pairs` starting at `i`, comparing text and scope. */
const matchesAt = (pairs: [string, string][], run: [string, string][], i: number): boolean => {
  return run.every((p, j) => pairs[i + j]?.[0] === p[0] && pairs[i + j]?.[1] === p[1])
}

/**
 * Where `run` appears in `pairs` as a contiguous block, or -1.
 *
 * Comparing a whole stretch of the stream is what catches a context-sensitive
 * rule that flattens scopes rather than moving one: an assertion on a single
 * name would still pass while every other name in the list lost its colour.
 */
const indexOfRun = (pairs: [string, string][], run: [string, string][]): number => {
  for (let i = 0; i + run.length <= pairs.length; i++) {
    if (matchesAt(pairs, run, i)) return i
  }
  return -1
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

/**
 * Idiomatic Lua, chosen for the constructs that break regex tokenizers:
 * level-matched long brackets holding shallower ones, long comments beside line
 * comments, `\z` and `\u{…}` escapes, `:` method definitions beside `.` field
 * definitions, varargs, table constructors with both an array and a key part,
 * `goto` with its label, and every numeric literal form Lua has.
 */
const SAMPLE = `#!/usr/bin/env lua
--- Trip statistics for one bike-share station.
--- @module trips
--- @param rows table Raw rows straight off the CSV reader.

--[[
  Durations arrive in seconds; everything downstream wants minutes, so the
  conversion happens here and nowhere else.
]]

local Trips = {}
Trips.__index = Trips

local TITLE = [[Trips ]] .. _VERSION
local USAGE = [==[
  usage: trips [[--verbose]] <path>
]==]

local ESCAPES = "tab:\\there\\9 quote:\\" newline:\\n bike:\\u{1F6B2} \\z
                 and this is still the same string"

local MAX_GAP <const> = 0x1p4
local RATES = { 0.25, 1e-3, .5, 314.16e-2, 0xA23p-4, 0X1.921FB54442D18P+1, 0xff }

function Trips.new(station, rows)
  local self = setmetatable({}, Trips)
  self.station = station
  self.rows = rows or {}
  self.total = 0
  return self
end

function Trips:add(row, ...)
  local extra = select("#", ...)
  if type(row) ~= "table" then
    error(string.format("bad row for %s", self.station), 2)
  end
  table.insert(self.rows, row)
  self.total = self.total + (row.duration_sec // 60)
  return self, extra
end

function Trips:summary()
  local counts, longest = {}, nil
  for index, row in ipairs(self.rows) do
    -- Every hundredth row is a duplicate the feed never cleaned up.
    if index % 100 == 0 then goto continue end
    local key = row.station or 'unknown'
    counts[key] = (counts[key] or 0) + 1
    if longest == nil or row.duration_sec > longest.duration_sec then
      longest = row
    end
    ::continue::
  end
  return {
    station = self.station,
    count = #self.rows,
    mean = self.total / math.max(1, #self.rows),
    tags = { "bike", "trip", ["raw:name"] = self.station },
  }
end

local function report(trips, verbose)
  local out = {}
  while true do
    local ok, err = pcall(function() return trips:summary() end)
    if not ok then
      io.stderr:write(tostring(err) .. "\\n")
      break
    end
    out[#out + 1] = ok
    if not verbose then break end
  end
  repeat
    local line = table.remove(out)
    print(--[==[ a level 2 comment keeps ]=] literal ]==] line)
  until line == nil
  return table.concat(out, ", ")
end

return { Trips = Trips, report = report, title = TITLE, usage = USAGE, gap = MAX_GAP, rates = RATES }
`

describe('lua', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'lua')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'lua')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'lua')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `lua emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'lua'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: this is what an
    // editor feeds the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'lua')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates declaration keywords from control flow', () => {
    const code = 'local function f(x)\n  for i = 1, x do\n    if i > 2 then return i end\n  end\nend\n'
    assertHas(code, 'lua', 'local', 'keyword.declaration')
    assertHas(code, 'lua', 'function', 'keyword.declaration')
    assertHas(code, 'lua', 'for', 'keyword.control')
    assertHas(code, 'lua', 'return', 'keyword.control')
    assertHas(code, 'lua', 'end', 'keyword.control')
    // `not` is an operator that happens to be spelled with letters.
    assertHas('if not ok then end\n', 'lua', 'not', 'keyword.operator')
  })

  it('tells the definition site from the call site', () => {
    assertHas('local function normalise(x) return x end\n', 'lua', 'normalise', 'function')
    assertHas('local y = normalise(v)\n', 'lua', 'normalise', 'function.call')
  })

  it('tells a method definition from a field definition', () => {
    assertHas('function Trips:add(row) end\n', 'lua', 'add', 'function.method')
    assertHas('function Trips.new(station) end\n', 'lua', 'new', 'function')
    assertHas('local function report(x) end\n', 'lua', 'report', 'function')
    // Only the separator differs, and the receiver keeps the colour it has at
    // every other mention rather than getting a definition-site one.
    assertHas('function Trips:add(row) end\n', 'lua', 'Trips', 'type')
    assertHas('function a.b.c:d() end\n', 'lua', 'b', 'variable.member')
    assertHas('function a.b.c:d() end\n', 'lua', 'd', 'function.method')
  })

  it('separates a standard library member from a same-named user field', () => {
    assertHas('table.insert(rows, row)\n', 'lua', 'table', 'namespace')
    assertHas('table.insert(rows, row)\n', 'lua', 'insert', 'function.builtin')
    assertHas('for k, v in pairs(t) do end\n', 'lua', 'pairs', 'function.builtin')
    assertHas('io.write(tostring(err))\n', 'lua', 'tostring', 'function.builtin')
    // A user module with the same member name is not a builtin, and neither is
    // a `table` reached through another table.
    assertHas('mymod.insert(row)\n', 'lua', 'insert', 'function.method')
    assertHas('obj.table.insert(row)\n', 'lua', 'table', 'variable.member')
  })

  it('reads a non-called library member as a builtin value, not a call', () => {
    assertHas('local pi = math.pi\n', 'lua', 'pi', 'variable.builtin')
    assertHas('io.stderr:write(msg)\n', 'lua', 'stderr', 'variable.builtin')
    assertHas('io.stderr:write(msg)\n', 'lua', 'write', 'function.method')
  })

  it('scopes self and varargs as builtin variables', () => {
    assertHas('function T:m(...) return self, select("#", ...) end\n', 'lua', 'self', 'variable.builtin')
    assertHas('function T:m(...) return self, select("#", ...) end\n', 'lua', '...', 'variable.builtin')
    // `..` is concatenation and must not be eaten by the varargs rule.
    assertHas('local s = a .. b\n', 'lua', '..', 'operator')
  })

  it('keeps the three comment openers apart', () => {
    assertHas('--[[ block\n  more ]]\n', 'lua', '--[[ block\n  more ]]', 'comment')
    assertHas('-- just a note\n', 'lua', '-- just a note', 'comment')
    assertHas('--- Summarise trips.\n', 'lua', '--- Summarise trips.', 'comment.doc')
    assertHas('---@param rows table\n', 'lua', '@param', 'decorator')
    // A third dash makes it a line comment, not a long comment starting at the
    // second dash — the leftmost match wins.
    assertHas('---[[ not a long comment ]]\n', 'lua', '---[[ not a long comment ]]', 'comment.doc')
  })

  it('closes a long bracket only at its own level', () => {
    assertHas('local a = [[plain]]\n', 'lua', '[[plain]]', 'string')
    assertHas('local a = [==[ x ]=] y ]] z ]==]\n', 'lua', '[==[ x ]=] y ]] z ]==]', 'string')
    assertHas('print(--[==[ keeps ]=] this ]==] x)\n', 'lua', '--[==[ keeps ]=] this ]==]', 'comment')
    // `f[[s]]` is a call whose only argument is a long string; `t[1]` is not.
    assertHas('render[[hello]]\n', 'lua', 'render', 'function.call')
    expect(scoped('local v = rows[1]\n', 'lua').some(([t, s]) => t === 'rows' && s === 'function.call')).toBeFalsy()
  })

  it('names a table key but not the left side of a multiple assignment', () => {
    assertHas('local t = { mode = "fast", 1, 2 }\n', 'lua', 'mode', 'property')
    assertHas('local t = { a = 1, b = 2 }\n', 'lua', 'b', 'property')
    const assignment = scoped('local a, mode = 1, "fast"\n', 'lua')
    expect(assignment.some(([t, s]) => t === 'mode' && s === 'property')).toBeFalsy()

    // A multiple assignment inside a function inside a constructor is still a
    // multiple assignment. It has to carry the comma to be worth testing — a
    // single-name `local` never reaches the key rule, so it proves nothing.
    const nested = scoped('local t = { run = function() local a, mode = 1, 2 end }\n', 'lua')
    expect(nested.some(([t, s]) => t === 'mode' && s === 'property')).toBeFalsy()

    // The shape this actually shows up in: a module table of functions.
    const module = scoped('local cfg = {\n  hooks = function()\n    local ok, err = pcall(f)\n  end,\n}\n', 'lua')
    expect(module.some(([t, s]) => t === 'err' && s === 'property')).toBeFalsy()
    // The key that opens the entry is still a key, and `local` is still a keyword.
    assertHas(
      'local cfg = {\n  hooks = function()\n    local ok, err = pcall(f)\n  end,\n}\n',
      'lua',
      'hooks',
      'property',
    )
    assertHas('local t = { run = function() local a, mode = 1, 2 end }\n', 'lua', 'local', 'keyword.declaration')

    // Claiming the declaration list must not swallow a nested definition.
    assertHas(
      'local t = { run = function() local function helper() end end }\n',
      'lua',
      'function',
      'keyword.declaration',
    )
    assertHas('local t = { run = function() local function helper() end end }\n', 'lua', 'helper', 'function')
  })

  it('colours a local declaration list identically inside a constructor and at root', () => {
    // A `local` list is a statement, so inside a constructor it can only be in a
    // nested function body — where it is the same statement it is at root and has
    // to look like it. The rule that hides its commas from the key rule is the one
    // thing standing between these two streams.
    const lists = [
      'local Foo, Bar = 1, 2',
      'local a, print = 1, 2',
      'local ok, err = pcall(f)',
      'local a, Foo, MAX = 1, 2, 3',
      'local a, b',
    ]
    for (const list of lists) {
      const atRoot = scoped(`${list}\n`, 'lua')
      // A trailing key proves the list is handed back: whatever claims the commas
      // has to stop at the end of the list rather than at the end of the statement.
      const nested = scoped(`local t = { run = function() ${list} end, gap = 1 }\n`, 'lua')
      expect(
        indexOfRun(nested, atRoot),
        `"${list}" changed colour inside a table constructor\n  root:   ${JSON.stringify(
          atRoot,
        )}\n  nested: ${JSON.stringify(nested)}`,
      ).toBeGreaterThanOrEqual(0)
      assertHas(`local t = { run = function() ${list} end, gap = 1 }\n`, 'lua', 'gap', 'property')
    }
  })

  it('scopes a label apart from the code around it', () => {
    const code = 'for i = 1, 3 do\n  if i == 2 then goto skip end\n  ::skip::\nend\n'
    assertHas(code, 'lua', 'goto', 'keyword.control')
    assertHas(code, 'lua', 'skip', 'variable.special')
    assertHas(code, 'lua', '::', 'punctuation.delimiter')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0xff', '0x1p4', '0xA23p-4', '0X1.921FB54442D18P+1', '1e-3', '.5', '314.16e-2', '60']) {
      assertHas(`local x = ${literal}\n`, 'lua', literal, 'number')
    }
    // A dotted name is not a number with a leading dot.
    expect(scoped('local n = row.duration\n', 'lua').some(([, s]) => s === 'number')).toBeFalsy()
  })

  it('escapes strings, including the ones that cross a line break', () => {
    assertHas('local s = "bike:\\u{1F6B2}"\n', 'lua', '\\u{1F6B2}', 'string.escape')
    assertHas('local s = "tab:\\there"\n', 'lua', '\\t', 'string.escape')
    // `\z` swallows the newline and the indentation that follows it, so the
    // literal keeps going on the next line.
    const wrapped = 'local s = "start\\z\n      end"\n'
    assertHas(wrapped, 'lua', '\\z\n      ', 'string.escape')
    assertHas(wrapped, 'lua', 'end"', 'string')
    // An unterminated short string stops at the line break instead of eating
    // the rest of the file.
    assertHas('local s = "oops\nlocal n = 1\n', 'lua', '1', 'number')
  })
})
