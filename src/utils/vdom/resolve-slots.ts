/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 */

//  删除 children.data.attrs.slot
//  处理默认、具名插槽将插槽组成对象返回
/**
 * 将 attrs.slot 删除 , 如果 data.slot && context 与 child.context 相同(上下文一致)
 * 则 将child 作为插槽加入至 slots 否则 child 作为默认插槽
 */
export function resolveSlots (
  children: VNodeInstance[],
  context: Component
): { [key: string]: Array<VNodeInstance> } {
  if (!children || !children.length) {
    return {}
  }
  const slots:{[key:string]:any} = {}
  for (let i = 0, l = children.length; i < l; i++) {
    const child = children[i]
    const data = child.data
    // remove slot attribute if the node is resolved as a Vue slot node
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    // 当子节点 与 context 相同(子节点上下文没改变) 将 child 加入至slots[data.slot]
    // template tag 则将其 children 加入至 slots
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      const name = data.slot
      const slot = (slots[name] || (slots[name] = []))
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || [])
      } else {
        slot.push(child)
      }
    
    // \!data.slot || 上下文更改了，则将child 作为 default slot
    } else {
      (slots.default || (slots.default = [])).push(child)
    }
  }

  // ignore slots that contains only whitespace
  // 删除空白 slot
  for (const name in slots) {
    if (slots[name].every(isWhitespace)) {
      delete slots[name]
    }
  }
  return slots
}

function isWhitespace (node: VNodeInstance): boolean {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

export function resolveScopedSlots (
  fns: ScopedSlotsData, // see flow/vnode
  res?: any
): { [key: string]: Function } {
  res = res || {}
  for (let i = 0; i < fns.length; i++) {
    const slot = fns[i]
    if (Array.isArray(slot)) {
      resolveScopedSlots(slot, res)
    } else {
      res[slot.key] = slot.fn
    }
  }
  return res
}
