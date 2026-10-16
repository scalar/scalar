/**
 * DOM-level Markdown hooks also run outside Vue trees. Keep viewer styles local to
 * the opt-in plugin and use low-specificity selectors so consumers can restyle it.
 * The stylesheet is removed with its diagram when the hook is disposed.
 */
export const diagramStyles = `
.scalar-mermaid-diagram {
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color, #ddd);
  border-radius: var(--scalar-radius, 3px);
  overflow: hidden;
  margin: 16px 0;
  background: var(--scalar-background-1, #fff);
}
.scalar-mermaid-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  border-bottom: var(--scalar-border-width, 1px) solid var(--scalar-border-color, #ddd);
}
.scalar-mermaid-viewport {
  overflow: hidden;
  min-height: 120px;
  max-height: 520px;
  padding: 16px;
  cursor: grab;
  touch-action: pan-y;
}
.scalar-mermaid-canvas {
  transform-origin: center;
  transition: transform 80ms linear;
  /* Mermaid's default SVG palette requires a light drawing surface for legibility.
     Keep it independent of Scalar's color mode; consumers may override the token. */
  background: var(--scalar-mermaid-canvas-background, #fff);
  border-radius: var(--scalar-radius, 3px);
  padding: 8px;
}
button.scalar-mermaid-control {
  font: inherit;
  font-size: var(--scalar-small, 12px);
  padding: 4px 8px;
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color, #ddd);
  border-radius: var(--scalar-radius, 3px);
  color: var(--scalar-color-1, #222);
  background: var(--scalar-background-1, #fff);
  cursor: pointer;
}
button.scalar-mermaid-control:hover {
  background: var(--scalar-background-2, #f6f6f6);
}
button.scalar-mermaid-control:focus-visible, .scalar-mermaid-viewport:focus-visible {
  outline: 2px solid var(--scalar-color-accent, #0099ff);
  outline-offset: -2px;
}
`
