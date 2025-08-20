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
   * A function to transform the markdown content.
   *
   * @see https://github.com/remarkjs/remark-rehype
   */
  transform?: (node: Record<string, any>) => Record<string, any>
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
