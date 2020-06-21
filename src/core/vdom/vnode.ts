export default class VNode {
  tag?: string;
  data?: VNodeData;
  children ?: Array<VNodeInstance>;
  text?: string  ;
  elm?: Element;
  ns?: string;
  context?: Component; // rendered in this component's scope
  key?: string | number;
  componentOptions?: VNodeComponentOptions;
  componentInstance?: Component; // component instance
  parent?: VNodeInstance; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory?: Function; // async component factory function
  asyncMeta?: any;
  isAsyncPlaceholder: boolean;
  ssrContext?: any ;
  fnContext?: Component; // real context vm for functional nodes
  fnOptions ?: ComponentOptions; // for SSR caching
  devtoolsMeta?: any; // used to store functional render context for devtools
  fnScopeId ?: string; // functional scope id support

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: VNodeInstance[],
    text?:string,
    elm?: Element,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?:Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | undefined {
    return this.componentInstance
  }
}

// 创建空白vnode (comment)
export const createEmptyVNode = (text: string = ''): VNodeInstance => {
  const node = new VNode();
  node.text = text;
  node.isComment = true;
  return node;
}

// 创建文本节点
export function createTextVNode (val: string | number):VNodeInstance {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
export function cloneVNode (vnode: VNodeInstance): VNodeInstance {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );

  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.asyncMeta = vnode.asyncMeta;
  cloned.isCloned = true;
  return cloned;
}