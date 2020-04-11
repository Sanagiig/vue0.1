import {
  resolveSlots,
  createElement,
  emptyObject,
  warn,
  nextTick,
  installRenderHelpers,
  normalizeScopedSlots,
} from '@utils/index';
import { defineReactive } from '../observer/index';
import { isUpdatingChildComponent } from './lifecycle';
import { handleError } from '../../utils/error';
import VNode from '../vdom/vnode';
import { createEmptyVNode } from '../vdom/vnode';

export function renderMixin(Vue: ComponentCtor) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype);

  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick;
  }

  Vue.prototype._render = function (tihs:Comment): VNode{
    const vm = this;
    const { render, _parentVnode } = vm.$options;

    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots
      )
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    let vnode: VNode;
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      handleError(e, vm, 'render');
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
        } catch (e) {
          handleError(e, vm, 'renderError');
          vnode = vm.VNode;
        }
      } else {
        vnode = vm.VNode;
      }
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0];
    }

    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode;
  }
}

export function initRender(vm: Component | any) {
  // the root of the child tree
  vm.VNode = null;
  vm._staticTrees = null;
  const options: ComponentOptions = vm.$options;
  const parentVnode = vm.$vnode = options._parentVnode;
  const renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(
    (<VNodeInstance[]>options._renderChildren),
    <Component>renderContext
  );
  vm.$scopedSlots = emptyObject;
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = (a:any, b:any, c:any, d:any) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a:any, b:any, c:any, d:any) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs',
      parentData && parentData.attrs || emptyObject,
      () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm);
      }, true);
    
    defineReactive(vm, '$listeners',
      options._parentListeners || emptyObject,
      () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm);
    })
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true);
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true);
  }
}