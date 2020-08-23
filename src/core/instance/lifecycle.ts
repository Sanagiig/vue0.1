import { mark, measure } from '@utils/index';
import { pushTarget, popTarget } from '@observer/dep';
import { createEmptyVNode } from '@core/vdom/vnode';
import config from '@config/index';
import Watcher from '@observer/watcher';
import { toggleObserving } from '../observer/index';
import { updateComponentListeners } from './events';
import {
  warn,
  noop,
  remove,
  emptyObject,
  validateProp,
  invokeWithErrorHandling,
  resolveSlots
} from '@utils/index';

export let activeInstance: any = null
export let isUpdatingChildComponent: boolean = false;

function isInInactiveTree (vm:any) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return true
  }
  return false
}

export function activateChildComponent(vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    callHook(vm, 'activated')
  }
}

export function callHook(vm: Component | any, hook: string) {
  // #7573 disable dep collection when invoking lifecycle hooks

  pushTarget();
  const handlers = vm.$options[hook];
  const info = `${hook} hook`;
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++){
      invokeWithErrorHandling(handlers[i], vm, null, vm, info);
    }
  }

  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
  popTarget();
}

/**
 * 挂载，创建vm._watch 作为渲染函数监听
 * 当有属性被修改时调用，并触发 beforeUpdate 狗子
 * mounted 狗子
 */
export function mountComponent(
  vm: Component,
  el: Element | null,
  hydrating?: boolean
): Component | any {
  vm.$el = <Element>el;
  if (!vm.$options.render) {
    vm.$options.render = <any>createEmptyVNode;
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#')
        || vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  callHook(vm, 'beforeMount');
  console.log('render',vm._render())
  let updateComponent;
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    // mark
    updateComponent = () => {
      const name = vm._name;
      const id = vm._uid;
      // const startTag = `vue-perf-start:${id}`
      // const endTag = `vue-perf-end:${id}`

      // mark(startTag)
      const vnode = vm._render()
      // mark(endTag)
      // measure(`vue ${name} render`, startTag, endTag)

      // mark(startTag)
      vm._update(vnode, hydrating)
      // mark(endTag)
      // measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating);
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
    before() {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate');
      }
    }
  }, true);
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true;
    callHook(vm, 'mounted');
  }
  return vm;
}

export function setActiveInstance(vm: Component):any {
  const prevActiveInstance = activeInstance;
  activeInstance = vm;
  return () => {
    activeInstance = prevActiveInstance;
  }
}

// _update $forceUpdate
// 
export function lifecycleMixin(Vue: ComponentCtor) {
  // __patch__ 时 更改 activeInstance 
  // 修改 _vnode ，  elm.__vue__ = vm
  Vue.prototype._update = function (
    this: Component,
    vnode: VNodeInstance,
    hydrating?: boolean) {
    const vm = this;
    const prevEl = vm.$el;
    const prevVnode = vm._vnode;
    const restoreActiveInstance = setActiveInstance(vm);
    vm._vnode = vnode;
    console.log('vnode',prevVnode, vnode)
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    restoreActiveInstance();

    // update __vue__ reference
    if (prevEl) {
      (<any>prevEl).__vue__ = null;
    }
    if (vm.$el) {
      (<any>vm.$el).__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  }
  // 调用 vm._watcher.update => vm._update => vm._update(vm._render(), hydrating)
  Vue.prototype.$forceUpdate = function (this:Component) {
    const vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  }

  // beforeDestroy hook
  // 从$parent.$children 中删除
  // vm._watcher.teardown() && vm._watchers[i].teardown();
  // vm.__patch__(vm._vnode, null);
  // callHook(vm, 'destroyed'); vm.$off();
  Vue.prototype.$destroy = function (this:Component) {
    const vm = this;
    if (vm._isBeingDestroyed) {
      return;
    }
    callHook(vm, 'beforeDestroy');
    vm._isBeingDestroyed = true;
    // remove self from parent
    const parent = vm.$parent;
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm);
    }

    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    let i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }

    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }
    // call the last hook...
    vm._isDestroyed = true;
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);
    // fire destroyed hook
    callHook(vm, 'destroyed');
    vm.$off();
    // remove __vue__ reference
    if (vm.$el) {
      (<any>vm.$el).__vue__ = null;
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null;
    }
  }
}

// 初始化生命周期相关属性
export function initLifecycle(vm: Component) {
  const options: ComponentOptions = vm.$options;

  // locate first non-abstract parent
  let parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    // 在非抽象父组件中建立子关系
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;
  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}

/**
 * 更改 $options._parentVnode , $vnode, vm._vnode.parent 为 parentVnode
 * $options._renderChildren = renderChildren
 * 更改 $attrs $listeners 
 * 更改 $slots , 使用 renderChildren && parent.context 获取新的被插槽分发的内容  
 */
export function updateChildComponent (
  vm: Component | any,
  propsData: any,
  listeners: any,
  parentVnode: MountedComponentVNode,
  renderChildren: Array<VNodeInstance> | null
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren
  const hasChildren = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    parentVnode.data.scopedSlots || // has new scoped slots
    vm.$scopedSlots !== emptyObject // has old scoped slots
  )

  vm.$options._parentVnode = parentVnode
  vm.$vnode = parentVnode // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode
  }
  vm.$options._renderChildren = renderChildren

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject
  vm.$listeners = listeners || emptyObject

  // update props
  // 根据 vm.$options._propKeys (默认初始化选项 props key) 与 propsData
  // 对 vm._props[key] 进行修改 并做一些props 合法校验
  // 修改 vm.$options.propsData
  if (propsData && vm.$options.props) {
    toggleObserving(false)
    const props = vm._props
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions: any = vm.$options.props // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    // keep a copy of raw propsData
    vm.$options.propsData = propsData
  }

  // update listeners
  // 根据传入的 listeners 对 原 vm.$options._parentListeners
  // 进行更新 vm.on 更新
  listeners = listeners || emptyObject
  const oldListeners = vm.$options._parentListeners
  vm.$options._parentListeners = listeners
  updateComponentListeners(vm, listeners, oldListeners)

  // resolve slots + force update if has children
  // 更新 当前组件内部实现的插槽 <xx slot="name"></xx>
  if (hasChildren) {
    vm.$slots = resolveSlots(<VNodeInstance[]>renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }

  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false
  }
}

export function deactivateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    callHook(vm, 'deactivated')
  }
}
