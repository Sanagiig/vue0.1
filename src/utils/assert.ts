import { makeMap } from './convert/index';

/**
 * Get the raw type string of a value, e.g., [object Object].
 */
const _toString = Object.prototype.toString

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
export function isUndef (v: any): boolean {
  return v === undefined || v === null
}

export function isDef (v: any): boolean {
  return v !== undefined && v !== null
}

export function isTrue (v: any): boolean {
  return v === true
}

export function isFalse (v: any): boolean {
  return v === false
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
export function isObject (obj: any): boolean {
  return obj !== null && typeof obj === 'object'
}

export function isPromise (val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

/**
 * Check whether an object has the property.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<any>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}

/**
 * Check if a tag is a built-in tag.
 */
export const isBuiltInTag = makeMap('slot,component', true)