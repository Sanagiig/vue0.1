import Vue from './instance/index';
import { initGlobalAPI } from './global-api/index';

initGlobalAPI(Vue);

// Object.defineProperty(Vue.prototype, '$isServer', {
//   // get: isServerRendering
//   get: function(){
//     return false
//   }
// })

// Object.defineProperty(Vue.prototype, '$ssrContext', {
//   get () {
//     /* istanbul ignore next */
//     return this.$vnode && this.$vnode.ssrContext
//   }
// })

// // expose FunctionalRenderContext for ssr runtime helper installation
// Object.defineProperty(Vue, 'FunctionalRenderContext', {
//   value: FunctionalRenderContext
// })

Vue.version = '__VERSION__';

export default Vue;