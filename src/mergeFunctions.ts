/**
 * Merges a series of functions into a single function that
 * will execute the constituent functions in sequence. Any non-function
 * values will be ignored.
 *
 * @param functions
 * @returns A function that will call constituent functions in sequence. If no
 * valid functions are passed, `undefined` is returned.
 */
export function mergeFunctions(...functions: Array<() => any>) {
  const nonEmptyFunctions = functions.filter(fn => typeof fn === 'function')

  if (nonEmptyFunctions.length === 0) {
    return
  }

  if (nonEmptyFunctions.length === 1) {
    return nonEmptyFunctions[0]
  }

  return function() {
    // @ts-ignore
    nonEmptyFunctions.forEach(fn => fn.apply(this, arguments))
  }
}
