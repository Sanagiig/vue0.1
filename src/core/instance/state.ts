import { set,del } from '@observer/index';
import Dep from '@observer/dep';
import Watcher from '../observer/watcher';
import { observe, toggleObserving, defineReactive } from '../observer/index';
import {
  noop,
  warn,
  handleError,
  cached,
  isPlainObject,
  isServerRendering,
  nativeWatch,
  validateProp,
  hyphenate,
  bind,
  isReservedAttribute,
  hasOwn,
  isReserved,
} from '@utils/index';
import config from '@config/index';
import { isUpdatingChildComponent } from './lifecycle';
import { getHeapCodeStatistics } from 'v8';
import { pushTarget, popTarget } from '../observer/dep';

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

const computedWatcherOptions = { lazy: true };

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

export function getData(data: Function, vm: Component): any {
  pushTarget();
  try {
    return data.call(vm, vm);
  } catch (e) {
    handleError(e, vm, `data()`);
    return {};
  } finally {
    popTarget();
  }
}

// 将计算属性的 get() 赋值到 vm 属性的get()
export function defineComputed(
  target: any,
  key: string,
  userDef: any | Function
) {
  const shouldCache = !isServerRendering();
  // 如果计算属性 fn 拥有 get 或 userDef.get , 
  // 则vm[key] 的get 与 watch.evaluate 相关联并且当前watcher 会 调用depend 收集依赖
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
    const watcher:WatcherInstance = this._computedWatchers && this._computedWatchers[key];
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

function createWatcher(
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: WatcherOption
):Function {
  if (isPlainObject(handler)) {
    options = handler;
    handler = (<WatcherOption>options).handler;
  }

  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options);
}

// 为 $data && $props 注册代理 映射至 _data && __props
// $set $delete $watch
export function stateMixin(Vue: ComponentCtor) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef:any = {};
  dataDef.get = function (this: Component) { return this._data };
  const propsDef: any = {};
  propsDef.get = function (this: Component) { return this._props };

  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function (this:Component) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this);
    }
  }

  Object.defineProperty(Vue.prototype, '$data', dataDef);
  Object.defineProperty(Vue.prototype, '$props', propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  Vue.prototype.$watch = function (
    this:Component,
    expOrFn: string | Function,
    cb: any,
    options: WatcherOption
  ): Function{
    const vm = this;
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options);
    }

    options = options || {};
    options.user = true;
    const watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.imediate) {
      try {
        cb.call(vm, watcher.value);
      } catch (error) {
        handleError(
          error,
          vm, `callback for immediate watcher "${watcher.expression}"`);
      }
    }
    return function upwatchFn() {
      watcher.teardown();
    }
  }
}

export function initState(vm: Component) {
  vm._watchers = [];
  const opts = vm.$options;
  if (opts.props) initProps(vm, opts.props);
  if (opts.methods) initMethods(vm, opts.methods);
  if (opts.data) {
    initData(vm);
  } else {
    observe(vm._data = {}, true);
  }
  if (opts.computed) initComputed(vm, opts.computed);
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

function initProps(vm: Component, propsOptions: any) {
  const propsData = vm.$options.propsData || {};
  const props = vm._props = {};

  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys:any = vm.$options._propKeys = [];
  const isRoot = !vm.$parent;

  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false);
  }

  for (const key in propsOptions) {
    keys.push(key);
    const value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey)
        || config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        );
      }

      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          );
        }
      })
    } else {
      defineReactive(props, key, value);
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, '_props', key);
    }
  }
  toggleObserving(true);
}

function initData(vm: Component) {
  let data: any = vm.$options.data;
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};
  if (!isPlainObject(data)) {
    data = {};
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data);
  const props = vm.$options.props;
  const methods = vm.$options.methods;
  let i = keys.length;
  while (i--) {
    const key = keys[i];
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        );
      }
    }

    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, '_data', key);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}

function initComputed(vm: Component, computed: any) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  const isSSR = isServerRendering();

  for (const key in computed) {
    const userDef = computed[key];
    const getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}

function initMethods(vm: Component, methods: any) {
  const props = vm.$options.props;
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
  }
}

function initWatch(vm: Component, watch: any) {
  for (const key in watch) {
    const handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++){
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}