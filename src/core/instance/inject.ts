import { hasOwn } from '../../utils/assert';
import {
  warn,
  hasSymbol
} from '@utils/index';
import {
  toggleObserving,
  defineReactive
} from '@observer/index';

// 解析 inject 中的注入属性（from）
export function resolveInject(inject: any, vm: Component): any {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null);
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject);
    
    for (let i = 0; i < keys.length; i++){
      const key = keys[i];
      // #6574 in case the inject object is observed...
      if (key === '__ob__') continue;
      const provideKey = inject[key].from;
      let source: Component | undefined = vm;
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break;
        }
        source = source.$parent;
      }

      if (!source) {
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault;
          
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${<string>key}" not found`, vm);
        }
      }
    }
    return result;
  }
}

export function initInjections(vm: Component) {
  const result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key]);
      }
    })
    toggleObserving(true);
  }
}

export function initProvide(vm: Component) {
  const provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof vm.$options.provide === 'function'
      ? provide.call(vm)
      : provide;
  }
}

