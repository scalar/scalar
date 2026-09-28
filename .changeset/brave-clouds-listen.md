---
'@scalar/api-reference': patch
'@scalar/api-client': patch
---

fix: correct the semantics of the authentication card and of nested schema lists

Two findings from an accessibility audit, both programmatic only with no change
to how anything renders:

- The reference's Authentication card announced its title as a level two
  heading, which put a card of controls in the document outline next to the
  real tag and operation headings. The title is now plain text and the card is
  exposed as a named group instead, so it stays findable without claiming to
  open a passage of the page. Collapsible sections in the API client are
  unaffected and keep their headings.
- A schema panel whose root is a composition, a primitive or an array wraps a
  single nameless row that carries the real property list, so assistive tech
  announced "list with 1 item" before the list the reader wanted. That wrapper
  is now presentational and only the real property list is announced.
