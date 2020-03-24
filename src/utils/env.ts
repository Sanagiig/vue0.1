// can we use __proto__?
export const hasProto = '__proto__' in {};
// Browser environment sniffing
export const inBrowser = typeof window !== 'undefined'
export const UA = inBrowser && window.navigator.userAgent.toLowerCase()
export const inWeex = false // typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform
/* istanbul ignore next */
export function isNative (Ctor: any): boolean {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}
export const isIE = UA && /msie|trident/.test(UA)
export const isIOS = false //(UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios')
// detect devtools
export const devtools = inBrowser && (<any>window).__VUE_DEVTOOLS_GLOBAL_HOOK__

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
