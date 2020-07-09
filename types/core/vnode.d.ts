declare interface VNodeCtor{
  new (
    tag?: string| void,
    data?: VNodeData,
    children?: Array<VNodeInstance>,
    text?: string,
    elm?: Element,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) :VNodeInstance;
}

declare interface VNodeInstance {
  tag?: string;
  data?: VNodeData;
  child?:Component;
  children?: Array<VNodeInstance>;
  text?: string  ;
  elm?: Element;
  ns?: string;
  context?: Component; // rendered in this component's scope
  key?: string | number;
  componentOptions?: VNodeComponentOptions;
  componentInstance?: Component; // component instance
  parent?: VNodeInstance | null; // component placeholder node

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
  ssrContext?: any;
  fnContext?: Component; // real context vm for functional nodes
  fnOptions?: ComponentOptions; // for SSR caching
  devtoolsMeta?: any; // used to store functional render context for devtools
  fnScopeId?: string; // functional scope id support
}

declare type VNodeData = {
  key?: string | number;
  slot?: string;
  ref?: string;
  is?: string;
  pre?: boolean;
  tag?: string;
  staticClass?: string;
  class?: any;
  staticStyle?: { [key: string]: any };
  style?: Array<any> | any;
  normalizedStyle?: any;
  props?: { [key: string]: any };
  attrs?: { [key: string]: string };
  domProps?: { [key: string]: any };
  hook?: { [key: string]: Function };
  on?: { [key: string]: Function | Array<Function> };
  // mark
  init?:any;
  nativeOn?: { [key: string]: Function | Array<Function> };
  transition?: any;
  show?: boolean; // marker for v-show
  inlineTemplate?: {
    render: Function;
    staticRenderFns: Array<Function>;
  };
  directives?: Array<VNodeDirective>;
  keepAlive?: boolean;
  scopedSlots?: { [key: string]: Function };
  model?: {
    value: any;
    callback: Function;
  };
  moved?:boolean;
}

// interface for vnodes in update modules
declare type VNodeWithData = {
  tag: string;
  data: VNodeData;
  children: Array<VNodeInstance>;
  text: void;
  elm: any;
  ns: string | void;
  context: Component;
  key: string | number | void;
  parent?: VNodeWithData;
  componentOptions?: VNodeComponentOptions;
  componentInstance?: Component;
  isRootInsert: boolean;
};

declare type VNodeComponentOptions = {
  Ctor: ComponentCtor;
  propsData?: PropOptions;
  listeners: any;
  children: Array<VNodeInstance>;
  tag?: string;
};

declare type VNodeChildren = Array<VNodeInstance | string> | string;

declare type VNodeDirective = {
  name: string;
  rawName: string;
  value?: any; 
  oldValue?: any;
  arg?: string;
  modifiers?: ASTModifiers;
  def?: any;
};

declare type ScopedSlotsData = Array<{ key: string, fn: Function }>;

declare type RenderFn = (
  val: any,
  keyOrIndex: string | number,
  index?: number
) => VNodeInstance

declare type MountedComponentVNode = {
  context: Component;
  componentOptions: VNodeComponentOptions;
  componentInstance: Component;
  parent: VNodeInstance;
  data: VNodeData;
};