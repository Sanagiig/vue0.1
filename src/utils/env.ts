import { isXlink } from './assert';
import { makeMap } from './convert/index';

// Firefox has a "watch" function on Object.prototype...
export const nativeWatch = (<any>{}).watch

export const emptyObject = Object.freeze({});
// can we use __proto__?
export const hasProto = '__proto__' in {};
// Browser environment sniffing
export const inBrowser = typeof window !== 'undefined'
export const UA = inBrowser && window.navigator.userAgent.toLowerCase()
export const inWeex = false // typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform
export const isIE = UA && /msie|trident/.test(UA)
export const isIE9 = UA && UA.indexOf('msie 9.0') > 0
export const isEdge = UA && UA.indexOf('edge/') > 0
export const isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge
export const isIOS = false //(UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios')
export let supportsPassive = false

/**
 * Return the same value.
 */
export const identity = (_: any) => _;

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
let _isServer:any
export const isServerRendering = () => {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'] && global['process'].env.VUE_ENV === 'server'
    } else {
      _isServer = false
    }
  }
  return _isServer
}

export interface SimpleSet {
  has(key: string | number): boolean;
  add(key: string | number): any;
  clear(): void;
}

// xml
export const xlinkNS = 'http://www.w3.org/1999/xlink'

export const isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
)

export const isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck')

export const getXlinkProp = (name: string): string => {
  return isXlink(name) ? name.slice(6, name.length) : ''
}

