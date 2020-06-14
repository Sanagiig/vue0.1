import { parseFilters,emptyObject } from '@utils/index';
type Range = { start?: number, end?: number };

export const unicodeLetters = 'a-zA-Z'


/**
 * Parse simple path.
 */
const bailRE = new RegExp(`[^${unicodeLetters}.$_\\d]`)
export function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj:any) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}

function rangeSetItem (
  item: any,
  range?: { start?: number, end?: number }
) {
  if (range) {
    if (range.start != null) {
      item.start = range.start
    }
    if (range.end != null) {
      item.end = range.end
    }
  }
  return item
}

// add a raw attr (use this in preTransforms)
// 为AST节点的 attrsList && attrsMap 添加属性
export function addRawAttr (el: ASTElement, name: string, value: any, range?: Range) {
  el.attrsMap[name] = value
  el.attrsList.push(rangeSetItem({ name, value }, range))
}

// 为 AST.ATTRS 添加属性
export function addAttr (el: ASTElement, name: string, value: any, range?: Range) {
  (el.attrs || (el.attrs = [])).push(rangeSetItem({ name, value }, range))
  el.plain = false
}

export function addProp (el: ASTElement, name: string, value: string, range?: Range) {
  (el.props || (el.props = [])).push(rangeSetItem({ name, value }, range))
  el.plain = false
}

export function addDirective (
  el: ASTElement,
  name: string,
  rawName: string,
  value: string,
  arg: string | null,
  modifiers: ASTModifiers | null,
  range?: Range
) {
  (el.directives || (el.directives = [])).push(rangeSetItem({ name, rawName, value, arg, modifiers }, range))
  el.plain = false
}

export function addHandler (
  el: ASTElement,
  name: string,
  value: string,
  modifiers?: ASTModifiers | null,
  important?: boolean,
  warn?: Function | null,
  range?: Range
) {
  modifiers = modifiers || emptyObject
  // warn prevent and passive modifier
  /* istanbul ignore if */
  // 不允许 prevent && passive 同时修饰
  if (
    process.env.NODE_ENV !== 'production' && warn &&
    modifiers.prevent && modifiers.passive
  ) {
    warn(
      'passive and prevent can\'t be used together. ' +
      'Passive handler can\'t prevent default event.',
      range
    )
  }

  // normalize click.right and click.middle since they don't actually fire
  // this is technically browser-specific, but at least for now browsers are
  // the only target envs that have right/middle clicks.
  // click.right => contextmenu
  // click.middle => mouseup
  if (name === 'click') {
    if (modifiers.right) {
      name = 'contextmenu'
      delete modifiers.right
    } else if (modifiers.middle) {
      name = 'mouseup'
    }
  }

  // check capture modifier
  if (modifiers.capture) {
    delete modifiers.capture
    name = '!' + name // mark the event as captured
  }
  if (modifiers.once) {
    delete modifiers.once
    name = '~' + name // mark the event as once
  }
  /* istanbul ignore if */
  if (modifiers.passive) {
    delete modifiers.passive
    name = '&' + name // mark the event as passive
  }

  let events
  // .native => el.nativeEvents
  // .normal => el.events
  if (modifiers.native) {
    delete modifiers.native
    events = el.nativeEvents || (el.nativeEvents = {})
  } else {
    events = el.events || (el.events = {})
  }

  // handler + range + modifiers
  const newHandler: any = rangeSetItem({ value: value.trim() }, range)
  if (modifiers !== emptyObject) {
    newHandler.modifiers = modifiers
  }

  const handlers = events[name]
  /* istanbul ignore if */
  if (Array.isArray(handlers)) {
    important ? handlers.unshift(newHandler) : handlers.push(newHandler)
  } else if (handlers) {
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler]
  } else {
    events[name] = newHandler
  }

  el.plain = false
}

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
// 获取 attrList[x] 然后从list删除
export function getAndRemoveAttr (
  el: ASTElement,
  name: string,
  removeFromMap?: boolean
): string | void{
  let val
  if ((val = el.attrsMap[name]) != null) {
    const list = el.attrsList
    for (let i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1)
        break
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name]
  }
  return val
}

// 获取 v-bind:name ， 并对val 进行过滤器解析
export function getBindingAttr (
  el: ASTElement,
  name: string,
  getStatic?: boolean
): string | void {
  const dynamicValue =
    getAndRemoveAttr(el, ':' + name) ||
    getAndRemoveAttr(el, 'v-bind:' + name)
  if (dynamicValue != null) {
    return parseFilters(dynamicValue)
  } else if (getStatic !== false) {
    const staticValue = getAndRemoveAttr(el, name)
    if (staticValue != null) {
      return JSON.stringify(staticValue)
    }
  }
}

export function getRawBindingAttr (
  el: ASTElement,
  name: string
) {
  return el.rawAttrsMap[':' + name] ||
    el.rawAttrsMap['v-bind:' + name] ||
    el.rawAttrsMap[name]
}
