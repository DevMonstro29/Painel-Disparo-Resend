export type BlockType =
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'text'
  | 'bullet-list'
  | 'numbered-list'
  | 'image'
  | 'youtube'
  | 'twitter'
  | 'button'
  | 'divider'
  | 'section'
  | 'columns-2'
  | 'columns-3'
  | 'columns-4'
  | 'social-links'
  | 'unsubscribe-footer'
  | 'html'
  | 'code'

export interface BlockStyle {
  color?: string
  backgroundColor?: string
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  lineHeight?: string
  letterSpacing?: string
  paddingTop?: string
  paddingBottom?: string
  paddingLeft?: string
  paddingRight?: string
  marginTop?: string
  marginBottom?: string
  borderRadius?: string
  borderWidth?: string
  borderColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  width?: string
  maxWidth?: string
}

export interface Block {
  id: string
  type: BlockType
  content?: string
  src?: string // For images
  link?: string // For buttons, images, videos
  style: BlockStyle
  items?: string[] // For lists
  columns?: Block[][] // For columns
}

export interface PageStyle {
  backgroundColor: string
  contentWidth: string
  padding: string
  fontFamily: string
}
