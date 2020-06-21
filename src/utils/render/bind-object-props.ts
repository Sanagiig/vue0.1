import config from '@config/index';
import {
  warn,
  isObject,
  toObject,
  isReservedAttribute,
  camelize
} from '@utils/index'
/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
/**
 * v-bind value 合法校验
 * 忽略 class style key,ref,slot,slot-scope,is 的 v-bind 传入
 * 其余值都会更新到 data[domProps || attrs]
 * 对 .sync 的key 进行 update:camelizedKey 事件监听，通过$emit 改变v-bind val
 */
export function bindObjectProps (
  this:any,
  data: any,
  tag: string,
  value: any,
  asProp: boolean,
  isSync?: boolean
): VNodeData {
  if (value) {
    // 使用v-bind="xx" 只能是 obj
    if (!isObject(value)) {
      process.env.NODE_ENV !== 'production' && warn(
        'v-bind without argument expects an Object or Array value',
        this
      )
    } else {
      if (Array.isArray(value)) {
        value = toObject(value)
      }
      let hash
      for (const key in value) {
        // class style || 保留属性 => 直接取data作为hash
        // else => 根据 tag && type && key || asProp 确定 取domProps || attrs
        if (
          key === 'class' ||
          key === 'style' ||
          isReservedAttribute(key)
        ) {
          hash = data
        } else {
          const type = data.attrs && data.attrs.type
          hash = asProp || config.mustUseProp(tag, type, key)
            ? data.domProps || (data.domProps = {})
            : data.attrs || (data.attrs = {})
        }

        // 如果 key || camelizedKey 不存在于 hash 则取 v-bind value[key]
        // 对 .sync 属性 => 在其 on 中新增 update:camelizedKey 事件
        // 用于修改 value[key]
        const camelizedKey = camelize(key)
        if (!(key in hash) && !(camelizedKey in hash)) {
          hash[key] = value[key]

          if (isSync) {
            const on = data.on || (data.on = {})
            on[`update:${camelizedKey}`] = function ($event:any) {
              value[key] = $event
            }
          }
        }
      }
    }
  }
  return data
}