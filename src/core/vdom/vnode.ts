export default class VNode {
  text?: string;
  parent?: VNodeInstance;
  data?: VNodeData;
  // empty comment placeholder?
  isComment: boolean; 
  // rendered in this component's scope
  context: Component; 
  componentOptions?: VNodeComponentOptions;

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: VNodeInstance[],
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?:Function
  ) {
    this.isComment = false;
    this.context = <any>{};
  }
}

export const createEmptyVNode = (text: string = ''): VNode => {
  const node = new VNode();
  node.text = text;
  node.isComment = true;
  return node;
}