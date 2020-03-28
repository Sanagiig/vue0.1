import { mergeOptions } from '@utils/options';

export function initMixin(Vue: GlobalAPI) {
  Vue.mixin = function (mixin: any) {
    this.options = mergeOptions(this.options, mixin);
    return this;
  }
}