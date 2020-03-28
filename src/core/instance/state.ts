import { cached } from '../../utils/shared/index';
import Dep from '@observer/dep';
import {
  noop,
  warn,
  isServerRendering,
} from '@utils/index';

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

// 提供一个固定的sourceKey , 实现快捷操作属性
export function proxy(
  target: any,
  sourceKey: string,
  key: string): any {
  sharedPropertyDefinition.get = function proxyGetter(this:any) {
    return this[sourceKey][key];    
  }
  sharedPropertyDefinition.set = function proxySetter(this:any,val) {
    this[sourceKey][key] = val;
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

export function defineComputed(
  target: any,
  key: string,
  userDef: any | Function
) {
  const shouldCache = !isServerRendering();
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = userDef.get
      ? createComputedGetter(key)
      : createGetterInvoker(userDef);
    sharedPropertyDefinition.set = noop;

  } else {
    sharedPropertyDefinition.get = userDef.cachhe !== false
      ? shouldCache && userDef.cached !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop;
    
    sharedPropertyDefinition.set = userDef.set || noop;
  }

  if (process.env.NODE_ENV !== 'production' &&
    sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
        warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

// mark
function createComputedGetter(key: any): () => any {
  return function computedGetter(this:Component) {
    const watcher:Watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }

      // 更新计算属性watcher的依赖
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value;
    }
  }
}

function createGetterInvoker(fn: Function): () => any{
  return function computedGetter(this: Component) {
    return fn.call(this, this);
  }
}