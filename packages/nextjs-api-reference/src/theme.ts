export const nextjsThemeCss = `
:root {
  --theme-font: 'Inter', var(--system-fonts);
}
/* basic theme */
.dark-mode {
  --theme-color-1: rgba(255, 255, 255, 0.9);
  --theme-color-2: rgba(255, 255, 255, 0.62);
  --theme-color-3: rgba(255, 255, 255, 0.44);
  --theme-color-accent: #3070ec;

  --theme-background-1: #000000;
  --theme-background-2: #1a1a1a;
  --theme-background-3: #2a2828;
  --theme-background-accent: transparent;

  --theme-border-color: rgba(255, 255, 255, 0.1);
  --theme-code-language-color-supersede: var(--theme-color-1);
  --theme-code-languages-background-supersede: var(--theme-background-3);
}

.light-mode .dark-mode,
.light-mode {
  --theme-color-1: #2a2f45;
  --theme-color-2: #757575;
  --theme-color-3: #8e8e8e;
  --theme-color-accent: #3070ec;

  --theme-background-1: #fff;
  --theme-background-2: #fafafa;
  --theme-background-3: #e7e7e7;
  --theme-background-accent: transparent;

  --theme-border-color: rgba(0, 0, 0, 0.1);

  --theme-code-language-color-supersede: var(--theme-color-1);
  --theme-code-languages-background-supersede: var(--theme-background-3);
}
.light-mode .scalar-card {
  --theme-background-1: #fff;
  --theme-background-2: #fff !important;
  --theme-background-3: #fff !important;
}
.dark-mode .scalar-card {
  --theme-background-1: #000000;
  --theme-background-2: #000000 !important;
  --theme-background-3: #000000 !important;
}
.light-mode .examples .scalar-card .scalar-card-header {
  --theme-background-2: #fafafa;
}
.dark-mode .examples .scalar-card .scalar-card-header {
  --theme-background-2: #1a1a1a;
  --theme-border-color: #1a1a1a;
}
/* Document header */
.light-mode .t-doc__header,
.dark-mode .t-doc__header {
  --header-background-1: rgba(255,255,255,.8);
  --header-border-color: var(--theme-border-color);
  --header-color-1: var(--theme-color-1);
  --header-color-2: var(--theme-color-2);
  --header-background-toggle: var(--theme-color-3);
  --header-call-to-action-color: var(--theme-color-accent);
  backdrop-filter: saturate(180%) blur(5px);
}

.dark-mode .t-doc__header {
  --header-background-1: rgba(0,0,0,.5);
}
/* Document Sidebar */
.light-mode .t-doc__sidebar,
.dark-mode .t-doc__sidebar {
  --sidebar-background-1: var(--theme-background-1);
  --sidebar-item-hover-color: var(--sidebar-color-1);
  --sidebar-item-hover-background: transparent;
  --sidebar-item-active-background: var(--theme-background-accent);
  --sidebar-border-color: transparent;
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-accent);
  --sidebar-search-background: var(--theme-background-2);
  --sidebar-search-border-color: var(--theme-background-2);
  --sidebar-search--color: var(--theme-color-3);
}
.api-client-drawer .t-doc__sidebar {
  --sidebar-border-color: var(--theme-border-color);
}
/* advanced */
.light-mode .dark-mode,
.light-mode {
  --theme-button-1: rgb(49 53 56);
  --theme-button-1-color: #fff;
  --theme-button-1-hover: rgb(28 31 33);

  --theme-color-green: #417942;
  --theme-color-red: #ae3763;
  --theme-color-yellow: #edbe20;
  --theme-color-blue: #2b66cf;
  --theme-color-orange: #cf7a2b;
  --theme-color-purple: #6e27b5;

  --theme-scrollbar-color: rgba(0, 0, 0, 0.18);
  --theme-scrollbar-color-active: rgba(0, 0, 0, 0.36);
}
.dark-mode {
  --theme-button-1: #f6f6f6;
  --theme-button-1-color: #000;
  --theme-button-1-hover: #e7e7e7;

  --theme-color-green: #7abe7b;
  --theme-color-red: #e5698f;
  --theme-color-yellow: #f8ea68;
  --theme-color-blue: #68a6f8;
  --theme-color-orange: #f89c68;
  --theme-color-purple: #b57de9;

  --theme-scrollbar-color: rgba(255, 255, 255, 0.24);
  --theme-scrollbar-color-active: rgba(255, 255, 255, 0.48);
}
.sidebar .sidebar-indent-nested .sidebar-heading {
  padding-right: 0;
}
.sidebar .sidebar-group .sidebar-indent-nested .sidebar-heading:before {
  content: '';
  position: absolute;
  left: 11px;
  background: var(--theme-border-color);
  width: 1px;
  height: 100%;
  width: 1px;
}
.sidebar
  .sidebar-group
  .sidebar-indent-nested
  .sidebar-heading.active_page:before {
  background: #6aacf8;
}
.examples .show-api-client-button:before {
  background: var(--theme-color-1);
}
.examples .show-api-client-button span,
.examples .show-api-client-button svg {
  color: var(--theme-background-1);
  text-transform: none;
}
.code-languages-icon {
  padding: 10px !important;
}
.sidebar-search-key {
  background: var(--theme-background-1) !important;
  border: 1px solid var(--theme-border-color);
}
`
