import { mergeStyles } from './mergeStyles'
import { mergeFunctions } from './mergeFunctions'
import classnames from 'classnames'

const STYLE_PROP = 'style'
const CLASSNAME_PROP = 'className'
const FUNCTION_TYPE = 'function'

interface PropObject {
  [key: string]: any
}

/**
 * Merges multi sets of props into a single object. Has special handling to merge
 * styles, classnames and functions to ensure they are aggregated. If keys clash, priority
 * is given to those at the end.
 * @param propSets The props to merge.
 * @returns The merged props.
 */
export function mergeProps(...propSets: PropObject[]) {
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
