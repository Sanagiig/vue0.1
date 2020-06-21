import { extend, warn, isObject } from '@utils/index'

/**
 * Runtime helper for rendering <slot>
 */
// 渲染内部或外部插槽
// 通过 $scopedSlots[name] 获取父组件传入的具名插槽
// 或 通过 this.$slots[name] 获取本组件的插槽 或 fallback
// 如果 props.slot (parse 中将 slot => attrs.slot) 则返回创建的 template(nodes)
export function renderSlot (
  this:any,
  name: string,
  fallback: Array<VNodeInstance>,
  props: any,
  bindObject: any
): Array<VNodeInstance> {
  const scopedSlotFn = this.$scopedSlots[name]
  let nodes
  if (scopedSlotFn) { // scoped slot
    props = props || {}
    if (bindObject) {
      if (process.env.NODE_ENV !== 'production' && !isObject(bindObject)) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        )
      }
      props = extend(extend({}, bindObject), props)
    }
    nodes = scopedSlotFn(props) || fallback
  } else {
    nodes = this.$slots[name] || fallback
  }

  // 如果是 <slot slot="target"></slot> 节点，则通过 template 创建
  // mark 传入 插槽的插槽 ？？
  const target = props && props.slot
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}
