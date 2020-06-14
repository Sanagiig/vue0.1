/**
 * Cross-platform code generation for component v-model
 */
export function genComponentModel (
  el: ASTElement,
  value: string,
  modifiers: ASTModifiers
): boolean | void {
  const { number, trim } = modifiers || {}

  const baseValueExpression = '$$v'
  let valueExpression = baseValueExpression
  if (trim) {
    valueExpression =
      `(typeof ${baseValueExpression} === 'string'` +
      `? ${baseValueExpression}.trim()` +
      `: ${baseValueExpression})`
  }
  if (number) {
    valueExpression = `_n(${valueExpression})`
  }
  const assignment = genAssignmentCode(value, valueExpression)

  el.model = {
    value: `(${value})`,
    expression: JSON.stringify(value),
    callback: `function (${baseValueExpression}) {${assignment}}`
  }
}

/**
 * Parse a v-model expression into a base path and a final key segment.
 * Handles both dot-path and possible square brackets.
 *
 * Possible cases:
 *
 * - test
 * - test[key]
 * - test[test1[key]]
 * - test["a"][key]
 * - xxx.test[a[a].test1[key]]
 * - test.xxx.a["asa"][test1[key]]
 *
 */

let len:number, 
    str:string, 
    chr:number, 
    index:number, 
    expressionPos:number, 
    expressionEndPos:number

type ModelParseResult = {
  exp: string,
  key: string | null
}

// 解析 model 的表达式，将exp 和 最后的key 区分开，方便取绑定属性的值
export function parseModel (val: string): ModelParseResult {
  // Fix https://github.com/vuejs/vue/pull/7730
  // allow v-model="obj.val " (trailing whitespace)
  val = val.trim()
  len = val.length

  if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
    index = val.lastIndexOf('.')
    if (index > -1) {
      return {
        exp: val.slice(0, index),
        key: '"' + val.slice(index + 1) + '"'
      }
    } else {
      return {
        exp: val,
        key: null
      }
    }
  }

  str = val
  index = expressionPos = expressionEndPos = 0

  while (!eof()) {
    chr = next()
    /* istanbul ignore if */
    if (isStringStart(chr)) {
      parseString(chr)
      // [
    } else if (chr === 0x5B) {
      parseBracket(chr)
    }
  }

  return {
    exp: val.slice(0, expressionPos),
    key: val.slice(expressionPos + 1, expressionEndPos)
  }
}

/**
 * Cross-platform codegen helper for generating v-model value assignment code.
 */
export function genAssignmentCode (
  value: string,
  assignment: string
): string {
  const res = parseModel(value)
  if (res.key === null) {
    return `${value}=${assignment}`
  } else {
    return `$set(${res.exp}, ${res.key}, ${assignment})`
  }
}

// 下一个字符
function next (): number {
  return str.charCodeAt(++index)
}

function eof (): boolean {
  return index >= len
}

// 引号
function isStringStart (chr: number): boolean {
  // " || '
  return chr === 0x22 || chr === 0x27
}

// 跳过 [] ，expressionPos = [ && expressionEndPos = ]
function parseBracket (chr: number): void {
  let inBracket = 1
  expressionPos = index
  while (!eof()) {
    chr = next()
    if (isStringStart(chr)) {
      parseString(chr)
      continue
    }
    // [
    if (chr === 0x5B) inBracket++
    // ]
    if (chr === 0x5D) inBracket--
    if (inBracket === 0) {
      expressionEndPos = index
      break
    }
  }
}

// 跳过 "" || ''
function parseString (chr: number): void {
  const stringQuote = chr
  while (!eof()) {
    chr = next()
    if (chr === stringQuote) {
      break
    }
  }
}