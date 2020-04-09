declare interface VNodeInstance {
  test?: string;
  data?: VNodeData;
  parent: VNodeInstance;
  // rendered in this component's scope
  context: Component; 
  // 组件opts
  componentOptions: VNodeComponentOptions | void;
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