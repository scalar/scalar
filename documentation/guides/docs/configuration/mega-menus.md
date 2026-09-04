# Mega Menus

A mega menu is a dropdown in the [header](navigation.md#header) or the [tab bar](navigation.md#tabs) that lays its links out in titled columns instead of a single list. Use one when a dropdown has grown past six or so links and readers need a second level of grouping to find what they want.

There is no layout switch to turn on. A dropdown becomes a mega menu the moment one of its links names the column it sits under with `section`.

## How it works

Every dropdown is a flat, ordered list of links. A mega menu is a rendering of that list, not a nesting level:

- Give a link a `section` to name the column heading it sits under.
- Consecutive links that share a `section` form one column, titled with that value.
- The number of columns is the number of those runs. There is no column count to set.
- Links that name no `section` form their own untitled column, at the position they were authored.

Because the columns are just the list read in order, the same list also drives the collapsed mobile menu, so there is never a second structure to keep in sync.

## Header mega menu

Add `section` to the children of a [group](navigation.md#group-dropdowns) in `navigation.header`:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "navigation": {
    "header": [
      { "type": "link", "title": "Home", "to": "/" },
      {
        "type": "group",
        "title": "Resources",
        "children": [
          {
            "type": "link",
            "title": "API Reference",
            "to": "/reference",
            "icon": "phosphor/regular/code",
            "section": "Documentation"
          },
          {
            "type": "link",
            "title": "Guides",
            "to": "/guides",
            "icon": "phosphor/regular/compass",
            "section": "Documentation"
          },
          {
            "type": "link",
            "title": "About",
            "to": "https://scalar.com",
            "newTab": true,
            "section": "Company"
          },
          {
            "type": "link",
            "title": "Status",
            "to": "https://status.scalar.com",
            "newTab": true,
            "section": "Company"
          },
          {
            "type": "link",
            "title": "Everything else",
            "to": "/more"
          }
        ]
      }
    ],
    "routes": {
      // ...
    }
  }
}
```

The **Resources** dropdown renders three columns, left to right:

| Documentation | Company | _(no heading)_  |
| ------------- | ------- | --------------- |
| API Reference | About   | Everything else |
| Guides        | Status  |                 |

Links inside a mega menu take the same properties as any [header link](navigation.md#header-links): `title`, `to`, `icon`, `newTab`, and `style`. The group itself keeps its `title`, `icon`, and `align`.

## Tabs mega menu

The tab bar accepts dropdowns too. A tab group is `{ "type": "group", "title", "icon", "children" }`, and each child is a tab link with an optional `section`:

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "navigation": {
    "tabs": [
      { "title": "Home", "to": "/" },
      {
        "type": "group",
        "title": "Platform",
        "children": [
          { "title": "API Reference", "to": "/reference", "section": "Build" },
          { "title": "Guides", "to": "/guides", "section": "Build" },
          { "title": "Scalar Website", "to": "https://scalar.com", "section": "Operate" }
        ]
      }
    ],
    "routes": {
      // ...
    }
  }
}
```

Tab links have no `type` key. They take `title`, `to`, `icon`, `newTab`, and `section`, exactly like a top-level tab plus the column heading.

## The `section` property

| Property  | Type     | Required | Description                                                                                   |
| --------- | -------- | -------- | --------------------------------------------------------------------------------------------- |
| `section` | `string` | No       | The column heading a link sits under. Applies to children of a `group` in `navigation.header` or `navigation.tabs`. |

- It must be a non-empty string. An empty string fails validation. To leave a link out of any titled column, omit the key instead.
- It is ignored on links that sit directly in the header band or the tab bar rather than inside a group.
- It is an annotation on each link, so renaming a column means changing the value on every link in that run.

If your config declares `"$schema": "https://cdn.scalar.com/schema/scalar-config-next.json"`, your editor will autocomplete `section` on dropdown children.

## Rules to know

- **Order is authored order.** Columns appear left to right in the order their first link appears in `children`, and links stack top to bottom within a column in the same order.
- **Keep a column's links together.** Grouping is by consecutive run, not by name. Two runs with the same heading that are separated by another section render as two separate columns with the same heading.
- **Untitled columns are allowed.** A link with no `section` is its own column with no heading. A common pattern is a trailing untitled column for one or two leftovers, as in the header example above.
- **One sectioned link is enough.** As soon as any child names a section the whole dropdown switches to columns. The unsectioned links become untitled columns at their positions, so decide up front whether a dropdown is a list or a mega menu.
- **Plain dropdowns are unchanged.** A group with no `section` on any child renders as the single-column list it always has. You can mix plain dropdowns and mega menus in the same band.
- **Only links make columns.** The deprecated `spacer` child inside a dropdown renders nothing and does not split a column.

## Appearance and responsive behavior

- The panel opens on hover and on click, like every other dropdown in the header.
- Column headings render as small, muted labels above their links. Link icons show inside the columns.
- Columns share the panel width equally. Up to four columns sit side by side on a wide screen. Beyond that, columns wrap onto a new row.
- As the viewport narrows the grid drops columns on its own, down to a single stacked column on phones, and the panel never pushes the page wider than the screen.
- Below 1000px the header links move into the mobile menu drawer. A header mega menu becomes a collapsible folder there, with each column shown as a titled section in the same order.
- The tab bar stays visible on phones. A tab mega menu opens as one column, with the headings and links stacked in authored order.

## Editing in the dashboard

You can build a mega menu without touching the config file. In the docs editor, open the header settings and pick **Header** or **Tabs**, then click a dropdown to open it.

1. Click **Add column**. This adds a new link under a provisional heading such as `Column 1` and opens it so you can set its title and target.
2. Rename the column with the **Column heading** input above it. Renaming rewrites the heading on every link in that column.
3. Use **Move up** and **Move down** to reorder links. Moving a link past the edge of its column moves it into the neighbouring column, and it takes on that column's heading.
4. **Add link** adds a link with no heading, which appears as an untitled column at the end. Move it up into a column to file it under a heading.

Clearing every column heading turns the dropdown back into a plain list. Removing the last link in a column removes the column, because a column exists only while a link names it. The preview beside the panel shows the columns as readers will see them.

## Validating and previewing with the CLI

`scalar project check-config` accepts `section` and reports an error that names the field if a heading is empty:

```bash
scalar project check-config scalar.config.json
```

`scalar project preview` renders mega menus locally:

```bash
scalar project preview
```

Dropdown mega menus ship in the CLI release after 2.2.0. On an older CLI the field is ignored and the dropdown renders as a single-column list, so a config that uses `section` still builds.

## Compatibility

The feature is purely additive. A config with no `section` anywhere parses and renders exactly as before, and adding `section` never changes where a link sits in the collapsed menu.

## Tips

- Keep headings to one or two words. They render in a small label style and are there to orient, not to explain.
- Two to four columns with three to six links each is the range that reads well. Past that, split the dropdown into two.
- Put the column readers reach for most on the left. It is the first one both sighted readers and screen readers meet.
- Give an untitled column a single, obvious purpose, such as one or two catch-all links at the end.
