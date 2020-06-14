import he from './entity-decoder';
import { parseHTML } from './html-parser';
import { parseText } from './text-parser';
import { parseFilters } from './filter-parser';
import { baseWarn, pluckModuleFunction } from '../helpers';
import { isReservedTag } from '../../../utils/assert';
import {
  extend,
  cached,
  no,
  camelize,
  hyphenate,
  hasOwn,
  isIE, 
  isEdge,
  isTextTag,
  isForbiddenTag,
  addAttr,
  addProp,
  addDirective,
  isServerRendering,
  getAndRemoveAttr,
  getBindingAttr,
  getRawBindingAttr,
  addHandler
} from '@utils/index';
import { genAssignmentCode } from '@core/compiler/directives/model';

export const onRE = /^@|^v-on:/;
export const dirRE = /^v-|^@|^:|^\./;
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
const stripParensRE = /^\(|\)$/g;
const argRE = /:(.*)$/;
export const bindRE = /^:|^\.|^v-bind:/;
const propBindRE = /^\./;
const modifierRE = /\.[^.]+/g;
const lineBreakRE = /[\r\n]/;
const whitespaceRE = /\s+/g;
const decodeHTMLCached = cached(he.decode);

// configurable state
export let warn: any
let delimiters:any
let transforms:any
let preTransforms:any
let postTransforms:any
let platformIsPreTag:any
let platformMustUseProp:any
let platformGetTagNamespace:any
let maybeComponent: any

export function createASTElement (
  tag: string,
  attrs: Array<ASTAttr>,
  parent: ASTElement | void
): ASTElement {
  return {
    type: 1,
    tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent,
    children: []
  }
}

/**
 * Convert HTML string to AST.
 */
export function parse ( 
  template: string,
  options: CompilerOptions
): ASTElement | void {
  warn = options.warn || baseWarn;
  platformIsPreTag = options.isPreTag || no;
  platformMustUseProp = options.mustUseProp || no;
  platformGetTagNamespace = options.getTagNamespace || no;
  const isReservedTag = options.isReservedTag || no;
  maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag);

  transforms = pluckModuleFunction(options.modules, 'transformNode');
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

  delimiters = options.delimiters;

  const stack: any[] = [];
  const preserveWhitespace = options.preserveWhitespace !== false;
  const whitespaceOption = options.whitespace;
  let root:any;
  let currentParent:any;
  let inVPre = false;
  let inPre = false;
  let warned = false; 

  function warnOnce (msg:string, range:any) {
    if (!warned) {
      warned = true
      warn(msg, range)
    }
  }

  function closeElement(element: ASTElement) {
    if (!inVPre && !element.processed) {
      element = processElement(element, options)
    }
    // tree management
    if (!stack.length && element !== root) {
      // allow root elements with v-if, v-else-if and v-else
      // 根节点存在 if 的情况
      if (root.if && (element.elseif || element.else)) {
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(element)
        }
        addIfCondition(root, {
          exp: <string>element.elseif,
          block: element
        })
      } else if (process.env.NODE_ENV !== 'production') {
        warnOnce(
          `Component template should contain exactly one root element. ` +
          `If you are using v-if on multiple elements, ` +
          `use v-else-if to chain them instead.`,
          { start: element.start }
        )
      }
    }


    if (currentParent && !element.forbidden) {
      // elseif || else 合并至 ifConditions
      if (element.elseif || element.else) {
        processIfConditions(element, currentParent)

        // 如果当前存在 slotScope , 则将当前ast节点加入至 currentParent。scopedSlots[name]
      } else if (element.slotScope) { // scoped slot
        const name = element.slotTarget || '"default"'
        ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element

        // ast 加入至 父节点children
      } else {
        currentParent.children.push(element)
        element.parent = currentParent
      }
    }
    // check pre state
    if (element.pre) {
      inVPre = false
    }
    if (platformIsPreTag(element.tag)) {
      inPre = false
    }
    // apply post-transforms
    // 默认无处理
    for (let i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options)
    }
  }

  // 告警 slot && template && v-for
  function checkRootConstraints(el: any) { 
    if (el.tag === 'slot' || el.tag === 'template') {
      warnOnce(
        `Cannot use <${el.tag}> as component root element because it may ` +
        'contain multiple nodes.',
        { start: el.start }
      )
    }
    if (hasOwn(el.attrsMap, 'v-for')) {
      warnOnce(
        'Cannot use v-for on stateful component root element because ' +
        'it renders multiple elements.',
        el.rawAttrsMap['v-for']
      )
    }
  }

  parseHTML(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,

    // ns解析，属性解析成 pre, attrs，[ for, alias, iterator1,iterator2 ]
    // [ ifConditions , elseif = exp, else = boolean] , once 
    // 如果非一元标签则加入至 stack ，确定 currentParent
    // 一元节点则调用 closeElement
    start(tag: any, attrs: any, unary: any, start: any) {
      // check namespace.
      // inherit parent ns if there is one
      const ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

      // handle IE svg bug
      /* istanbul ignore if */
      // 为ie 清除 attrName NS..
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs)
      }

      let element: ASTElement = createASTElement(tag, attrs, currentParent)
      if (ns) {
        element.ns = ns
      }

      // rawAttrsMap 为 原始 attrsMap
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        element.start = start
        element.rawAttrsMap = element.attrsList.reduce((cumulated:any, attr:any) => {
          cumulated[attr.name] = attr
          return cumulated
        }, {})
      }
      
      // 判断标签是否禁止
      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forbidden = true
        process.env.NODE_ENV !== 'production' && warn(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          `<${tag}>` + ', as they will not be parsed.',
          { start: element.start }
        )
      }

      // apply pre-transforms
      // 默认进行modules.model.preTransformNode
      for (let i = 0; i < preTransforms.length; i++) {
        element = preTransforms[i](element, options) || element
      }

      if (!inVPre) {
        processPre(element)
        if (element.pre) {
          inVPre = true
        }
      }
      if (platformIsPreTag(element.tag)) {
        inPre = true
      }
      if (inVPre) {
        processRawAttrs(element)
      } else if (!element.processed) {
        // structural directives
        processFor(element)
        processIf(element)
        processOnce(element)
      }

      if (!root) {
        root = element
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(root)
        }
      }

      if (!unary) {
        currentParent = element
        stack.push(element)
      } else {
        closeElement(element)
      }
    },

    // 空白节点清除，currentParent 修改
    // closeElement
    end(tag: any, start: any, end: any) {
      const element = stack[stack.length - 1]
      // 非绑定节点，清除 end.children[last] 的空白节点
      if (!inPre) {
        // remove trailing whitespace node
        const lastNode = element.children[element.children.length - 1]
        if (lastNode && lastNode.type === 3 && lastNode.text === ' ') {
          element.children.pop()
        }
      }
      // pop stack
      stack.length -= 1
      currentParent = stack[stack.length - 1]
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        element.end = end
      }
      closeElement(element)
    },
    // 校验文本合法性，核对options 判断是否需要特殊处理空白字符
    // 生成 textNode || expressNode
    chars(text: string, start: number, end: number) {
      // 不允许纯 text
      if (!currentParent) {
        if (process.env.NODE_ENV !== 'production') {
          if (text === template) {
            warnOnce(
              'Component template requires a root element, rather than just text.',
              { start }
            )
          } else if ((text = text.trim())) {
            warnOnce(
              `text "${text}" outside root element will be ignored.`,
              { start }
            )
          }
        }
        return
      }

      // IE textarea placeholder bug
      /* istanbul ignore if */
      // 兼容IE textarea 中的 text 转为 placeholder 
      if (isIE &&
        currentParent.tag === 'textarea' &&
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }

      const children = currentParent.children
      // inpre || text 存在字符
      if (inPre || text.trim()) {
        text = isTextTag(currentParent) ? text : decodeHTMLCached(text)
      } else if (!children.length) {
        // 不为无子节点的元素添加空白文本节点
        // remove the whitespace-only node right after an opening tag
        text = ''
      } else if (whitespaceOption) {
        // 去除换行符 || 转成单空格
        if (whitespaceOption === 'condense') {
          // in condense mode, remove the whitespace node if it contains
          // line break, otherwise condense to a single space
          text = lineBreakRE.test(text) ? '' : ' '
        } else {
          text = ' '
        }
      } else {
        // 空字符转空格
        text = preserveWhitespace ? ' ' : ''
      }
      if (text) {
        if (whitespaceOption === 'condense') {
          // condense consecutive whitespaces into single space
          text = text.replace(whitespaceRE, ' ')
        }
        let res
        let child: ASTNode | void
        // 处理 express
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          child = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text
          }
          // 非空字符 || 无兄弟节点 || 上个节点不是空格 则作为文本节点
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          child = {
            type: 3,
            text
          }
        }
        if (child) {
          if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
            child.start = start
            child.end = end
          }
          children.push(child)
        }
      }
    },
    // comment 作为 特殊的 textNode
    // 将该 ast 添加至 currentParent.children
    comment(text: string, start: number, end: number) {
      const child: ASTText = {
        type: 3,
        text,
        isComment: true
      }
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        child.start = start
        child.end = end
      }
      currentParent.children.push(child)
    }
  })
  return root;
}

function checkInFor (el: ASTElement): boolean {
  let parent:any = el
  while (parent) {
    if (parent.for !== undefined) {
      return true
    }
    parent = parent.parent
  }
  return false
}

// v-pre
function processPre (el:any) {
  if (getAndRemoveAttr(el, 'v-pre') != null) {
    el.pre = true
  }
}

// 将attrList => ast.attrs
function processRawAttrs (el:any) {
  const list = el.attrsList
  const len = list.length
  if (len) {
    const attrs: Array<ASTAttr> = el.attrs = new Array(len)
    for (let i = 0; i < len; i++) {
      attrs[i] = {
        name: list[i].name,
        value: JSON.stringify(list[i].value)
      }
      if (list[i].start != null) {
        attrs[i].start = list[i].start
        attrs[i].end = list[i].end
      }
    }
  } else if (!el.pre) {
    // non root node in pre blocks with no attributes
    el.plain = true
  }
}

export function processElement (
  element: ASTElement,
  options: CompilerOptions
) {
  // key
  processKey(element)

  // determine whether this is a plain element after
  // removing structural attributes
  // 判断是否属于无属性节点
  element.plain = (
    !element.key &&
    !element.scopedSlots &&
    !element.attrsList.length
  )
  
  processRef(element)
  processSlot(element)
  processComponent(element)
  // 默认处理 static && dynamic => tyle && class
  // staticStyle{key:val} && styleBinding
  // staticClass && classBinding
  for (let i = 0; i < transforms.length; i++) {
    element = transforms[i](element, options) || element
  }
  processAttrs(element)
  return element
}

// 取出绑定:key， 并对其在 template && transition in v-for 进行校验
// 修改 ast.key
function processKey (el:any) {
  const exp = getBindingAttr(el, 'key')
  if (exp) {
    if (process.env.NODE_ENV !== 'production') {
      if (el.tag === 'template') {
        warn(
          `<template> cannot be keyed. Place the key on real elements instead.`,
          getRawBindingAttr(el, 'key')
        )
      }
      if (el.for) {
        const iterator = el.iterator2 || el.iterator1
        const parent = el.parent
        if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
          warn(
            `Do not use v-for index as key on <transition-group> children, ` +
            `this is the same as not using keys.`,
            getRawBindingAttr(el, 'key'),
            true /* tip */
          )
        }
      }
    }
    el.key = exp
  }
}

// 取出 :ref && 判断是否属于 v-for
function processRef (el:any) {
  const ref = getBindingAttr(el, 'ref')
  if (ref) {
    el.ref = ref
    el.refInFor = checkInFor(el)
  }
}

// 为所有子节点按slotTarget进行分组，
// 并将含有 $slot 的节点的分组加入scopedSlots 中
// 剔除含有 $slot 的子节点
function processScopedSlots (el:any) {
  // 1. group children by slot target
  // 按照插槽名称进行分组
  const groups: any = {}
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i]
    const target = child.slotTarget || '"default"'
    if (!groups[target]) {
      groups[target] = []
    }
    groups[target].push(child)
  }


  // 2. for each slot group, check if the group contains $slot
  // 当分组中有一个节点引用了 $slot 则将该分组的所有元素添加至一个新的
  // template 的 children 中 并为该template 新增 slotScope = $slot
  // 最后将已加入 template 的节点 从 el.children 中清除
  for (const name in groups) {
    const group = groups[name]
    // 当同一个 slotTarget 中某个ele 存在 $slot
    if (group.some(nodeHas$Slot)) {
      // 3. if a group contains $slot, all nodes in that group gets assigned
      // as a scoped slot to el and removed from children
      el.plain = false
      const slots = el.scopedSlots || (el.scopedSlots = {})
      const slotContainer = slots[name] = createASTElement('template', [], el)
      slotContainer.children = group
      slotContainer.slotScope = '$slot'
      // 过滤存在 $slot 的同组节点
      el.children = (<any[]>el.children).filter(c => group.indexOf(c) === -1)
    }
  }
}

// 解析 <slot>  <xx slot-scope="">
function processSlot(el: any) {
  // 处理 slot 节点，并判断是否属于具名插槽
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name')
    if (process.env.NODE_ENV !== 'production' && el.key) {
      warn(
        `\`key\` does not work on <slot> because slots are abstract outlets ` +
        `and can possibly expand into multiple elements. ` +
        `Use the key on a wrapping element instead.`,
        getRawBindingAttr(el, 'key')
      )
    }

  } else {
    // 确定template 中的 slotScope
    let slotScope
    if (el.tag === 'template') {
      slotScope = getAndRemoveAttr(el, 'scope')
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && slotScope) {
        warn(
          `the "scope" attribute for scoped slots have been deprecated and ` +
          `replaced by "slot-scope" since 2.5. The new "slot-scope" attribute ` +
          `can also be used on plain elements in addition to <template> to ` +
          `denote scoped slots.`,
          el.rawAttrsMap['scope'],
          true
        )
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope')

      // 确定slotScope ，如果其出现在 v-for 或 
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && el.attrsMap['v-for']) {
        warn(
          `Ambiguous combined usage of slot-scope and v-for on <${el.tag}> ` +
          `(v-for takes higher priority). Use a wrapper <template> for the ` +
          `scoped slot to make it clearer.`,
          el.rawAttrsMap['slot-scope'],
          true
        )
      }
      el.slotScope = slotScope
      if (process.env.NODE_ENV !== 'production' && nodeHas$Slot(el)) {
        warn('Unepxected mixed usage of `slot-scope` and `$slot`.', el)
      }
    } else {
      // 2.6 $slot support
      // Context: https://github.com/vuejs/vue/issues/9180
      // Ideally, all slots should be compiled as functions (this is what we
      // are doing in 3.x), but for 2.x e want to preserve complete backwards
      // compatibility, and maintain the exact same compilation output for any
      // code that does not use the new syntax.

      // recursively check component children for presence of `$slot` in all
      // expressions until running into a nested child component.
      // $slot 判断
      if (maybeComponent(el) && childrenHas$Slot(el)) {
        processScopedSlots(el)
      }
    }

    // 确定slotTarget，将其加入至ast.attrs.slot = slotTarget
    const slotTarget = getBindingAttr(el, 'slot')
    if (slotTarget) {
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== 'template' && !el.slotScope && !nodeHas$Slot(el)) {
        // 添加attr 插槽属性
        addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'))
      }
    }
  }
}

// component=componentName , inlineTemplate
function processComponent (el:any) {
  let binding
  if ((binding = getBindingAttr(el, 'is'))) {
    el.component = binding
  }
  if (getAndRemoveAttr(el, 'inline-template') != null) {
    el.inlineTemplate = true
  }
}

function parseModifiers (name: string): Object | void {
  const match = name.match(modifierRE)
  if (match) {
    const ret:any = {}
    match.forEach(m => { ret[m.slice(1)] = true })
    return ret
  }
}

/**
 * 1. 处理dir 属性，并加上hasBindings标记
 * 2. 处理modifiers,将其取出，并还原原本属性名称
 * 3. 所有v-bind 的值将进行过滤器解析
 * 4. 根据修饰符对属性进行操作
 * 5. sync 关联至事件
 */
function processAttrs (el:any) {
  const list = el.attrsList
  let i, l, name, rawName, value, modifiers:any, isProp, syncGen
  for (i = 0, l = list.length; i < l; i++) {
    name = rawName = list[i].name
    value = list[i].value
    // 判断是否是指令
    if (dirRE.test(name)) {
      // mark element as dynamic
      el.hasBindings = true
      // modifiers = {modifier:true}
      modifiers = parseModifiers(name.replace(dirRE, ''))
      // support .foo shorthand syntax for the .prop modifier
      // 去除修饰符，还原原本属性名称
      if (propBindRE.test(name)) {
        (modifiers || (modifiers = {})).prop = true
      
        name = `.` + name.slice(1).replace(modifierRE, '')
      } else if (modifiers) {
        name = name.replace(modifierRE, '')
      }

      // v-bind => isProp = false [def]
      // 处理 v-bind:val filter
      // 处理 sync 将其属性关联至事件
      // 确定binding属性归属
      if (bindRE.test(name)) { // v-bind
        name = name.replace(bindRE, '')
        value = parseFilters(value)
        isProp = false
        if (  
          process.env.NODE_ENV !== 'production' &&
          value.trim().length === 0
        ) {
          warn(
            `The value for a v-bind expression cannot be empty. Found in "v-bind:${name}"`
          )
        }
        // 处理修饰符
        if (modifiers) {
          if (modifiers.prop) {
            isProp = true
            name = camelize(name)
            if (name === 'innerHtml') name = 'innerHTML'
          }
          if (modifiers.camel) {
            name = camelize(name)
          }
          if (modifiers.sync) { 
            // function($event){`value = $event`}
            syncGen = genAssignmentCode(value, `$event`)
            // 将 `update:name` 事件及处理方法 syncGen 关联至 ast.events
            addHandler(
              el,
              `update:${camelize(name)}`,
              syncGen,
              null,
              false,
              warn,
              list[i]
            )
            if (hyphenate(name) !== camelize(name)) {
              addHandler(
                el,
                `update:${hyphenate(name)}`,
                syncGen,
                null,
                false,
                warn,
                list[i]
              )
            }
          }
        }
        // 确定 attrsList[i] 归属
        if (isProp || (
          !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
        )) {
          // ast.props
          addProp(el, name, value, list[i])
        } else {
          // ast.attrs
          addAttr(el, name, value, list[i])
        }
      } else if (onRE.test(name)) { // v-on
        name = name.replace(onRE, '')
        addHandler(el, name, value, modifiers, false, warn, list[i])
      } else { // normal directives
        // 处理指令 v-x:val
        // 将 arg 作为 name
        // ast.directives = [{name,rawName,value,arg,modifiers,range}]
        name = name.replace(dirRE, '')
        // parse arg
        const argMatch = name.match(argRE)
        const arg = argMatch && argMatch[1]
        if (arg) {
          name = name.slice(0, -(arg.length + 1))
        }
        addDirective(el, name, rawName, value, arg, modifiers, list[i])
        // v-model 合法校验
        if (process.env.NODE_ENV !== 'production' && name === 'model') {
          checkForAliasModel(el, value)
        }
      }
    } else {
      // literal attribute
      if (process.env.NODE_ENV !== 'production') {
        const res = parseText(value, delimiters)
        if (res) {
          warn(
            `${name}="${value}": ` +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div id="{{ val }}">, use <div :id="val">.',
            list[i]
          )
        }
      }
      // 将非绑定属性加至 attrs
      addAttr(el, name, JSON.stringify(value), list[i])
      // #6887 firefox doesn't update muted state if set via attribute
      // even immediately after element creation
      if (!el.component &&
          name === 'muted' &&
          platformMustUseProp(el.tag, el.attrsMap.type, name)) {
        addProp(el, name, 'true', list[i])
      }
    }
  }
}

// 取出v-for 并生成 for 属性
// 将解析后的 for, alias,iterator1,iterator2 添加到 ast
export function processFor (el: ASTElement) {
  let exp
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    const res = parseFor(exp)
    if (res) {
      extend(el, res)
    } else if (process.env.NODE_ENV !== 'production') {
      warn(
        `Invalid v-for expression: ${exp}`,
        el.rawAttrsMap['v-for']
      )
    }
  }
}

type ForParseResult = {
  for: string;
  alias: string;
  iterator1?: string;
  iterator2?: string;
};
// for = list , alias = item , iterator1 = index , iterator2 = key
export function parseFor (exp: string): ForParseResult | void {
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return
  const res:any = {}
  // in 后
  res.for = inMatch[2].trim()
  // in 前部分,去除括号
  const alias = inMatch[1].trim().replace(stripParensRE, '')
  // 迭代器匹配 item, 后
  const iteratorMatch = alias.match(forIteratorRE)
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim()
    res.iterator1 = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim()
    }
  } else {
    res.alias = alias
  }
  return res
}

// 将v-if 转成 exp && block 添加至 ast.ifConfitions
// ast.elseif , ast.else
function processIf (el:any) {
  const exp = getAndRemoveAttr(el, 'v-if')
  if (exp) {
    el.if = exp
    addIfCondition(el, {
      exp: exp,
      block: el
    })
  } else {
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true
    }
    const elseif = getAndRemoveAttr(el, 'v-else-if')
    if (elseif) {
      el.elseif = elseif
    }
  }
}

function processIfConditions (el:any, parent:any) {
  const prev = findPrevElement(parent.children)
  if (prev && prev.if) {
    addIfCondition(prev, {
      exp: el.elseif,
      block: el
    })
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `v-${el.elseif ? ('else-if="' + el.elseif + '"') : 'else'} ` +
      `used on element <${el.tag}> without corresponding v-if.`,
      el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
    )
  }
}

// 查找父节点的最后一个节点是否有v-if
function findPrevElement (children: Array<any>): ASTElement | void {
  let i = children.length
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      if (process.env.NODE_ENV !== 'production' && children[i].text !== ' ') {
        warn(
          `text "${children[i].text.trim()}" between v-if and v-else(-if) ` +
          `will be ignored.`,
          children[i]
        )
      }
      children.pop()
    }
  }
}

// ast.ifConditions
export function addIfCondition (el: ASTElement, condition: ASTIfCondition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}

// ast.once
function processOnce (el:any) {
  const once = getAndRemoveAttr(el, 'v-once')
  if (once != null) {
    el.once = true
  }
}

const ieNSBug = /^xmlns:NS\d+/;
const ieNSPrefix = /^NS\d+:/;

/* istanbul ignore next */
// 修改 ie中 ns=svg 属性
function guardIESVGBug (attrs:any) {
  const res = []
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i]
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '')
      res.push(attr)
    }
  }
  return res
}

// 将 attrList => {attr.name:attr}
function makeAttrsMap (attrs: Array<any>): Object {
  const map:any = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    if (
      process.env.NODE_ENV !== 'production' &&
      map[attrs[i].name] && !isIE && !isEdge
    ) {
      warn('duplicate attribute: ' + attrs[i].name, attrs[i])
    }
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

function childrenHas$Slot (el:any): boolean {
  return el.children ? el.children.some(nodeHas$Slot) : false
}

const $slotRE = /(^|[^\w_$])\$slot($|[^\w_$])/
// 校验ast以及其子节点 动态值是否有关联至 $slot
function nodeHas$Slot (node:any): boolean {
  // caching
  // 通过 ast.has$Slot 判断
  if (hasOwn(node, 'has$Slot')) {
    return node.has$Slot
  }

  // 如果其是元素节点，则遍历其attrsMap,校验其:name 属性值是否有绑定到$slot
  if (node.type === 1) { // element
    for (const key in node.attrsMap) {
      if (dirRE.test(key) && $slotRE.test(node.attrsMap[key])) {
        return (node.has$Slot = true)
      }
    }
    return (node.has$Slot = childrenHas$Slot(node))

    // 如果是expression 节点则判断其表达式内是否存在 $slot 引用
  } else if (node.type === 2) { // expression
    // TODO more robust logic for checking $slot usage
    return (node.has$Slot = $slotRE.test(node.expression))
  }
  return false
}

// v-model 不允许绑定 alias [正常人都不会这样做]
function checkForAliasModel (el:any, value:any) {
  let _el = el
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn(
        `<${el.tag} v-model="${value}">: ` +
        `You are binding v-model directly to a v-for iteration alias. ` +
        `This will not be able to modify the v-for source array because ` +
        `writing to the alias is like modifying a function local variable. ` +
        `Consider using an array of objects and use v-model on an object property instead.`,
        el.rawAttrsMap['v-model']
      )
    }
    _el = _el.parent
  }
}