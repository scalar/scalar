export const nextjsThemeCss = `
/* basic theme */
.dark-mode {
  --scalar-color-1: rgba(255, 255, 255, 0.9);
  --scalar-color-2: rgba(255, 255, 255, 0.62);
  --scalar-color-3: rgba(255, 255, 255, 0.44);
  --scalar-color-accent: #3070ec;

  --scalar-background-1: #000000;
  --scalar-background-2: #1a1a1a;
  --scalar-background-3: #2a2828;
  --scalar-background-accent: transparent;

  --scalar-border-color: rgba(255, 255, 255, 0.1);
  --scalar-code-language-color-supersede: var(--scalar-color-1);
  --scalar-code-languages-background-supersede: var(--scalar-background-3);
}

.light-mode .dark-mode,
.light-mode {
  --scalar-color-1: #2a2f45;
  --scalar-color-2: #757575;
  --scalar-color-3: #8e8e8e;
  --scalar-color-accent: #3070ec;

  --scalar-background-1: #fff;
  --scalar-background-2: #fafafa;
  --scalar-background-3: #e7e7e7;
  --scalar-background-accent: transparent;

  --scalar-border-color: rgba(0, 0, 0, 0.1);

  --scalar-code-language-color-supersede: var(--scalar-color-1);
  --scalar-code-languages-background-supersede: var(--scalar-background-3);
}
.light-mode .scalar-card {
  --scalar-background-1: #fff;
  --scalar-background-2: #fff !important;
  --scalar-background-3: #fff !important;
}
.dark-mode .scalar-card {
  --scalar-background-1: #000000;
  --scalar-background-2: #000000 !important;
  --scalar-background-3: #000000 !important;
}
.light-mode .examples .scalar-card .scalar-card-header {
  --scalar-background-2: #fafafa;
}
.dark-mode .examples .scalar-card .scalar-card-header {
  --scalar-background-2: #1a1a1a;
  --scalar-border-color: #1a1a1a;
}
/* Document header */
.light-mode .t-doc__header,
.dark-mode .t-doc__header {
  --header-background-1: rgba(255,255,255,.8);
  --header-border-color: var(--scalar-border-color);
  --header-color-1: var(--scalar-color-1);
  --header-color-2: var(--scalar-color-2);
  --header-background-toggle: var(--scalar-color-3);
  --header-call-to-action-color: var(--scalar-color-accent);
  backdrop-filter: saturate(180%) blur(5px);
}

.dark-mode .t-doc__header {
  --header-background-1: rgba(0,0,0,.5);
}
/* Document Sidebar */
.light-mode .t-doc__sidebar,
.dark-mode .t-doc__sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-item-hover-color: var(--scalar-sidebar-color-1);
  --scalar-sidebar-item-hover-background: transparent;
  --scalar-sidebar-item-active-background: var(--scalar-background-accent);
  --scalar-sidebar-border-color: transparent;
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-accent);
  --scalar-sidebar-search-background: var(--scalar-background-2);
  --scalar-sidebar-search-border-color: var(--scalar-background-2);
  --scalar-sidebar-search-color: var(--scalar-color-3);
  --scalar-sidebar-indent-border: var(--scalar-border-color);
  --scalar-sidebar-indent-border-active: #6aacf8;
}
.api-client-drawer .t-doc__sidebar {
  --scalar-sidebar-border-color: var(--scalar-border-color);
}
/* advanced */
.light-mode .dark-mode,
.light-mode {
  --scalar-button-1: rgb(49 53 56);
  --scalar-button-1-color: #fff;
  --scalar-button-1-hover: rgb(28 31 33);

  --scalar-color-green: #417942;
  --scalar-color-red: #ae3763;
  --scalar-color-yellow: #edbe20;
  --scalar-color-blue: #2b66cf;
  --scalar-color-orange: #cf7a2b;
  --scalar-color-purple: #6e27b5;

  --scalar-scrollbar-color: rgba(0, 0, 0, 0.18);
  --scalar-scrollbar-color-active: rgba(0, 0, 0, 0.36);
}
.dark-mode {
  --scalar-button-1: #f6f6f6;
  --scalar-button-1-color: #000;
  --scalar-button-1-hover: #e7e7e7;

  --scalar-color-green: #7abe7b;
  --scalar-color-red: #e5698f;
  --scalar-color-yellow: #f8ea68;
  --scalar-color-blue: #68a6f8;
  --scalar-color-orange: #f89c68;
  --scalar-color-purple: #b57de9;

  --scalar-scrollbar-color: rgba(255, 255, 255, 0.24);
  --scalar-scrollbar-color-active: rgba(255, 255, 255, 0.48);
}
.sidebar .sidebar-indent-nested .sidebar-heading {
  padding-right: 0;
}
.code-languages-icon {
  padding: 10px !important;
}
.sidebar-search-key {
  background: var(--scalar-background-1) !important;
  border: 1px solid var(--scalar-border-color);
}
`
