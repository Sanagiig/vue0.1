declare interface VNode {
  test?: string;
  data?: VNodeData;
  parent: VNode;
  // rendered in this component's scope
  context: Component; 
  // 组件opts
  componentOptions: VNodeComponentOptions | void;
}

declare type VNodeData = {
  slot?: string;
  scopedSlots?: { [key: string]: Function };
}

declare type VNodeComponentOptions = {
  Ctor: ComponentCtor;
  propsData?: PropOptions;
  listeners: any;
  children: Array<VNode>;
  tag?: string;
};

declare type ScopedSlotsData = Array<{ key: string, fn: Function }>;