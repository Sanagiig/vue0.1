// 箭头函数 || function
const fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/

// (参数*?);*$
const fnInvokeRE = /\([^)]*?\);*$/

// 路径匹配
// 首字符正常变量名*((\.字符) || ['字符'] || ["字符"] || [变量])
const simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

// KeyboardEvent.keyCode aliases
const keyCodes: { [key: string]: number | Array<number> } = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
}

// KeyboardEvent.key aliases
const keyNames: { [key: string]: string | Array<string> } = {
  // #7880: IE11 and Edge use `Esc` for Escape key name.
  esc: ['Esc', 'Escape'],
  tab: 'Tab',
  enter: 'Enter',
  // #9112: IE11 uses `Spacebar` for Space key name.
  space: [' ', 'Spacebar'],
  // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
  up: ['Up', 'ArrowUp'],
  left: ['Left', 'ArrowLeft'],
  right: ['Right', 'ArrowRight'],
  down: ['Down', 'ArrowDown'],
  // #9112: IE11 uses `Del` for Delete key name.
  'delete': ['Backspace', 'Delete', 'Del']
}

// #4868: modifiers that prevent the execution of the listener
// need to explicitly return null so that we can determine whether to remove
// the listener for .once
const genGuard = (condition:string) => `if(${condition})return null;`

// 修饰符对应的 handler 代码(部分)
const modifierCode: { [key: string]: string } = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard(`$event.target !== $event.currentTarget`),
  ctrl: genGuard(`!$event.ctrlKey`),
  shift: genGuard(`!$event.shiftKey`),
  alt: genGuard(`!$event.altKey`),
  meta: genGuard(`!$event.metaKey`),
  left: genGuard(`'button' in $event && $event.button !== 0`),
  middle: genGuard(`'button' in $event && $event.button !== 1`),
  right: genGuard(`'button' in $event && $event.button !== 2`)
}

/**
 * 生成 data 中的 on || nativeOn
 */
export function genHandlers (
  events: ASTElementHandlers,
  isNative: boolean
): string {
  let res = isNative ? 'nativeOn:{' : 'on:{'
  for (const name in events) {
    res += `"${name}":${genHandler(name, events[name])},`
  }
  return res.slice(0, -1) + '}'
}

// Generate handler code with binding params on Weex
/* istanbul ignore next */
function genWeexHandler (params: Array<any>, handlerCode: string) {
  let innerHandlerCode = handlerCode
  const exps = params.filter(exp => simplePathRE.test(exp) && exp !== '$event')
  const bindings = exps.map(exp => ({ '@binding': exp }))
  const args = exps.map((exp, i) => {
    const key = `$_${i + 1}`
    innerHandlerCode = innerHandlerCode.replace(exp, key)
    return key
  })
  args.push('$event')
  return '{\n' +
    `handler:function(${args.join(',')}){${innerHandlerCode}},\n` +
    `params:${JSON.stringify(bindings)}\n` +
    '}'
}

/**
 * 生成事件处理器 code
 * 如果无修饰符则返回 value 或套 fn($event){handler.value}(fnInvocation)
 * 有修饰符则需要符合相应修饰才能成功执行handler, 除此外返回的 code 还会将
 * method && fnExp 强制传递 $event
 * .exact 则除了在修饰列表中相应修饰符 才能正常执行 (也对键盘事件生效)
 * 针对非修饰符列表中的 key 进行键盘事件判断, 必须符合 keyCode || keyName 修饰
 * mark 有修饰符与无修饰符 handler 不一样，modifier 会直接执行
 */
function genHandler (
  name: string,
  handler: ASTElementHandler | Array<ASTElementHandler>
): string {
  if (!handler) {
    return 'function(){}'
  }

  if (Array.isArray(handler)) {
    return `[${handler.map(handler => genHandler(name, handler)).join(',')}]`
  }

  // 绑定至methods
  const isMethodPath = simplePathRE.test(handler.value)
  // function 表达式
  const isFunctionExpression = fnExpRE.test(handler.value)
  // method() 调用
  const isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''))

  // 无修饰符 => 如果是method || func 表达式 则直接返回，无需在编译期间做处理
  // 引用 fn($event) || exp 需要再外层套用 fn 方便编译时
  if (!handler.modifiers) {
    if (isMethodPath || isFunctionExpression) {
      return handler.value
    }
    /* istanbul ignore if */
    // if (__WEEX__ && handler.params) {
    if (false) {
      // return genWeexHandler(handler.params, handler.value)
    }
    return `function($event){${
      isFunctionInvocation ? `return ${handler.value}` : handler.value
    }}` // inline statement
  } else {
    let code = ''
    let genModifierCode = ''
    const keys = []
    for (const key in handler.modifiers) {
      if (modifierCode[key]) {
        genModifierCode += modifierCode[key]
        // left/right
        // 只有 left || right 存在于modifierCode 和 keyCodes, 将其加入键盘
        // 修饰符中
        if (keyCodes[key]) {
          keys.push(key)
        }

        // exact => ['ctrl', 'shift', 'alt', 'meta'] 不存在modifiers 时
        // 会忽略当次 handler , 配合上方modifierCode 的判断
        // 只有 modifiers[key] 按下才正常执行
        // exact 只针对特殊键
      } else if (key === 'exact') {
        const modifiers: ASTModifiers = handler.modifiers
        genModifierCode += genGuard(
          ['ctrl', 'shift', 'alt', 'meta']
            .filter(keyModifier => !modifiers[keyModifier])
            .map(keyModifier => `$event.${keyModifier}Key`)
            .join('||')
        )
      } else {
        // 非标准modifierCode 只记录到keys(用于对键盘事件的控制)
        keys.push(key)
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys)
    }
    // Make sure modifiers like prevent and stop get executed after key filtering
    if (genModifierCode) {
      code += genModifierCode
    }
    const handlerCode = isMethodPath
      ? `return ${handler.value}($event)`
      : isFunctionExpression
        ? `return (${handler.value})($event)`
        : isFunctionInvocation
          ? `return ${handler.value}`
          : handler.value
    /* istanbul ignore if */
    // if (__WEEX__ && handler.params) {
    //   return genWeexHandler(handler.params, code + handlerCode)
    // }
    return `function($event){${code}${handlerCode}}`
  }
}

/**
 * 根据 keys 对 handler 进行拦截 
 */
function genKeyFilter (keys: Array<string>): string {
  // 只对键盘事件生效
  return `if(!('button' in $event)&&${keys.map(genFilterCode).join('&&')})return null;`
}

/**
 * 如果传入是 10 进制数则针对 $event.keyCode !== keyVal 判断
 * keyCode && keyName 对比 $event.keyCode && $event.key
 * hyphenate($event.key) !== key
 * 结果不匹配则返回 true
 */
function genFilterCode (key: string): string {
  const keyVal = parseInt(key, 10)
  if (keyVal) {
    return `$event.keyCode!==${keyVal}`
  }

  // 非数字 key 对应的 code && name
  const keyCode = keyCodes[key]
  const keyName = keyNames[key]
  return (
    `_k($event.keyCode,` +
    `${JSON.stringify(key)},` +
    `${JSON.stringify(keyCode)},` +
    `$event.key,` +
    `${JSON.stringify(keyName)}` +
    `)`
  )
}
  