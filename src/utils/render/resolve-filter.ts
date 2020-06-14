import { identity, resolveAsset } from '@utils/index'

/**
 * Runtime helper for resolving filters
 */
// 返回options对应的 filters[id]
export function resolveFilter (this:any,id: string): Function {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}
