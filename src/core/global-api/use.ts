import { toArray } from '@utils/index';

/**
 * Vue.use 
 * vm._installedPlugins 记录已经安装组件
 * 如果已经注册则返回已有组件
 * plugin(...args) || plugin.install(...args)
 */
export function initUse(Vue: GlobalAPI) {
  Vue.use = function (this:ComponentCtor, plugin: any) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
    if (installedPlugins.indexOf(plugin) > -1) {
      return this;
    }

    // additional parameters
    const args = toArray(arguments, 1);
    args.unshift(this);
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args);
    }

    installedPlugins.push(plugin);
    return this;
  }
}