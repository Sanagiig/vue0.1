import { cached } from './shared/index';
import { extend } from './mixin';
import { toObject } from './convert/index';

// 将 style 转成对象 color:red => {color:red}
export const parseStyleText = cached(function (cssText:any) {
  const res:any = {}
  const listDelimiter = /;(?![^(]*\))/g
  const propertyDelimiter = /:(.+)/
  // 根据 ; 进行分割，忽略 [^(]*\)
  cssText.split(listDelimiter).forEach(function (item:any) {
    if (item) {
      const tmp = item.split(propertyDelimiter)
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim())
    }
  })
  return res
})

// merge static and dynamic style data on the same vnode
function normalizeStyleData (data: VNodeData): any {
  const style:any = normalizeStyleBinding(data.style)
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle
    ? extend(data.staticStyle, style)
    : style
}

// normalize possible array / string values into Object
// 将数组 || 字符串 style 转成对象
export function normalizeStyleBinding (bindingStyle: any): any | void {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
// 获取与 父&&子 节点 styleData 合并过后的 styleData
export function getStyle (vnode: VNodeWithData, checkChild: boolean): Object {
  const res = {}
  let styleData

  // 将子节点 styleData 取出 并覆盖res 直到最后一个 instance
  // 由于子节点是先patch ， 所以 styleData 是以父节点覆盖子节点 ?
  if (checkChild) {
    let childNode:any = vnode
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode
      if (
        childNode && childNode.data &&
        (styleData = normalizeStyleData(childNode.data))
      ) {
        extend(res, styleData)
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData)
  }

  // 父节点覆盖子节点
  // 是否与上面操作重复了 ?
  let parentNode:any = vnode
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData)
    }
  }
  return res
}
