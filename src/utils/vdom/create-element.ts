import { isPrimitive, isTrue, isDef,isUndef,isObject,warn } from '@utils/index';
import VNode,{ createEmptyVNode } from '@core/vdom/vnode';
import { normalizeChildren, simpleNormalizeChildren } from './normalize-children';
import config from '@config/index';
import { createComponent } from './create-component';
import { traverse } from '@core/observer/traverse';
import { resolveAsset } from '../options';

const SIMPLE_NORMALIZE = 1;
const ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
/**
 * 创建 vnode 并会对子节点进行标准化
 */
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNodeInstance | Array<VNodeInstance>{
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

// 根据参数返回vnode 或 component
/**
 * data.__ob__  检验
 * data.is => tag  ??
 * 空 tag 检验
 * 处理 单一children 且 child 是fn，作为具名插槽 
 * 标准化 children
 * tag is string && tag isReservedTag => 创建 Vnode
 */
export function _createElement(
  context: Component,
  tag?: string | ComponentCtor | Function | any,
  data?: VNodeData | any,
  children?: any,
  normalizationType?: number
): VNodeInstance | Array<VNodeInstance> | VNode{
  // 不接受OB data对象
  if (isDef(data) && isDef((<any>data).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode();
  }
  // object syntax in v-bind
  // 直接创建 ？？ mark
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
  // 单子节点，且是fn，则作为默认具名插槽
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
  // 
  if (typeof tag === 'string') {
    let Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );

      // 获取已注册的组件
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
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

// 更新除svg外的子节点SN
function applyNS (vnode:any, ns:any, force?:any) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force)
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
//  :style :class 收集当前 watch 依赖
function registerDeepBindings (data:any) {
  if (isObject(data.style)) {
    traverse(data.style)
  }
  if (isObject(data.class)) {
    traverse(data.class)
  }
}