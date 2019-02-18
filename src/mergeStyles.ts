const NUMBER_TYPE = 'number'
const UNDEFINED_TYPE = 'undefined'

export function mergeStyles(currentStyle: any, style: any) {
  const currentStyleType = typeof currentStyle

  if (currentStyle === null || currentStyleType === UNDEFINED_TYPE) {
    return style
  }

  if (Array.isArray(currentStyle)) {
    return currentStyle.concat(style)
  }

  if (Array.isArray(style)) {
    return [currentStyle].concat(style)
  }

  if (currentStyleType === NUMBER_TYPE || typeof style === NUMBER_TYPE) {
    return [currentStyle, style]
  }

  return Object.assign({}, currentStyle, style)
}
