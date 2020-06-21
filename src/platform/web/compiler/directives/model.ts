import config from '@config/index';
import { addHandler, addProp, getBindingAttr } from '@utils/index';
import {
  genComponentModel, genAssignmentCode
} from '@core/compiler/directives/model';

let warn:any

// in some cases, the event used has to be determined at runtime
// so we used some reserved tokens during compile.
export const RANGE_TOKEN = '__r'
export const CHECKBOX_RADIO_TOKEN = '__c'

export default function model (
  el: ASTElement,
  dir: ASTDirective,
  _warn: Function
): boolean | void {
  warn = _warn
  const value = dir.value
  const modifiers = dir.modifiers
  const tag = el.tag
  const type = el.attrsMap.type

  // 不允许在 input.type = file 中只用v-model
  if (process.env.NODE_ENV !== 'production') {
    // inputs with type="file" are read only and setting the input's
    // value will throw an error.
    if (tag === 'input' && type === 'file') {
      warn(
        `<${el.tag} v-model="${value}" type="file">:\n` +
        `File inputs are read only. Use a v-on:change listener instead.`,
        el.rawAttrsMap['v-model']
      )
    }
  }

  if (el.component) {
    genComponentModel(el, value, modifiers)
    // component v-model doesn't need extra runtime
    return false
  } else if (tag === 'select') {
    genSelect(el, value, modifiers)
  } else if (tag === 'input' && type === 'checkbox') {
    genCheckboxModel(el, value, modifiers)
  } else if (tag === 'input' && type === 'radio') {
    genRadioModel(el, value, modifiers)
  } else if (tag === 'input' || tag === 'textarea') {
    genDefaultModel(el, value, modifiers)
  } else if (!config.isReservedTag(tag)) {
    genComponentModel(el, value, modifiers)
    // component v-model doesn't need extra runtime
    return false
    // 不允许v-model 在非 input || select || textarea 上
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `<${el.tag} v-model="${value}">: ` +
      `v-model is not supported on this element type. ` +
      'If you are working with contenteditable, it\'s recommended to ' +
      'wrap a library dedicated for that purpose inside a custom component.',
      el.rawAttrsMap['v-model']
    )
  }

  // ensure runtime directive metadata
  return true
}

// 通过 ast 的 true || false 绑定值，确定 ast.props.checked 的值
// 生成 checkBox change 事件 code , 触发时修改 v-model 绑定的 value
// value 允许是数组,当修改 checkBox 状态时,会向数组添加或删除 ast.valueBinding
function genCheckboxModel (
  el: ASTElement,
  value: string,
  modifiers: ASTModifiers
) {
  const number = modifiers && modifiers.number
  const valueBinding = getBindingAttr(el, 'value') || 'null'
  const trueValueBinding = getBindingAttr(el, 'true-value') || 'true'
  const falseValueBinding = getBindingAttr(el, 'false-value') || 'false'
  
  // checked 的值通过 
  // --- v-model 绑定的是数组,则判断当前AST.value 是否存在其中
  // Array.isArray(value) 
  //  #? looseIndexOf(value, valueBinding) > -1 
  //   ---- 非数组，且 trueValueBinding 无绑定则 checked 值为 v-model,
  //   ----  否则对比 trueValueBinding 是否与 value 相等来确定checked
  //   : trueValueBinding === 'true' 
  //        #? value 
  //         : looseEqual(value, trueValueBinding)
  // 新增 checked prop code
  addProp(el, 'checked',
    `Array.isArray(${value})` +
    `?_i(${value},${valueBinding})>-1` + (
      trueValueBinding === 'true'
        ? `:(${value})`
        : `:_q(${value},${trueValueBinding})`
    )
  )

  // ---- v-model="value" 
  // var $$a = value , 
  //     $$el = $event.target,
  //     ---- $$c = (true || false)Value 根据 元素当前的 checked 确定
  //     $$c = $$el.checked ? trueValueBinding : falseValueBinding
  // 
  // if(Array.isArray($$a)){
  //   var $$v = number ? toNumber(valueBinding) : valueBinding;
  //       $$i = looseIndexOf($$a,$$v);
  //   ---- 如果绑定的值是数组
  //   ---- checked 会将 ast.value 添加进 value<any[]> 中,否则会从value中剔除
  //   if($$el.checked){
  //     $$i < 0 && value = $$a.concat([$$v])
  //   }else{
  //     $$i > -1 && value = $$a.slice(0,$$i).concat($$a.slice($$i+1))
  //   }
  // }else{
  //   value = $$c;
  // }
  // 为 checkBox AST 增加 change 事件
  addHandler(el, 'change',
    `var $$a=${value},` +
        '$$el=$event.target,' +
        `$$c=$$el.checked?(${trueValueBinding}):(${falseValueBinding});` +
    'if(Array.isArray($$a)){' +
      `var $$v=${number ? '_n(' + valueBinding + ')' : valueBinding},` +
          '$$i=_i($$a,$$v);' +
      `if($$el.checked){$$i<0&&(${genAssignmentCode(value, '$$a.concat([$$v])')})}` +
      `else{$$i>-1&&(${genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')})}` +
    `}else{${genAssignmentCode(value, '$$c')}}`,
    null, true
  )
}

// 单选组，v-model 绑定的值等于 ast.value || 'null'
function genRadioModel (
  el: ASTElement,
  value: string,
  modifiers: ASTModifiers | null
) {
  const number = modifiers && modifiers.number
  let valueBinding = getBindingAttr(el, 'value') || 'null'
  valueBinding = number ? `_n(${valueBinding})` : valueBinding
  addProp(el, 'checked', `_q(${value},${valueBinding})`)
  addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true)
}

// 生成修改 value 的 code 
// 在ast 节点上新增change 事件 ， 事件触发则调用 修改 value 的code
function genSelect (
  el: ASTElement,
  value: string,
  modifiers: ASTModifiers
) {
  const number = modifiers && modifiers.number

  // $event.target.options.filter(o => o.selected).map(o => {
  //  var val = "_value" in o  ? o._value : o.value;
  //  return number ? _(val) : val;
  // })
  // select 选中的 option[_value || value]
  const selectedVal = `Array.prototype.filter` +
    `.call($event.target.options,function(o){return o.selected})` +
    `.map(function(o){var val = "_value" in o ? o._value : o.value;` +
    `return ${number ? '_n(val)' : 'val'}})`

  const assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]'
  let code = `var $$selectedVal = ${selectedVal};`
  code = `${code} ${genAssignmentCode(value, assignment)}`
  addHandler(el, 'change', code, null, true)
}

// 其余 input || textarea
// change,range,RANGE_TOKEN,input 事件修改 v-model 的 code
// 增加输入保护, blur 时强制更新vm
function genDefaultModel (
  el: ASTElement | any,
  value: string,
  modifiers: ASTModifiers
): boolean | void{
  const type = el.attrsMap.type

  // warn if v-bind:value conflicts with v-model
  // except for inputs with v-bind:type
  // 防止 v-model && v-bind:value 冲突
  if (process.env.NODE_ENV !== 'production') {
    const value = el.attrsMap['v-bind:value'] || el.attrsMap[':value']
    const typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type']
    if (value && !typeBinding) {
      const binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value'
      warn(
        `${binding}="${value}" conflicts with v-model on the same element ` +
        'because the latter already expands to a value binding internally',
        el.rawAttrsMap[binding]
      )
    }
  }

  const { lazy, number, trim } = modifiers || {}
  // 正在输入... 的保护
  const needCompositionGuard = !lazy && type !== 'range'
  // lazy => change 
  // 如果 input 是 range 则将事件 定为 RANGE_TOKEN(__r)
  const event = lazy
    ? 'change'
    : type === 'range'
      ? RANGE_TOKEN
      : 'input'

  let valueExpression = '$event.target.value'
  if (trim) {
    valueExpression = `$event.target.value.trim()`
  }
  if (number) {
    valueExpression = `_n(${valueExpression})`
  }

  // 事件返回值 code
  let code = genAssignmentCode(value, valueExpression)
  // 正在输入保护
  if (needCompositionGuard) {
    code = `if($event.target.composing)return;${code}`
  }

  // 为其新增 ast.props.value
  addProp(el, 'value', `(${value})`)
  addHandler(el, event, code, null, true)
  // 存在修饰符则 blur 强制更新
  if (trim || number) {
    addHandler(el, 'blur', '$forceUpdate()')
  }
}
