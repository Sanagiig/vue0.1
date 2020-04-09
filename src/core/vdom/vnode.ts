export default class VNode {
  text?: string;
  parent?: VNodeInstance;
  // empty comment placeholder?
  isComment: boolean; 
  // rendered in this component's scope
  context: Component; 
  constructor() {
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