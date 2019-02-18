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
