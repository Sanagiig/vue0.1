/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 */

//  删除 children.data.attrs.slot
//  处理默认、具名插槽将插槽组成对象返回
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
    // 当前组件拥有具名插槽并且父组件也应用了该插槽
    // 将该节点加入其 $slots[name]
    // 默认插槽则加入slots.default
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
    } else {
      (slots.default || (slots.default = [])).push(child)
    }
  }
  // ignore slots that contains only whitespace
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
