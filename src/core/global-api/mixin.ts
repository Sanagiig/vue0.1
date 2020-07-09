import { mergeOptions } from '@utils/options';

/**
 * Vue.mixin
 * 合并选项, 将 Vue.options 与 mixin 合并
 * 并改变 Vue.options 
 */
export function initMixin(Vue: GlobalAPI) {
  Vue.mixin = function (mixin: any) {
    this.options = mergeOptions(this.options, mixin);
    return this;
  }
}