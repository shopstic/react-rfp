const DATE_TYPE = '[object Date]'

/**
 * Checks if the value is date.
 * @param value The value.
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
 * @param value1 The first value.
 * @param value2 The second value.
 * @returns `true` if the values are considered equal.
 */
export function deepEquals(value1: any, value2: any): boolean {
  const v1Type = typeof value1
  const v2Type = typeof value2

  if (v1Type !== v2Type) {
    return false
  }

  if (v1Type === 'object') {
    if (isDate(origin)) {
      return isDate(value2) ? value1.getTime() === value2.getTime() : false
    }

    for (const key in value1) {
      if (!(key in value2)) {
        return false
      }

      if (!deepEquals(value1[key], value2[key])) {
        return false
      }
    }

    for (const key in value2) {
      if (!(key in value1)) {
        return false
      }
    }

    return true
  } else {
    return origin === value2
  }
}

/**
 * Compares if two values are equal using a shallow equality check.
 * If the values are objects, a shallow comparison is performed on the keys of
 * the object. Arrays are not supported. See also: [[deepEquals]]
 * @param value1 The first value.
 * @param value2 The second value.
 * @returns `true` if the values are equal.
 */
export function shallowCompare(value1: any, value2: any): boolean {
  if (isDate(value1) && isDate(value2)) {
    return value1.getTime() === value2.getTime()
  }

  if (value1 === null || value2 === null) {
    return value1 === value2
  }

  if (typeof value1 !== 'object' || typeof value2 !== 'object') {
    return value1 === value2
  }

  const keys = Object.keys(value1)

  if (keys.length !== Object.keys(value2).length) {
    return false
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const xv = value1[key]
    const yv = value2[key]

    if (isDate(value1) && isDate(value2)) {
      if (value1.getTime() !== value2.getTime()) {
        return false
      }
    } else if (xv !== yv) {
      return false
    }
  }

  return true
}
