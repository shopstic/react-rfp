const NUMBER_TYPE = 'number'
const UNDEFINED_TYPE = 'undefined'

/**
 * Merges two style sets together. Precedence is given to the second style.
 * @param style1 The first style.
 * @param style2 The second style.
 */
export function mergeStyles(style1: any, style2: any) {
  const style1Type = typeof style1

  if (style1 === null || style1Type === UNDEFINED_TYPE) {
    return style2
  }

  if (Array.isArray(style1)) {
    return style1.concat(style2)
  }

  if (Array.isArray(style2)) {
    return [style1].concat(style2)
  }

  if (style1Type === NUMBER_TYPE || typeof style2 === NUMBER_TYPE) {
    return [style1, style2]
  }

  return Object.assign({}, style1, style2)
}
