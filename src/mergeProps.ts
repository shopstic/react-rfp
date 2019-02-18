import { mergeStyles } from './mergeStyles'
import { mergeFunctions } from './mergeFunctions'
// @ts-ignore
import classnames from 'classnames'

const STYLE_PROP = 'style'
const CLASSNAME_PROP = 'className'
const FUNCTION_TYPE = 'function'

export function mergeProps(...propSets: any[]) {
  return propSets.reduce((merged, props) => {
    for (const key in props) {
      const value = props[key]

      if (key === STYLE_PROP) {
        merged.style = STYLE_PROP in merged ? mergeStyles(merged.style, value) : value
        continue
      }

      if (key === CLASSNAME_PROP) {
        merged.className = CLASSNAME_PROP in merged ? classnames(merged.className, value) : value
        continue
      }

      if (typeof value === FUNCTION_TYPE) {
        merged[key] =
          typeof merged[key] === FUNCTION_TYPE ? mergeFunctions(merged[key], value) : value
        continue
      }

      merged[key] = value
    }

    return merged
  }, {})
}
