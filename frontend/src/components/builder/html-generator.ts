import { Block, PageStyle } from './types'

export function blocksToHtml(blocks: Block[], pageStyle: PageStyle): string {
  const bodyStyle = `margin:0;padding:0;background-color:${pageStyle.backgroundColor};font-family:${pageStyle.fontFamily};`
  const outerTableStyle = `width:100%;border-spacing:0;background-color:${pageStyle.backgroundColor};padding:${pageStyle.padding} 0;`
  const innerTableStyle = `width:100%;max-width:${pageStyle.contentWidth};border-spacing:0;background-color:#ffffff;margin:0 auto;border-radius:8px;overflow:hidden;`

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { ${bodyStyle} }
    img { max-width: 100%; height: auto; display: block; }
    p, h1, h2, h3, h4 { margin: 0; }
  </style>
</head>
<body>
  <table style="${outerTableStyle}" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table style="${innerTableStyle}" cellpadding="0" cellspacing="0" role="presentation">
          <!-- CONTENT BLOCKS -->
          `

  blocks.forEach((block) => {
    html += `<tr><td style="${getTdStyle(block.style)}">`
    html += renderBlock(block)
    html += `</td></tr>\n`
  })

  html += `
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return html
}

function getTdStyle(style: any): string {
  const parts = []
  if (style.paddingTop) parts.push(`padding-top:${style.paddingTop}`)
  if (style.paddingBottom) parts.push(`padding-bottom:${style.paddingBottom}`)
  if (style.paddingLeft) parts.push(`padding-left:${style.paddingLeft}`)
  if (style.paddingRight) parts.push(`padding-right:${style.paddingRight}`)
  if (style.textAlign) parts.push(`text-align:${style.textAlign}`)
  if (style.backgroundColor) parts.push(`background-color:${style.backgroundColor}`)
  if (style.borderRadius) parts.push(`border-radius:${style.borderRadius}`)
  if (style.borderColor) parts.push(`border-color:${style.borderColor}`)
  if (style.borderWidth) parts.push(`border-width:${style.borderWidth}`)
  if (style.borderStyle) parts.push(`border-style:${style.borderStyle}`)
  return parts.join(';')
}

function renderBlock(block: Block): string {
  const style = getElementStyle(block.style)
  
  switch (block.type) {
    case 'title':
      return `<h1 style="${style}">${block.content}</h1>`
    case 'subtitle':
      return `<h2 style="${style}">${block.content}</h2>`
    case 'heading':
      return `<h3 style="${style}">${block.content}</h3>`
    case 'text':
      return `<p style="${style}">${block.content}</p>`
    case 'button':
      return `<a href="${block.link || '#'}" style="${style}display:inline-block;text-decoration:none;">${block.content}</a>`
    case 'divider':
      return `<hr style="${style}border:none;border-top:${block.style.borderWidth || '1px'} ${block.style.borderStyle || 'solid'} ${block.style.borderColor || '#e5e7eb'};" />`
    case 'image':
      return `<img src="${block.src || ''}" alt="${block.content || ''}" style="${style}" />`
    case 'bullet-list':
      return `<ul style="${style}">\n${(block.items || []).map(item => `  <li>${item}</li>`).join('\n')}\n</ul>`
    case 'numbered-list':
      return `<ol style="${style}">\n${(block.items || []).map(item => `  <li>${item}</li>`).join('\n')}\n</ol>`
    case 'unsubscribe-footer':
      return `<p style="${style}">Você recebeu este e-mail porque se inscreveu. <a href="{{{unsubscribe_url}}}" style="color:inherit;text-decoration:underline;">Cancelar inscrição</a></p>`
    case 'html':
    case 'code':
      return block.content || ''
    default:
      return block.content || ''
  }
}

function getElementStyle(style: any): string {
  const parts = []
  if (style.color) parts.push(`color:${style.color}`)
  if (style.fontSize) parts.push(`font-size:${style.fontSize}`)
  if (style.fontWeight) parts.push(`font-weight:${style.fontWeight}`)
  if (style.fontFamily) parts.push(`font-family:${style.fontFamily}`)
  if (style.lineHeight) parts.push(`line-height:${style.lineHeight}`)
  if (style.letterSpacing) parts.push(`letter-spacing:${style.letterSpacing}`)
  if (style.borderRadius) parts.push(`border-radius:${style.borderRadius}`)
  if (style.width) parts.push(`width:${style.width}`)
  if (style.maxWidth) parts.push(`max-width:${style.maxWidth}`)
  return parts.join(';')
}
