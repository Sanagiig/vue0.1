export default class VNode{
  text?: string;
  parent?: VNode;
  // empty comment placeholder?
  isComment: boolean; 

  constructor() {
    this.isComment = false;
  }
}

export const createEmptyVNode = (text: string = ''): VNode => {
  const node = new VNode();
  node.text = text;
  node.isComment = true;
  return node;
}