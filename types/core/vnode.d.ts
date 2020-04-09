declare interface VNodeCtor{
  new (
    tag?: string| void,
    data?: VNodeData | void,
    children?: Array<VNodeInstance>,
    text?: string,
    elm?: Node | void,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) :VNodeInstance;
}

declare interface VNodeInstance {
  tag: string | void;
  data: VNodeData | void;
  child:Component | null | void;
  children?: Array<VNodeInstance>;
  text?: string  ;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNodeInstance | void | null; // component placeholder node

  // strictly internal
  // raw: boolean; // contains raw HTML? (server only)
  // isStatic: boolean; // hoisted static node
  // isRootInsert: boolean; // necessary for enter transition check
  // isComment: boolean; // empty comment placeholder?
  // isCloned: boolean; // is a cloned node?
  // isOnce: boolean; // is a v-once node?
  // asyncFactory: Function | void; // async component factory function
  // asyncMeta: any | void;
  // isAsyncPlaceholder: boolean;
  // ssrContext?: any;
  // fnContext: Component | void; // real context vm for functional nodes
  // fnOptions?: ComponentOptions; // for SSR caching
  // devtoolsMeta?: any; // used to store functional render context for devtools
  // fnScopeId?: string; // functional scope id support
}

declare type VNodeData = {
  slot?: string;
  scopedSlots?: { [key: string]: Function };
  attrs:any;
}

declare type VNodeComponentOptions = {
  Ctor: ComponentCtor;
  propsData?: PropOptions;
  listeners: any;
  children: Array<VNodeInstance>;
  tag?: string;
};

declare type ScopedSlotsData = Array<{ key: string, fn: Function }>;