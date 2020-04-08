import { mergeOptions,extend } from '@utils/index';
import { initProxy } from './proxy';
import { initLifecycle, callHook } from './lifecycle';
import { initEvents } from './events';
import { initRender } from './render';
import { initInjections, initProvide } from './inject';
import { initState } from './state';

let uid = 0;
export function initMixin(Vue: ComponentCtor) {
  Vue.prototype._init = function (
    this: Component, options?: ComponentOptions) {
    const vm = this;
    vm._uid = uid++;

    let startTag, endTag;
    // mark
    /* istanbul ignore if */
    // if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    //   startTag = `vue-perf-start:${vm._uid}`
    //   endTag = `vue-perf-end:${vm._uid}`
    //   mark(startTag)
    // }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 组件的$options = vm.constructor.options
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        <ComponentOptions>options || {},
        vm
      )
    }

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }

    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    // resolve injections before data/props
    initInjections(vm);
    initState(vm);
    // resolve provide after data/props
    initProvide(vm);
    callHook(vm, 'created');

    // mark
    /* istanbul ignore if */
    // if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    //   vm._name = formatComponentName(vm, false)
    //   mark(endTag)
    //   measure(`vue ${vm._name} init`, startTag, endTag)
    // }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  }
}

// mark
// 初始化内部组件，使用父Vnode 的配置生成当前组件的一些配置
export function initInternalComponent(
  vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  const vnodeComponentOptions = <VNodeComponentOptions>parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 解析构造函数中opts
export function resolveConstructorOptions(
  Ctor: ComponentCtor): ComponentOptions {
  let options = Ctor.options;
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super);
    // 父原始opts
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      // 获取原始的 Copts 和 最新的Copts 更改的值
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      // 将修改的opts属性作为扩展选项中的属性
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      // 将自身构造函数作为组件
      if (options.name) {
        (<any>options.components)[options.name] = Ctor;
      }
    }
  }
  return options;
}

function resolveModifiedOptions(Ctor: ComponentCtor): any {
  let modeified: any;
  const latest = Ctor.options;
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modeified) modeified = {};
      modeified[key] = latest[key];
    }
  }
  return modeified;
}