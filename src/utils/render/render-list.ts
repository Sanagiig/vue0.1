import { isObject, isDef, hasSymbol } from '@utils/index'

/**
 * Runtime helper for rendering v-for lists.
 */
// 对 val 类型进行判断，然后进行迭代将其每次迭代的值作为参数 => render 
// ret._isVList = true
export function renderList (
  val: any,
  render: (
    val: any,
    keyOrIndex: string | number,
    index?: number
  ) => VNodeInstance
): Array<VNodeInstance> {
  let ret: Array<VNodeInstance> = [];
  let i, l, keys, key;

  // arr || string 渲染
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length)
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i)
    }

  // number
  } else if (typeof val === 'number') {
    ret = new Array(val)
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i)
    }
  } else if (isObject(val)) {
    if (hasSymbol && val[Symbol.iterator]) {
      ret = []
      const iterator: Iterator<any> = val[Symbol.iterator]()
      let result = iterator.next()
      while (!result.done) {
        ret.push(render(result.value, ret.length))
        result = iterator.next()
      }
    } else {
      keys = Object.keys(val)
      ret = new Array(keys.length)
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i]
        ret[i] = render(val[key], key, i)
      }
    }
  }
  if (!isDef(ret)) {
    ret = []
  }
  
  (<any>ret)._isVList = true
  return ret
}
