# How Scalar themes work

Every product can be thought of as a combination of three things: data, functionality, and display.

The beauty of [API references](https://docs.scalar.com/) is that they use a standardized data format (OpenAPI) to provide a massive amount of functionality for you. Building all this functionality would be a ton of work (and maintenance), but because it is similar between products, we can build it for you.

What’s not similar or standardized between products is **display**. Design matters a lot. You don’t want people thinking they’ve entered another product when they go to your API reference. Ideally, you want them to think you built all the functionality yourself.

We built **themes** to accomplish exactly this. They aim to make it easy to stylistically integrate our API references with your existing app (without breaking anything). This post covers how they work and how we built them.

## **Enabling smooth integrations through customization**

The simplest way to customize your API reference is to use a pre-built theme. These include options like `moon`, `solarized`, `saturn`, `mars`, and more.

[![Web editor themes](https://substackcdn.com/image/fetch/$s_!Uby5!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fc074881c-a279-42ca-9221-460e9029e4bc_2584x1466.png "Web editor themes")](https://substackcdn.com/image/fetch/$s_!Uby5!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fc074881c-a279-42ca-9221-460e9029e4bc_2584x1466.png)

We’ve worked hard to make these options you want to use. For example, we’ve built a custom shadow system to work well in both light and dark modes.

Normal shadow systems use dark shadows on light backgrounds to create depth, but those same shadows look wrong on dark backgrounds.

To handle this, we use a subtler shadow with a higher spread in light mode and combine borders with shadows in dark mode. Both use multiple layers for natural depth while also integrating with theme CSS variables.

If you want to take the customization further, you can then dive into the CSS they are built with. These include `light-mode` and `dark-mode` options for details like text color, accents, font, background colors, spacing, and even the sidebar. All this can be edited in the web editor or directly using CSS variables and selectors.

For example, changing the font requires you to set the `withDefaultFonts` config option to `false` and then set it with the `--scalar-font` variable.

```
<!doctype html>
<html>
  <head>
    <!-- Link to the font on Google -->
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto"
      rel="stylesheet" />
    <!-- Overwrite the Scalar font variable -->
    <style>
      :root {
        --scalar-font: 'Roboto', sans-serif;
      }
    </style>
  </head>
  <body>
    <!-- Pass the custom configuration object -->
    <script>
      var configuration = {
        theme: 'kepler',
        withDefaultFonts: 'false',
      }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
```

All this gives you the options to customize Scalar to your brand and integrate it stylistically.

## **Making customization easy for developers**

The second part of themes is creating a great developer experience so you actually want to use it. As I hinted in the last section, this is largely done by providing clear variables and organization.

All variables:

* Start with `--scalar-`.
* Are grouped logically by function (color, typography, layout)
* Clearly separated between light and dark mode

[![Theme variables](https://substackcdn.com/image/fetch/$s_!Aji_!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb390de64-711c-47e5-bb77-e9cc773576dc_1940x934.png "Theme variables")](https://substackcdn.com/image/fetch/$s_!Aji_!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb390de64-711c-47e5-bb77-e9cc773576dc_1940x934.png)

Beyond this, we also use a layer system to create conflict-free styling. The first layer is `scalar-base` which contains the core resets that normalize browser default styles and then sets the default styles for Scalar.

The second layer is `scalar-theme` which contains theme-specific styles and overrides. These are largely the variables you edit when you want to customize your theme.

The last piece of theme’s developer experience is providing tooling support like TypeScript support and a Tailwind preset that provides customer border radius values, border width configurations, color palette mapping, and more.

Oh, and we know it wouldn’t be good developer experience without a load of [documentation](https://github.com/scalar/scalar/blob/main/documentation/products/api-references/themes.md) and code examples for all things themes. We hope all this makes themes not only easy to customize, but enjoyable too.

## **Making sure themes don’t break anything**

The last thing we want Scalar to do is break your app in unexpected ways.

Similar to the other two sections, this starts by scoping well. For themes, everything is scoped under the `scalar-app` class using the `:where` scoping. This is the first layer of defence to prevent unintended style leakage. The `scalar-base` and `scalar-theme` layers provide another and the `light-mode` and `dark-mode` one after that.

Another area that is liable to break is scrollbars. Unfortunately, macOS, Windows, and Linux all handle scrollbars differently. The ones on macOS don’t take up space, but the ones on Windows do. This means the spacing we worked so hard to get right can immediately get messed up.

To prevent this, we built a detection utility for obtrusive scrollbars that forces them to always be visible. It looks like this:

```
export function hasObtrusiveScrollbars(): boolean {
  if (typeof window === 'undefined') return false;

  // Create a 30px square div
  const parent = document.createElement('div')
  parent.setAttribute('style', 'width:30px;height:30px;overflow-y:scroll;')
  parent.classList.add('scrollbar-test')

  // Create a 40px tall child that forces scrolling
  const child = document.createElement('div')
  child.setAttribute('style', 'width:100%;height:40px')
  parent.appendChild(child)
  document.body.appendChild(parent)

  // If the child width is less than 30px, scrollbars are taking up space
  const firstChild = parent.firstChild as HTMLDivElement
  const scrollbarWidth = 30 - firstChild.clientWidth

  document.body.removeChild(parent)

  return !!scrollbarWidth
}
```

All of this helps developers gain confidence that Scalar will integrate with their existing setup and not break anything.

## **Themes are a core part of what makes Scalar work**

Themes are a critical part of making Scalar a drop-in API reference solution that developers love. They enable us to provide all the functionality you’d want without your users realizing you didn’t build it.

Thanks to the customization options, developer tooling, and CSS structure, you can be confident that your API reference will look and feel like a natural extension of your product.

**May 7, 2025**
