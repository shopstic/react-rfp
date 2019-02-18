const DATE_TYPE = '[object Date]'

function isDate(value: any) {
  return Object.prototype.toString.call(value) === DATE_TYPE
}

export function deepEquals(origin: any, target: any): boolean {
  const originType = typeof origin
  const targetType = typeof target

  if (originType === targetType) {
    if (originType === 'object') {
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

  return false
}

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
