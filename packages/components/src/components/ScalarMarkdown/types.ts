import type { Node } from '@scalar/code-highlight'

export type ScalarMarkdownProps = {
  /**
   * The markdown content to render.
   */
  value?: string
  /**
   * Whether to render images.
   *
   * @default false
   */
  withImages?: boolean
  /**
   * Whether to add anchors to the headings.
   *
   * @default false
   */
  withAnchors?: boolean
  /**
   * A function to transform the Markdown content.
   *
   * @see https://github.com/remarkjs/remark-rehype
   */
  transform?: (node: Node) => Node
  /**
   * The type of transform to apply.
   *
   * @see https://github.com/remarkjs/remark-rehype
   */
  transformType?: string
  /**
   * The number of lines to truncate the content to.
   */
  clamp?: number
  /**
   * Whether to add anchors to the headings.
   */
  anchorPrefix?: string
}

export type ScalarMarkdownSummaryProps = ScalarMarkdownProps & {
  /**
   * Allows the summary's open and closed state to
   * be controlled by the parent component and hides
   * the "More" and "Less" buttons.
   *
   * @default false
   */
  controlled?: boolean
}
