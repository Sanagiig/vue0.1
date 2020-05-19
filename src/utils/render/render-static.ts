/**
 * Runtime helper for rendering static trees.
 */
export function renderStatic (
  this:any,
  index: number,
  isInFor?: boolean
): VNodeInstance | VNodeChildren {
  return <any>{}
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
export function markOnce (
  tree: VNodeInstance | Array<VNodeInstance>,
  index: number,
  key: string
) {
  markStatic(tree, `__once__${index}${key ? `_${key}` : ``}`, true)
  return tree
}

function markStatic (
  tree: VNodeInstance | Array<VNodeInstance>,
  key: string,
  isOnce: boolean
) {
  
}