/* Page chrome for the SDK Generator landing page. Kept as a string because
 * MDX parses a raw <style> block as JSX, where every CSS brace would read as
 * an expression. */

export const PAGE_STYLES = `
  .t-editor__anchor {
    --font-visited: none;
  }

  main.content {
    overflow-x: clip;
  }

  .t-editor.page {
    position: relative;
  }

  .t-doc .layout-header {
    z-index: 10000;
  }

  .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }

  .sdk-migration-cta {
    position: absolute;
    top: -36px;
    left: 0;
    z-index: 10;
  }

  @media screen and (max-width: 400px) {
    .t-editor .sdk-migration-cta {
      gap: 4px;
      padding-right: 8px;
      padding-left: 8px;
    }
  }

  @media screen and (max-width: 360px) {
    .t-editor .sdk-migration-cta-separator,
    .t-editor .sdk-migration-cta-read-more {
      display: none;
    }
  }


  .feature-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 48px;
    row-gap: 36px;
    margin-top: 32px;
  }

  @media screen and (max-width: 1000px) {
    .feature-container {
      grid-template-columns: 1fr;
      row-gap: 28px;
    }
  }
`
