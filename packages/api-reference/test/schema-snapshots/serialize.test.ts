import { describe, expect, it } from 'vitest'

import { serializeSchemaRendering } from './serialize'

/**
 * These cases use hand written markup rather than a mounted component: the point
 * is to pin the serializer's own contract, so that a snapshot diff always means
 * the rendering changed and never that the serializer drifted.
 */
describe('serialize', () => {
  it('reads the name, type and constraints of a property', () => {
    const html = `
      <ul>
        <li class="property">
          <div class="property-heading">
            <div class="property-name">email</div>
            <span class="property-detail"><span class="property-detail-value">string</span></span>
            <span class="property-detail">
              <div class="property-detail-prefix">max length:</div>
              <span class="property-detail-value">50</span>
            </span>
          </div>
        </li>
      </ul>`

    expect(serializeSchemaRendering(html)).toBe('- email — string · max length: 50')
  })

  it('emits flags in a fixed order regardless of markup order', () => {
    const html = `
      <li class="property">
        <div class="property-heading">
          <div class="property-name">id</div>
          <div class="property-read-only">read-only</div>
          <div class="property-required">required</div>
        </div>
      </li>`

    expect(serializeSchemaRendering(html)).toBe('- id — {required, read-only}')
  })

  it('drops screen reader labels that repeat the line', () => {
    const html = `
      <li class="property">
        <div class="property-heading">
          <div class="property-name">count</div>
          <span class="property-detail">
            <span class="property-detail-value"><span class="screenreader-only">Type:</span> integer</span>
          </span>
        </div>
      </li>`

    expect(serializeSchemaRendering(html)).toBe('- count — integer')
  })

  it('indents nested properties without caring how many wrappers sit between them', () => {
    const html = `
      <li class="property">
        <div class="property-heading"><div class="property-name">address</div></div>
        <div class="children">
          <div class="schema-card">
            <div class="schema-properties">
              <ul>
                <li class="property">
                  <div class="property-heading"><div class="property-name">city</div></div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </li>`

    expect(serializeSchemaRendering(html)).toBe('- address\n  - city')
  })

  it('records the selected branch of a composition', () => {
    const html = `
      <div class="property-rule">
        <button class="composition-selector">
          <span>One of</span>
          <span class="composition-selector-label">Cat</span>
        </button>
        <div class="composition-panel">
          <li class="property">
            <div class="property-heading"><div class="property-name">meows</div></div>
          </li>
        </div>
      </div>`

    expect(serializeSchemaRendering(html)).toBe('One of → showing "Cat"\n  - meows')
  })

  it('walks through a composition that has no selector', () => {
    const html = `
      <div class="property-rule">
        <li class="property">
          <div class="property-heading"><div class="property-name">id</div></div>
        </li>
      </div>`

    expect(serializeSchemaRendering(html)).toBe('- id')
  })

  it('collapses a property row that carries nothing of its own', () => {
    const html = `
      <li class="property">
        <div class="property-heading"></div>
        <div class="property-rule">
          <li class="property">
            <div class="property-heading"><div class="property-name">id</div></div>
          </li>
        </div>
      </li>`

    expect(serializeSchemaRendering(html)).toBe('- id')
  })

  it('marks a truncated enum so a partial list is never mistaken for the whole one', () => {
    const html = `
      <div class="property-enum">
        <div class="property-enum-property-names">values</div>
        <ul class="property-enum-values">
          <li class="property-enum-value"><span class="property-enum-value-label">a</span></li>
          <li class="property-enum-value"><span class="property-enum-value-label">b</span></li>
          <li><button class="enum-toggle-button">Show all values</button></li>
        </ul>
      </div>`

    expect(serializeSchemaRendering(html)).toBe('values: a | b\n  (truncated, more behind a toggle)')
  })

  it('reports when nothing was rendered', () => {
    expect(serializeSchemaRendering('<div></div>')).toBe('(nothing rendered)')
  })
})
