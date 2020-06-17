/**
 * Runtime helper for rendering static trees.
 */
// _staticTrees
// 通过$options.staticRenderFns(编译时确定) 取缓存的静态节点函数
// 将其渲染成dom 到 _staticTrees[index]
// 并为elm加上 isStatic , key
// v-for 的静态节点则不缓存，每次都通过 $options.staticRenderFns 渲染
export function renderStatic (
  this:any,
  index: number,
  isInFor?: boolean
): VNodeInstance | Array<VNodeInstance> {
  const cached = this._staticTrees || (this._staticTrees = [])
  let tree = cached[index]
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  if (tree && !isInFor) {
    return tree
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates
  )
  markStatic(tree, `__static__${index}`, false)
  return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
// elm => isStatic key isOnce
export function markOnce (
  tree: VNodeInstance | Array<VNodeInstance>,
  index: number,
  key: string
) {
  markStatic(tree, `__once__${index}${key ? `_${key}` : ``}`, true)
  return tree
}

// elm 添加 isStatic
function markStatic (
  tree: VNodeInstance | Array<VNodeInstance>,
  key: string,
  isOnce: boolean
) {
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], `${key}_${i}`, isOnce)
      }
    }
  } else {
    markStaticNode(tree, key, isOnce)
  }
}

function markStaticNode (node:any, key:string, isOnce:boolean) {
  node.isStatic = true
  node.key = key
  node.isOnce = isOnce
}
