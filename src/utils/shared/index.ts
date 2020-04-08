import { warn } from '../debug';
import { extend } from '../mixin';
export * from './constants';

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
export function noop(a?: any, b?: any, c?: any): any { };

/**
 * Always return false.
 */
export const no = (a?: any, b?: any, c?: any) => false

/**
 * Define a property.
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

export function remove(arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Create a cached version of a pure function.
 */
export function cached<F extends (s:string)=>any> (fn:F): F {
  const cache = Object.create(null);
  const cachedFn =  (str: string): any =>{
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }
  return <F>cachedFn;
}

/**
 * Query an element selector if it's not an element already.
 */
export function query (el: string | Element): Element {
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
export function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}