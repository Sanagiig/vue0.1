import { isPrimitive, isTrue, isDef } from '../assert';
import { createEmptyVNode } from '../../core/vdom/vnode';
import { warn } from '../debug';
import { normalizeChildren, simpleNormalizeChildren } from './normalize-children';
import config from '@config/index';
import VNode from '../../core/vdom/vnode';
import { createComponent } from './create-component';

const SIMPLE_NORMALIZE = 1;
const ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNodeInstance | Array<VNodeInstance> | VNode{
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType);
}

export function _createElement(
  context: Component,
  tag?: string | ComponentCtor | Function | any,
  data?: VNodeData | any,
  children?: any,
  normalizationType?: number
): VNodeInstance | Array<VNodeInstance> | VNode{
  if (isDef(data) && isDef((<any>data).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode();
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode();
  }
  // warn against non-primitive key
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    // if (!__WEEX__ || !('@binding' in data.key)) {
    //   warn(
    //     'Avoid using non-primitive value as key, ' +
    //     'use string/number value instead.',
    //     context
    //   )
    // }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children)
    && typeof children[0] === 'function') {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  let vnode: any, ns;
  if (typeof tag === 'string') {
    let Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    }
  }else {
    // direct component options / constructor
    vnode = createComponent(tag,data,context,children);
  }
  if(Array.isArray(vnode)){
    return vnode;
  }else if(isDef(vnode)){
    if(isDef(ns)) applyNS(vnode,ns);
    if(isDef(data)) registerDeepBindings(data);
    return vnode;
  }else{
    return createEmptyVNode();
  }
}

function applyNS (vnode:any, ns:any, force?:any) {}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings (data:any) {}