import config from '@config/index';
import builtInComponents from '@core/components/index';
import { ASSET_TYPES } from '@utils/shared/constants';
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import {
	nextTick,
	warn,
	defineReactive,
	extend,
	mergeOptions,
} from '@utils/index';
import {
	observe,
	set,
	del
} from '@observer/index';

/**
 * 绑定 Vue 静态方法
 * util = { warn, extend, mergeOptions, defineReactive }
 * set , delete , nextTick, observable
 * options = {} , options = {components, directives, filters}
 * options._base = Vue
 * extend(Vue.options.components, builtInComponents); 注册内建组件
 * use, mixin, extend, component,filter, directive
 */
export function initGlobalAPI(Vue: GlobalAPI) {
	// config
	const configDef: any = {};
	configDef.get = () => config;
	if (process.env.NODE_ENV !== 'production') {
		configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
	}

	Object.defineProperty(Vue, 'config', configDef);

	// exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
	// them unless you are aware of the risk.
	Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
	}
	
	Vue.set = set;
	Vue.delete = del;
	Vue.nextTick = nextTick;

	 // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
	}
	
	Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
		Vue.options[type + 's'] = Object.create(null);
	})
	
	// this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
	Vue.options._base = Vue;

	extend(Vue.options.components, builtInComponents);

	initUse(Vue);
	initMixin(Vue);
	initExtend(Vue);
	// component filter directive 方法的注册
	initAssetRegisters(Vue);
}