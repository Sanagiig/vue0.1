import { warn, extend, isPlainObject } from '@utils/index'

/**
 * 通过v-on 传入的value 对 data.on 默认的事件进行扩展(extend({}))
 */
export function bindObjectListeners (this:any,data: any, value: any): VNodeData {
  if (value) {
    if (!isPlainObject(value)) {
      process.env.NODE_ENV !== 'production' && warn(
        'v-on without argument expects an Object value',
        this
      )
    } else {
      // mark 为什么要 extend ?
      const on:any = data.on = data.on ? extend({}, data.on) : {}
      for (const key in value) {
        const existing = on[key]
        const ours = value[key]
        on[key] = existing ? [].concat(existing, ours) : ours
      }
    }
  }
  return data
}
