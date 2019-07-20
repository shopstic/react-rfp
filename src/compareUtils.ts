const DATE_TYPE = '[object Date]'

/**
 * Checks if the value is date.
 * @param value
 * @returns `true` if the value is a date.
 */
export function isDate(value: any) {
  return Object.prototype.toString.call(value) === DATE_TYPE
}

/**
 * Compares if two values are equal using a deep equality check.
 * If the values are objects, each key will be checked against the target,
 * object references will be traversed recursively. Arrays will only be
 * compared by reference.
 * @param origin
 * @param target
 * @returns `true` if the values are considered equal.
 */
export function deepEquals(origin: any, target: any): boolean {
  const originType = typeof origin
  const targetType = typeof target

  if (originType !== targetType) {
    return false
  }

  if (originType === 'object') {
    if (isDate(origin)) {
      return isDate(target) ? origin.getTime() === target.getTime() : false
    }

    for (const key in origin) {
      if (!(key in target)) {
        return false
      }

      if (!deepEquals(origin[key], target[key])) {
        return false
      }
    }

    for (const key in target) {
      if (!(key in origin)) {
        return false
      }
    }

    return true
  } else {
    return origin === target
  }
}

/**
 * Compares if two values are equal using a shallow equality check.
 * If the values are objects, a shallow comparison is performed on the keys of
 * the object. Arrays are not supported. See also: [[deepEquals]]
 * @param x
 * @param y
 * @returns `true` if the values are equal.
 */
export function shallowCompare(x: any, y: any): boolean {
  if (isDate(x) && isDate(y)) {
    return x.getTime() === y.getTime()
  }

  if (x === null || y === null) {
    return x === y
  }

  if (typeof x !== 'object' || typeof y !== 'object') {
    return x === y
  }

  const keys = Object.keys(x)

  if (keys.length !== Object.keys(y).length) {
    return false
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const xv = x[key]
    const yv = y[key]

    if (isDate(x) && isDate(y)) {
      if (x.getTime() !== y.getTime()) {
        return false
      }
    } else if (xv !== yv) {
      return false
    }
  }

  return true
}
